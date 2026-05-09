// Generative cover art — abstract gradient + typographic glyph.
// Stand-in until real Spotify album art is wired up.

function Cover({ release, size = 240, withText = true }) {
  const { palette, angle, shape } = release.cover;
  const [c1, c2, c3] = palette;
  const initials = release.artist.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // Several abstract compositions, picked by shape index
  const Shapes = [
    // 0 — diagonal split
    <g key="0">
      <rect width="100" height="100" fill={c1} />
      <polygon points="0,100 100,0 100,100" fill={c2} />
      <circle cx="22" cy="22" r="10" fill={c3} opacity="0.85" />
    </g>,
    // 1 — concentric arcs (sun)
    <g key="1">
      <rect width="100" height="100" fill={c1} />
      <circle cx="50" cy="78" r="48" fill={c2} />
      <circle cx="50" cy="78" r="30" fill={c3} opacity="0.7" />
      <circle cx="50" cy="78" r="14" fill={c1} />
    </g>,
    // 2 — vertical stripes
    <g key="2">
      <rect width="100" height="100" fill={c1} />
      <rect x="0"  y="0" width="20" height="100" fill={c2} />
      <rect x="40" y="0" width="8"  height="100" fill={c3} />
      <rect x="62" y="0" width="2"  height="100" fill={c2} />
      <rect x="78" y="0" width="14" height="100" fill={c3} opacity="0.6" />
    </g>,
    // 3 — horizon
    <g key="3">
      <rect width="100" height="100" fill={c1} />
      <rect y="55" width="100" height="45" fill={c2} />
      <rect y="55" width="100" height="2" fill={c3} />
      <circle cx="72" cy="36" r="14" fill={c3} opacity="0.85" />
    </g>,
    // 4 — quadrants
    <g key="4">
      <rect width="50"  height="50"  fill={c1} />
      <rect x="50" width="50" height="50"  fill={c2} />
      <rect y="50" width="50" height="50"  fill={c3} />
      <rect x="50" y="50" width="50" height="50" fill={c1} />
      <circle cx="50" cy="50" r="6" fill={c3} />
    </g>,
  ];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1",
      overflow: "hidden",
      background: c1,
      borderRadius: 2,
    }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
           style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                    transform: `rotate(${angle}deg) scale(1.4)`, transformOrigin: "center" }}>
        {Shapes[shape]}
      </svg>
      {/* film-grain veil */}
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(0,0,0,0.35), transparent 60%)",
        mixBlendMode: "overlay",
      }} />
      {withText && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "10% 10%",
          color: c3,
        }}>
          <div className="mono" style={{ fontSize: "0.62rem", letterSpacing: "0.12em",
              opacity: 0.85, textTransform: "uppercase" }}>
            {release.label}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div className="serif" style={{ fontSize: "2.2rem", lineHeight: 1, fontWeight: 600,
              fontStyle: "italic", color: c3,
              textShadow: "0 1px 0 rgba(0,0,0,0.25)" }}>
              {initials}
            </div>
            <div className="mono" style={{ fontSize: "0.55rem", opacity: 0.75,
                letterSpacing: "0.08em", textAlign: "right" }}>
              {release.date.slice(2).replace(/-/g, ".")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.Cover = Cover;
