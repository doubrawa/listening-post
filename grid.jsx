// Release grid + featured hero
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
}

function daysAgo(iso) {
  if (!iso) return "";
  const today = new Date();
  const d = new Date(iso);
  const ms = today - d;
  const days = Math.round(ms / 86400000);
  if (days <= 0) return "TODAY";
  if (days === 1) return "1 DAY AGO";
  if (days < 7)  return `${days} DAYS AGO`;
  if (days < 14) return "1 WEEK AGO";
  if (days < 30) return `${Math.floor(days/7)} WEEKS AGO`;
  return `${Math.floor(days/30)} MO AGO`;
}

function Card({ release, onOpen, onSpotify }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(release)}
      style={{
        cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 10,
        transition: "transform 0.18s ease",
        transform: hover ? "translateY(-2px)" : "none",
      }}>
      <div style={{ position: "relative" }}>
        <Cover release={release} />
        <button
          onClick={e => { e.stopPropagation(); onSpotify(release); }}
          aria-label="Open in Spotify"
          style={{
            position: "absolute", right: 8, bottom: 8,
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--accent)", color: "var(--bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: hover ? 1 : 0,
            transform: hover ? "translateY(0)" : "translateY(6px)",
            transition: "all 0.18s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)",
            letterSpacing: "0.12em", display: "flex", gap: 8 }}>
          <span>{fmtDate(release.date)}</span>
          {release.buckets?.[0] && (
            <>
              <span style={{ color: "var(--line)" }}>·</span>
              <span>{release.buckets[0].toUpperCase()}</span>
            </>
          )}
        </div>
        <div className="serif" style={{ fontSize: 18, lineHeight: 1.15,
            fontStyle: "italic", textWrap: "pretty" }}>
          {release.title}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-2)" }}>{release.artist}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          {(release.styles || []).slice(0, 2).map(s => (
            <span key={s} className="mono" style={{
              fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.04em",
            }}>· {s.toLowerCase()}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero({ release, onOpen, onSpotify }) {
  if (!release) return null;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "minmax(220px, 320px) 1fr",
      gap: 32, padding: "32px 0 40px",
      borderBottom: "1px solid var(--line-soft)",
      marginBottom: 28,
    }}>
      <div onClick={() => onOpen(release)} style={{ cursor: "pointer" }}>
        <Cover release={release} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--accent)",
            letterSpacing: "0.18em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 24, height: 1, background: "var(--accent)" }} />
          Latest · {daysAgo(release.date).toLowerCase()}
        </div>
        <h1 className="serif" style={{
          fontSize: "clamp(2.4rem, 4.5vw, 4rem)", lineHeight: 1, margin: 0,
          fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.02em",
          textWrap: "balance",
        }}>
          {release.title}
        </h1>
        <div style={{ fontSize: 17, color: "var(--fg-2)" }}>
          <span className="serif" style={{ fontStyle: "italic" }}>by</span>{" "}
          <strong style={{ fontWeight: 500, color: "var(--fg)" }}>{release.artist}</strong>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(release.buckets || []).map(b => <span key={b} className="pill solid">{b}</span>)}
          {(release.styles || []).slice(0, 6).map(s => <span key={s} className="pill">{s}</span>)}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)",
            letterSpacing: "0.08em", display: "flex", gap: 16, marginTop: 4 }}>
          {release.tracks != null && <span>{release.tracks} tracks</span>}
          {release.label && <span>{release.label}</span>}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => onSpotify(release)} style={{
            background: "var(--accent)", color: "var(--bg)",
            padding: "10px 18px", borderRadius: 999,
            fontSize: 13, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Listen on Spotify
          </button>
          <button onClick={() => onOpen(release)} style={{
            border: "1px solid var(--line)", color: "var(--fg)",
            padding: "10px 18px", borderRadius: 999, fontSize: 13,
          }}>
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function Grid({ releases, onOpen, onSpotify }) {
  if (releases.length === 0) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--fg-3)" }}>
        <div className="serif" style={{ fontSize: 28, fontStyle: "italic", marginBottom: 8 }}>
          Nothing here.
        </div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.1em" }}>
          TRY LOOSENING YOUR FILTERS
        </div>
      </div>
    );
  }
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      gap: "32px 24px",
      padding: "0 0 60px",
    }}>
      {releases.map(r => (
        <Card key={r.id} release={r} onOpen={onOpen} onSpotify={onSpotify} />
      ))}
    </div>
  );
}

Object.assign(window, { Grid, Hero, fmtDate, daysAgo });
