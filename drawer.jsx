// Slide-in detail drawer
function Drawer({ release, onClose, onSpotify }) {
  React.useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!release) return null;

  // Fake tracklist generation
  const tracks = Array.from({ length: release.tracks }, (_, i) => ({
    n: i + 1,
    name: TRACK_NAMES[(release.id * 7 + i) % TRACK_NAMES.length],
    dur: `${1 + ((release.id + i) % 5)}:${String(10 + ((release.id * 11 + i * 17) % 50)).padStart(2, "0")}`,
  }));

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 50, animation: "fadeIn 0.2s ease",
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(560px, 92vw)",
        background: "var(--bg-2)",
        borderLeft: "1px solid var(--line)",
        zIndex: 51, overflowY: "auto",
        animation: "slideIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)",
        boxShadow: "-30px 0 60px rgba(0,0,0,0.4)",
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: 16, right: 16, zIndex: 2,
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--bg-3)", color: "var(--fg-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>×</button>

        <div style={{ padding: "32px 36px 24px" }}>
          <div style={{ width: "min(100%, 320px)", margin: "0 auto 28px" }}>
            <Cover release={release} />
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--accent)",
              letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
            {fmtDate(release.date)} · {daysAgo(release.date).toLowerCase()}
          </div>
          <h2 className="serif" style={{
            fontSize: "2.2rem", fontStyle: "italic", lineHeight: 1.05,
            margin: "0 0 8px", fontWeight: 500, letterSpacing: "-0.02em",
          }}>
            {release.title}
          </h2>
          <div style={{ fontSize: 16, color: "var(--fg-2)", marginBottom: 14 }}>
            {release.artist}
            {release.source && <> · <span style={{ fontStyle: "italic" }}>{release.source}</span></>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            <span className="pill solid">{release.genre}</span>
            {release.medium && <span className="pill">{release.medium}</span>}
            {release.styles.map(s => <span key={s} className="pill">{s}</span>)}
          </div>

          <button onClick={() => onSpotify(release)} style={{
            width: "100%", background: "var(--accent)", color: "var(--bg)",
            padding: "13px", borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Listen on Spotify
          </button>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px",
            background: "var(--line-soft)",
            border: "1px solid var(--line-soft)",
            margin: "24px 0",
          }}>
            {[
              ["Label",    release.label],
              ["Tracks",   release.tracks],
              ["Length",   release.duration],
              ["Released", new Date(release.date).toLocaleDateString("en-US",
                            { month: "long", day: "numeric", year: "numeric" })],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bg-2)", padding: "12px 14px" }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)",
                    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 13, color: "var(--fg)" }}>{v}</div>
              </div>
            ))}
          </div>

          <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)",
              letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
            Tracklist
          </div>
          <div>
            {tracks.map(t => (
              <div key={t.n} style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                alignItems: "center",
                padding: "9px 0",
                borderBottom: "1px solid var(--line-soft)",
                fontSize: 13.5,
              }}>
                <span className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>
                  {String(t.n).padStart(2, "0")}
                </span>
                <span style={{ color: "var(--fg)" }}>{t.name}</span>
                <span className="mono" style={{ color: "var(--fg-3)", fontSize: 11 }}>{t.dur}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}

const TRACK_NAMES = [
  "Overture", "First Light", "The Approach", "Slow Procession", "A Quiet Room",
  "Threshold", "The Long Field", "Drift", "Memory of Salt", "Vespers",
  "Iron Door", "The Letter", "Cold Stations", "Houseguest", "Slow Tide",
  "Mountains in Motion", "Bird's Eye", "After Rain", "Night Watch", "Lantern",
  "Glass and Gold", "Vanishing Point", "Hollow Reach", "Atlas Drift", "Concord",
  "Quiet Engine", "Field Magnet", "Late Show", "Burner", "Riverine",
  "Pendulum", "Études", "Horizon", "Halflight", "Patterns at Dusk",
  "End Credits",
];

window.Drawer = Drawer;
