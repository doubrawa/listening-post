// Main app — header, genre rail, layout, filtering logic
const { useState, useMemo, useEffect } = React;

// "today" anchor — fixed for predictable demo behavior
const TODAY = new Date("2026-05-09");

const DEFAULT_FILTERS = {
  sort: "newest",
  window: "30d",
  mediums: [],
  styles: [],
  artists: [],
  artistQuery: "",
  search: "",
};

function App() {
  const [genre, setGenre] = useState("Soundtracks");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [openRelease, setOpenRelease] = useState(null);
  const [view, setView] = useState("grid"); // 'grid' | 'list'

  // Reset medium filter when leaving Soundtracks
  useEffect(() => {
    if (genre !== "Soundtracks" && filters.mediums.length) {
      setFilters(f => ({ ...f, mediums: [] }));
    }
  }, [genre]);

  function setFilter(key, value) {
    setFilters(prev => {
      if (key === "toggleMedium") {
        const ms = prev.mediums.includes(value)
          ? prev.mediums.filter(m => m !== value)
          : [...prev.mediums, value];
        return { ...prev, mediums: ms };
      }
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

  // ── compute artist list for the genre ──
  const allArtists = useMemo(() => {
    const subset = genre === "All" ? RELEASES : RELEASES.filter(r => r.genre === genre);
    return Array.from(new Set(subset.map(r => r.artist))).sort();
  }, [genre]);

  // ── apply filters ──
  const filtered = useMemo(() => {
    let xs = RELEASES;
    if (genre !== "All") xs = xs.filter(r => r.genre === genre);

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      xs = xs.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.artist.toLowerCase().includes(q) ||
        (r.source || "").toLowerCase().includes(q)
      );
    }

    if (filters.window !== "all") {
      const cutoff = new Date(TODAY);
      if (filters.window === "7d")   cutoff.setDate(cutoff.getDate() - 7);
      if (filters.window === "30d")  cutoff.setDate(cutoff.getDate() - 30);
      if (filters.window === "90d")  cutoff.setDate(cutoff.getDate() - 90);
      if (filters.window === "year") cutoff.setMonth(0, 1);
      xs = xs.filter(r => new Date(r.date) >= cutoff);
    }

    if (filters.mediums.length) xs = xs.filter(r => filters.mediums.includes(r.medium));
    if (filters.styles.length)  xs = xs.filter(r => r.styles.some(s => filters.styles.includes(s)));
    if (filters.artists.length) xs = xs.filter(r => filters.artists.includes(r.artist));

    // sort
    xs = [...xs];
    if (filters.sort === "newest") xs.sort((a, b) => b.date.localeCompare(a.date));
    if (filters.sort === "oldest") xs.sort((a, b) => a.date.localeCompare(b.date));
    if (filters.sort === "artist") xs.sort((a, b) => a.artist.localeCompare(b.artist));
    if (filters.sort === "title")  xs.sort((a, b) => a.title.localeCompare(b.title));
    return xs;
  }, [genre, filters]);

  const heroRelease = filtered[0];
  const gridReleases = filtered.slice(1);

  function onSpotify(r) {
    // Simulated link-out — would use r.spotifyUrl in real wiring
    window.open(r.spotifyUrl, "_blank", "noopener");
  }

  function onReset() {
    setFilters(DEFAULT_FILTERS);
  }

  // ── counts per genre, for tab badges ──
  const genreCounts = useMemo(() => {
    const counts = { All: RELEASES.length };
    for (const r of RELEASES) counts[r.genre] = (counts[r.genre] || 0) + 1;
    return counts;
  }, []);

  return (
    <>
      {/* HEADER */}
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
                  NEW RELEASES · INDEX №24
                </div>
              </div>
            </div>
          </div>

          {/* search */}
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
              placeholder="Search title, artist, source…"
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
              MAY 09 · 2026
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
          </div>
        </div>

        {/* GENRE RAIL */}
        <div style={{ overflowX: "auto", borderTop: "1px solid var(--line-soft)" }}>
          <div style={{ display: "flex", gap: 0, padding: "0 32px" }}>
            {GENRES.map(g => {
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

      {/* BODY */}
      <main style={{ display: "flex", alignItems: "flex-start" }}>
        <FilterPanel
          filters={filters}
          setFilter={setFilter}
          allArtists={allArtists}
          isSoundtracks={genre === "Soundtracks"}
          resultCount={filtered.length}
          onReset={onReset}
        />

        <section style={{ flex: 1, minWidth: 0, padding: "0 32px" }}>
          {/* Section header */}
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

// Active filter chips that show above the grid
function ActiveChips({ filters, setFilter }) {
  const chips = [];
  filters.mediums.forEach(m => chips.push({ k: "med-"+m, label: m,
    drop: () => setFilter("toggleMedium", m) }));
  filters.styles.forEach(s => chips.push({ k: "sty-"+s, label: s,
    drop: () => setFilter("toggleStyle", s) }));
  filters.artists.forEach(a => chips.push({ k: "art-"+a, label: a,
    drop: () => setFilter("toggleArtist", a) }));
  if (filters.search) chips.push({ k: "search", label: `“${filters.search}”`,
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

// Compact list view
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
        gridTemplateColumns: "60px 1.4fr 1fr 110px 100px 0.9fr 40px",
        gap: 16, padding: "8px 0",
        borderBottom: "1px solid var(--line)",
        color: "var(--fg-3)",
        fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
        letterSpacing: "0.12em", textTransform: "uppercase",
      }}>
        <span></span><span>Title</span><span>Artist</span><span>Date</span>
        <span>Medium</span><span>Style</span><span></span>
      </div>
      {releases.map(r => (
        <div key={r.id} onClick={() => onOpen(r)}
          style={{
            display: "grid",
            gridTemplateColumns: "60px 1.4fr 1fr 110px 100px 0.9fr 40px",
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
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {r.medium ? r.medium.toUpperCase() : "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
            {r.styles.slice(0, 2).join(" · ")}
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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
