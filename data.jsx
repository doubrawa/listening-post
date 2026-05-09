// Transforms a Spotify album object (+ optional artist data) into the
// shape the UI renders. Genre buckets are derived from the primary
// artist's genre tags via Genres.bucketsFor().

function normalizeDate(date, precision) {
  if (!date) return null;
  if (precision === "year")  return `${date}-01-01`;
  if (precision === "month") return `${date}-01`;
  return date;
}

function fromSpotifyAlbum(album, artistsById = {}) {
  const primary = album.artists?.[0];
  // Genre/style data may travel on the album itself (when the loader
  // already had the artist) or come from a separately-fetched artist map.
  const artistGenres = album._artistGenres
    || (primary && artistsById[primary.id]?.genres)
    || [];
  const buckets = album._buckets && album._buckets.length
    ? album._buckets
    : window.Genres.bucketsFor(artistGenres);

  return {
    id:        album.id,
    title:     album.name,
    artist:    (album.artists || []).map(a => a.name).join(", "),
    artistIds: (album.artists || []).map(a => a.id),
    date:      normalizeDate(album.release_date, album.release_date_precision),
    buckets,
    medium:    null,
    source:    null,
    styles:    artistGenres,
    label:     album.label || null,
    tracks:    album.total_tracks,
    duration:  null,
    spotifyUrl: album.external_urls?.spotify || null,
    imageUrl:   album.images?.[0]?.url || null,
    genre:     buckets[0] || "Other",
  };
}

window.Data = { fromSpotifyAlbum };
