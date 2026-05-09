// Thin wrapper around the Spotify Web API.
// Handles 401 (re-auth), 429 (rate limit) and chunks artist lookups.

async function spotifyFetch(path, opts = {}) {
  const token = await Auth.getValidToken();
  const url = path.startsWith("http") ? path : `${CONFIG.API_BASE}${path}`;
  console.log("[spotify] →", url);
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    Auth.logout();
    throw new Error("Unauthorized — please log in again");
  }
  if (res.status === 429) {
    const retry = Number(res.headers.get("Retry-After") || 1);
    await new Promise(r => setTimeout(r, retry * 1000));
    return spotifyFetch(path, opts);
  }
  if (!res.ok) {
    const body = await res.text();
    console.error("[spotify] ←", res.status, res.statusText, body);
    throw new Error(`Spotify API ${res.status}: ${body}`);
  }
  return res.json();
}

// /browse/new-releases is locked and `tag:new` is rejected for new apps,
// so we do many small year-filtered searches in parallel — one with no
// genre, plus one per common genre. Each query returns ~5 popular hits,
// merging gives 30-60 unique albums, and the genre buckets are filled
// straight from which query the album came from (no artist fetch needed).
const RELEASE_QUERIES = [
  [null,           null],          // baseline year-only
  ["Soundtracks",  "soundtrack"],
  ["Classical",    "classical"],
  ["Jazz",         "jazz"],
  ["Electronic",   "electronic"],
  ["Ambient",      "ambient"],
  ["Hip-Hop",      "hip-hop"],
  ["R&B / Soul",   "soul"],
  ["Rock",         "rock"],
  ["Indie",        "indie"],
  ["Folk",         "folk"],
  ["Country",      "country"],
  ["Pop",          "pop"],
];

async function fetchNewReleases() {
  const year = new Date().getFullYear();
  const requests = RELEASE_QUERIES.map(([bucket, genre]) => {
    let q = `year:${year}`;
    if (genre) q += ` genre:${genre}`;
    const params = new URLSearchParams({ q, type: "album" });
    return spotifyFetch(`/search?${params}`)
      .then(d => ({ bucket, items: d.albums?.items || [] }))
      .catch(() => ({ bucket, items: [] }));
  });
  const results = await Promise.all(requests);

  const merged = new Map();
  for (const { bucket, items } of results) {
    for (const a of items) {
      const existing = merged.get(a.id);
      if (existing) {
        if (bucket && !existing._buckets.includes(bucket)) {
          existing._buckets.push(bucket);
        }
      } else {
        merged.set(a.id, { ...a, _buckets: bucket ? [bucket] : [] });
      }
    }
  }
  return { items: [...merged.values()] };
}

// Bulk /artists?ids=… is denied for many new apps (403). Try it first
// for speed; if it fails, fall back to singular /artists/{id} requests
// in parallel. We use allSettled so a few rate-limited misses don't
// kill the whole batch.
async function fetchArtists(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  const out = {};

  try {
    for (let i = 0; i < unique.length; i += 50) {
      const chunk = unique.slice(i, i + 50);
      const params = new URLSearchParams({ ids: chunk.join(",") });
      const data = await spotifyFetch(`/artists?${params}`);
      for (const a of data.artists) out[a.id] = a;
    }
    return out;
  } catch (e) {
    console.warn("[spotify] bulk /artists denied, retrying per-artist");
  }

  const results = await Promise.allSettled(
    unique.map(id => spotifyFetch(`/artists/${id}`))
  );
  for (let i = 0; i < unique.length; i++) {
    if (results[i].status === "fulfilled") {
      out[unique[i]] = results[i].value;
    }
  }
  return out;
}

async function fetchAlbum(id) {
  return spotifyFetch(`/albums/${id}`);
}

async function searchAlbums({ query } = {}) {
  const params = new URLSearchParams({ q: (query || "").trim(), type: "album" });
  const data = await spotifyFetch(`/search?${params}`);
  return data.albums?.items || [];
}

window.Spotify = { fetchNewReleases, fetchArtists, fetchAlbum, searchAlbums };
