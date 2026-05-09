// Spotify's genre taxonomy is huge (thousands of micro-genres, attached
// to artists not albums). We roll those up into a smaller set of buckets
// for the genre tabs. An artist (and therefore an album) can land in
// multiple buckets — that's intentional.

const GENRE_BUCKETS = {
  "Soundtracks":  ["soundtrack", "score", "scorecore", "video game music",
                   "anime score", "epic", "trailer"],
  "Classical":    ["classical", "baroque", "romantic", "neoclassical",
                   "neo-classical", "chamber music", "opera", "symphony",
                   "orchestra", "compositional", "early music", "choral"],
  "Jazz":         ["jazz", "bebop", "swing", "fusion", "big band",
                   "bossa nova", "ragtime"],
  "Electronic":   ["electronic", "edm", "house", "techno", "trance",
                   "dnb", "drum and bass", "synth", "idm", "downtempo",
                   "dubstep", "garage", "breakbeat", "electronica",
                   "minimal", "synthwave"],
  "Ambient":      ["ambient", "drone", "lowercase", "new age"],
  "Hip-Hop":      ["hip hop", "hip-hop", "rap", "trap", "drill",
                   "boom bap"],
  "R&B / Soul":   ["r&b", "rnb", "soul", "funk", "motown", "neo soul",
                   "neo-soul"],
  "Rock":         ["rock", "punk", "metal", "grunge", "post-rock",
                   "shoegaze", "hardcore", "emo"],
  "Indie":        ["indie", "lo-fi"],
  "Folk":         ["folk", "americana", "bluegrass", "singer-songwriter"],
  "Country":      ["country"],
  "Pop":          ["pop"],
  "World":        ["afrobeat", "latin", "k-pop", "j-pop", "bollywood",
                   "reggae", "salsa", "world", "flamenco", "tango",
                   "balkan", "klezmer", "fado", "cumbia", "highlife",
                   "afro"],
  "Experimental": ["experimental", "avant-garde", "avant garde", "noise",
                   "industrial", "musique concrete", "spectral"],
};

// Order matters when picking the *primary* bucket for a release —
// more specific/curated buckets win over broad ones (Pop, Indie).
const BUCKET_PRIORITY = [
  "Soundtracks", "Classical", "Jazz", "Ambient", "Experimental",
  "Hip-Hop", "R&B / Soul", "Electronic", "Folk", "Country",
  "World", "Indie", "Rock", "Pop",
];

function bucketsFor(genres) {
  if (!genres || !genres.length) return [];
  const found = new Set();
  for (const g of genres) {
    const lower = g.toLowerCase();
    for (const [bucket, kws] of Object.entries(GENRE_BUCKETS)) {
      if (kws.some(kw => lower.includes(kw))) found.add(bucket);
    }
  }
  return BUCKET_PRIORITY.filter(b => found.has(b));
}

function unmatchedGenres(allGenres) {
  const out = new Set();
  for (const g of allGenres) {
    if (!bucketsFor([g]).length) out.add(g);
  }
  return [...out].sort();
}

window.Genres = { GENRE_BUCKETS, BUCKET_PRIORITY, bucketsFor, unmatchedGenres };
window.GENRES = ["All", ...BUCKET_PRIORITY, "Other"];
