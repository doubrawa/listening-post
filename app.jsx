// Main app — login gate, data loading, filtering and layout.
const { useState, useMemo, useEffect } = React;

const DEFAULT_FILTERS = {
  sort: "newest",
  window: "all",
  styles: [],
  artists: [],
  artistQuery: "",
  search: "",
};

function App() {
  // auth + load lifecycle
  const [authState, setAuthState] = useState("checking");   // "checking" | "in" | "out"
  const [loadState, setLoadState] = useState("idle");       // "idle" | "loading" | "loaded" | "error"
  const [error, setError]         = useState(null);
  const [releases, setReleases]   = useState([]);

  // UI state
  const [genre, setGenre]         = useState("All");
  const [filters, setFilters]     = useState(DEFAULT_FILTERS);
  const [openRelease, setOpenRelease] = useState(null);
  const [view, setView]           = useState("grid");

  useEffect(() => {
    (async () => {
      try {
        await Auth.handleRedirect();
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      if (Auth.isLoggedIn()) {
        setAuthState("in");
        loadReleases();
      } else {
        setAuthState("out");
      }
    })();
  }, []);

  async function loadReleases() {
    setLoadState("loading");
    try {
      const albums = await Spotify.fetchNewReleases();
      const items  = albums.items || [];

      // Phase 1 — show albums quickly without genre data
      let mapped = items.map(a => Data.fromSpotifyAlbum(a, {}));
      setReleases(mapped);
      setLoadState("loaded");

      // Phase 2 — fetch artists to derive genre buckets. Soft-fail:
      // if the artist endpoints are also restricted for this app, keep
      // the releases visible without genre tags rather than erroring.
      try {
        const artistIds = items.flatMap(a => (a.artists || []).map(ar => ar.id));
        const artists   = await Spotify.fetchArtists(artistIds);
        mapped = items.map(a => Data.fromSpotifyAlbum(a, artists));
        setReleases(mapped);

        const allGenres = Object.values(artists).flatMap(a => a.genres || []);
        const unmatched = window.Genres.unmatchedGenres(allGenres);
        if (unmatched.length) {
          console.log("[listening-post] unmatched Spotify genres:", unmatched);
        }
      } catch (e) {
        console.warn("[listening-post] artist fetch failed — genre buckets disabled:", e.message);
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
      setLoadState("error");
    }
  }

  function setFilter(key, value) {
    setFilters(prev => {
      if (key === "toggleStyle") {
        const ss = prev.styles.includes(value)
          ? prev.styles.filter(s => s !== value)
          : [...prev.styles, value];
        return { ...prev, styles: ss };
      }
      if (key === "toggleArtist") {
        const as = prev.artists.includes(value)
          ? prev.artists.filter(a => a !== value)
          : [...prev.artists, value];
        return { ...prev, artists: as };
      }
      return { ...prev, [key]: value };
    });
  }

  function inGenre(r, g) {
    if (g === "All") return true;
    if (g === "Other") return !r.buckets?.length;
    return r.buckets?.includes(g);
  }

  const allArtists = useMemo(() => {
    const subset = releases.filter(r => inGenre(r, genre));
    return [...new Set(subset.map(r => r.artist))].sort();
  }, [releases, genre]);

  const allStyles = useMemo(() => {
    const counts = new Map();
    for (const r of releases) {
      if (!inGenre(r, genre)) continue;
      for (const s of r.styles || []) {
        counts.set(s, (counts.get(s) || 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  }, [releases, genre]);

  const genreCounts = useMemo(() => {
    const counts = { All: releases.length, Other: 0 };
    for (const r of releases) {
      if (!r.buckets?.length) counts.Other += 1;
      for (const b of r.buckets || []) {
        counts[b] = (counts[b] || 0) + 1;
      }
    }
    return counts;
  }, [releases]);

  const visibleGenres = useMemo(() => {
    return window.GENRES.filter(g => g === "All" || (genreCounts[g] || 0) > 0);
  }, [genreCounts]);

  const filtered = useMemo(() => {
    let xs = releases.filter(r => inGenre(r, genre));

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      xs = xs.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.artist.toLowerCase().includes(q) ||
        (r.label || "").toLowerCase().includes(q)
      );
    }

    if (filters.window !== "all") {
      const cutoff = new Date();
      if (filters.window === "7d")   cutoff.setDate(cutoff.getDate() - 7);
      if (filters.window === "30d")  cutoff.setDate(cutoff.getDate() - 30);
      if (filters.window === "90d")  cutoff.setDate(cutoff.getDate() - 90);
      if (filters.window === "year") cutoff.setMonth(0, 1);
      xs = xs.filter(r => r.date && new Date(r.date) >= cutoff);
    }

    if (filters.styles.length)  xs = xs.filter(r => (r.styles || []).some(s => filters.styles.includes(s)));
    if (filters.artists.length) xs = xs.filter(r => filters.artists.includes(r.artist));

    xs = [...xs];
    if (filters.sort === "newest") xs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (filters.sort === "oldest") xs.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (filters.sort === "artist") xs.sort((a, b) => a.artist.localeCompare(b.artist));
    if (filters.sort === "title")  xs.sort((a, b) => a.title.localeCompare(b.title));
    return xs;
  }, [releases, genre, filters]);

  const heroRelease  = filtered[0];
  const gridReleases = filtered.slice(1);

  function onSpotify(r) {
    if (r.spotifyUrl) window.open(r.spotifyUrl, "_blank", "noopener");
  }

  function onReset() {
    setFilters(DEFAULT_FILTERS);
  }

  if (authState === "checking") return <Splash text="Loading…" />;
  if (authState === "out")      return <LoginScreen />;
  if (loadState === "error")    return <ErrorScreen error={error} />;
  if (loadState === "loading" && releases.length === 0) {
    return <Splash text="Fetching new releases…" />;
  }

  const todayLabel = new Date()
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toUpperCase();

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--line-soft)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 4,
                background: "var(--accent)", color: "var(--bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M3 18 V12 a9 9 0 0 1 18 0 V18" />
                  <rect x="3" y="14" width="5" height="7" rx="1" fill="currentColor" stroke="none" />
                  <rect x="16" y="14" width="5" height="7" rx="1" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div>
                <div className="serif" style={{ fontSize: 19, fontStyle: "italic",
                    lineHeight: 1, fontWeight: 600 }}>
                  Listening Post
                </div>
                <div className="mono" style={{ fontSize: 9, color: "var(--fg-3)",
                    letterSpacing: "0.16em", marginTop: 2 }}>
                  NEW RELEASES · {releases.length} ALBUMS
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: "relative", width: 360, maxWidth: "40vw" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="var(--fg-3)" strokeWidth="2"
                 style={{ position: "absolute", left: 12, top: "50%",
                          transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={filters.search}
              onChange={e => setFilter("search", e.target.value)}
              placeholder="Search title, artist, label…"
              style={{
                width: "100%", padding: "9px 14px 9px 34px",
                background: "var(--bg-2)", color: "var(--fg)",
                border: "1px solid var(--line)", borderRadius: 999,
                fontSize: 13, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--line)"}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)",
                letterSpacing: "0.14em" }}>
              {todayLabel}
            </div>
            <div style={{ display: "flex", border: "1px solid var(--line)",
                          borderRadius: 6, overflow: "hidden" }}>
              {[
                { v: "grid", icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></> },
                { v: "list", icon: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></> },
              ].map(b => (
                <button key={b.v} onClick={() => setView(b.v)}
                  style={{
                    padding: "6px 10px",
                    background: view === b.v ? "var(--bg-3)" : "transparent",
                    color: view === b.v ? "var(--fg)" : "var(--fg-3)",
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                       stroke="currentColor" strokeWidth="1.6">
                    {b.icon}
                  </svg>
                </button>
              ))}
            </div>
            <button onClick={Auth.logout} className="mono"
              style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                       color: "var(--fg-3)", padding: "6px 10px",
                       border: "1px solid var(--line)", borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--fg)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--fg-3)"}>
              Sign out
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto", borderTop: "1px solid var(--line-soft)" }}>
          <div style={{ display: "flex", gap: 0, padding: "0 32px" }}>
            {visibleGenres.map(g => {
              const active = genre === g;
              return (
                <button key={g} onClick={() => setGenre(g)}
                  style={{
                    padding: "12px 16px",
                    color: active ? "var(--accent)" : "var(--fg-2)",
                    borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                    fontFamily: "Newsreader, serif",
                    fontStyle: "italic",
                    fontSize: 17,
                    fontWeight: active ? 600 : 500,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    display: "flex", alignItems: "baseline", gap: 6,
                  }}>
                  {g}
                  <span className="mono" style={{
                    fontSize: 10, color: active ? "var(--accent)" : "var(--fg-3)",
                    letterSpacing: "0.04em", fontStyle: "normal",
                  }}>
                    {genreCounts[g] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main style={{ display: "flex", alignItems: "flex-start" }}>
        <FilterPanel
          filters={filters}
          setFilter={setFilter}
          allArtists={allArtists}
          allStyles={allStyles}
          resultCount={filtered.length}
          onReset={onReset}
        />

        <section style={{ flex: 1, minWidth: 0, padding: "0 32px" }}>
          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            padding: "26px 0 0",
          }}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)",
                  letterSpacing: "0.16em", textTransform: "uppercase" }}>
                Currently browsing
              </div>
              <h2 className="serif" style={{
                fontSize: "2.2rem", margin: "4px 0 0",
                fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.02em",
              }}>
                {genre === "All" ? "Everything new" : genre}
                <span style={{ color: "var(--fg-3)", fontStyle: "normal",
                    fontFamily: "IBM Plex Mono, monospace", fontSize: "0.65em",
                    marginLeft: 12, letterSpacing: "0.05em" }}>
                  ({filtered.length})
                </span>
              </h2>
            </div>
            <ActiveChips filters={filters} setFilter={setFilter} />
          </div>

          {heroRelease && <Hero release={heroRelease} onOpen={setOpenRelease} onSpotify={onSpotify} />}

          {view === "grid" ? (
            <Grid releases={gridReleases} onOpen={setOpenRelease} onSpotify={onSpotify} />
          ) : (
            <ListView releases={gridReleases} onOpen={setOpenRelease} onSpotify={onSpotify} />
          )}
        </section>
      </main>

      <Drawer release={openRelease} onClose={() => setOpenRelease(null)} onSpotify={onSpotify} />
    </>
  );
}

function ActiveChips({ filters, setFilter }) {
  const chips = [];
  filters.styles.forEach(s => chips.push({ k: "sty-"+s, label: s,
    drop: () => setFilter("toggleStyle", s) }));
  filters.artists.forEach(a => chips.push({ k: "art-"+a, label: a,
    drop: () => setFilter("toggleArtist", a) }));
  if (filters.search) chips.push({ k: "search", label: `"${filters.search}"`,
    drop: () => setFilter("search", "") });

  if (!chips.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end",
                  maxWidth: "60%" }}>
      {chips.map(c => (
        <button key={c.k} onClick={c.drop} className="pill accent"
          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {c.label}
          <span style={{ fontSize: 12, lineHeight: 1 }}>×</span>
        </button>
      ))}
    </div>
  );
}

function ListView({ releases, onOpen, onSpotify }) {
  if (!releases.length) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "var(--fg-3)" }}
           className="mono">— END OF LIST —</div>
    );
  }
  return (
    <div style={{ padding: "0 0 60px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "60px 1.4fr 1fr 110px 1fr 40px",
        gap: 16, padding: "8px 0",
        borderBottom: "1px solid var(--line)",
        color: "var(--fg-3)",
        fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
        letterSpacing: "0.12em", textTransform: "uppercase",
      }}>
        <span></span><span>Title</span><span>Artist</span><span>Date</span>
        <span>Style</span><span></span>
      </div>
      {releases.map(r => (
        <div key={r.id} onClick={() => onOpen(r)}
          style={{
            display: "grid",
            gridTemplateColumns: "60px 1.4fr 1fr 110px 1fr 40px",
            gap: 16, padding: "12px 0", alignItems: "center",
            borderBottom: "1px solid var(--line-soft)",
            cursor: "pointer",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div style={{ width: 48 }}><Cover release={r} /></div>
          <div className="serif" style={{ fontSize: 17, fontStyle: "italic" }}>{r.title}</div>
          <div style={{ color: "var(--fg-2)" }}>{r.artist}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {fmtDate(r.date)}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
            {(r.styles || []).slice(0, 2).join(" · ")}
          </div>
          <button onClick={e => { e.stopPropagation(); onSpotify(r); }}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "1px solid var(--line)",
              color: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function Splash({ text }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
    }}>
      <div className="serif" style={{ fontSize: 30, fontStyle: "italic", color: "var(--fg-2)" }}>
        Listening Post
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)",
          letterSpacing: "0.18em", textTransform: "uppercase" }}>
        {text}
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24, padding: 32,
    }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)",
          letterSpacing: "0.2em", textTransform: "uppercase" }}>
        № 24 · NEW RELEASES INDEX
      </div>
      <h1 className="serif" style={{
        fontSize: "clamp(3rem, 7vw, 5rem)", fontStyle: "italic", margin: 0,
        fontWeight: 500, letterSpacing: "-0.02em", textAlign: "center",
        textWrap: "balance",
      }}>
        Listening Post
      </h1>
      <p style={{ maxWidth: 460, textAlign: "center", color: "var(--fg-2)",
                  fontSize: 16, lineHeight: 1.6, margin: 0 }}>
        Browse what&rsquo;s new on Spotify — across genres, with style and
        composer filters. Sign in with your Spotify account to begin.
      </p>
      <button onClick={Auth.startLogin} style={{
        background: "var(--accent)", color: "var(--bg)",
        padding: "13px 24px", borderRadius: 999,
        fontSize: 14, fontWeight: 600,
        display: "inline-flex", alignItems: "center", gap: 10,
        marginTop: 8,
      }}>
        Connect to Spotify
      </button>
      <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)",
          letterSpacing: "0.14em", marginTop: 24 }}>
        no data leaves your browser · public catalog only
      </div>
    </div>
  );
}

function ErrorScreen({ error }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16, padding: 32,
    }}>
      <div className="serif" style={{ fontSize: 30, fontStyle: "italic", color: "var(--danger)" }}>
        Something went wrong.
      </div>
      <div className="mono" style={{ fontSize: 12, color: "var(--fg-3)",
          maxWidth: 600, textAlign: "center" }}>
        {error}
      </div>
      <button onClick={() => window.location.reload()} className="mono"
        style={{ fontSize: 11, color: "var(--fg)", letterSpacing: "0.12em",
                 textTransform: "uppercase", padding: "8px 14px",
                 border: "1px solid var(--line)", borderRadius: 4 }}>
        Reload
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
