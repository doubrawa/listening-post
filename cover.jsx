// Renders Spotify album art. Falls back to a typographic placeholder
// if the release has no image (rare but possible for very small artists).

function Cover({ release }) {
  if (release.imageUrl) {
    return (
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        overflow: "hidden",
        borderRadius: 2,
        background: "var(--bg-3)",
      }}>
        <img
          src={release.imageUrl}
          alt={release.title}
          loading="lazy"
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
          }}
        />
      </div>
    );
  }

  const initials = (release.artist || "?")
    .split(/[\s,]+/).filter(Boolean)
    .map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: "100%",
      aspectRatio: "1 / 1",
      borderRadius: 2,
      background: "var(--bg-3)",
      color: "var(--fg-3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Newsreader, serif", fontStyle: "italic",
      fontSize: "2.4rem",
    }}>
      {initials}
    </div>
  );
}

window.Cover = Cover;
