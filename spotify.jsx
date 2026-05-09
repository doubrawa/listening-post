// Thin wrapper around the Spotify Web API.
// Handles 401 (re-auth), 429 (rate limit) and chunks artist lookups.

async function spotifyFetch(path, opts = {}) {
  const token = await Auth.getValidToken();
  const url = path.startsWith("http") ? path : `${CONFIG.API_BASE}${path}`;
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
    throw new Error(`Spotify API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Spotify locked /browse/new-releases for many newer apps (returns 403).
// Search with `tag:new` is the documented replacement and stays open.
// New-app quota also caps the per-request limit lower than the
// historical 50; 20 is the safe baseline.
async function fetchNewReleases({ limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({
    q: "tag:new", type: "album", limit: String(limit),
  });
  if (offset > 0) params.set("offset", String(offset));
  const data = await spotifyFetch(`/search?${params}`);
  return data.albums; // { items, total, next, ... }
}

async function fetchArtists(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  const out = {};
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const params = new URLSearchParams({ ids: chunk.join(",") });
    const data = await spotifyFetch(`/artists?${params}`);
    for (const a of data.artists) out[a.id] = a;
  }
  return out;
}

async function fetchAlbum(id) {
  return spotifyFetch(`/albums/${id}`);
}

async function searchAlbums({ query, year, genre, limit = 50 } = {}) {
  let q = (query || "").trim();
  if (year)  q += ` year:${year}`;
  if (genre) q += ` genre:"${genre}"`;
  if (!q.includes("tag:new")) q += " tag:new";
  const params = new URLSearchParams({ q: q.trim(), type: "album", limit });
  const data = await spotifyFetch(`/search?${params}`);
  return data.albums;
}

window.Spotify = { fetchNewReleases, fetchArtists, fetchAlbum, searchAlbums };
