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

// Spotify locked /browse/new-releases for many newer apps (403) and the
// `tag:new` search operator now also requires extended quota — Spotify
// reports it as a misleading "Invalid limit" 400. A year:<current> query
// stays open and we sort the result by release date client-side to bubble
// the freshest releases to the top.
async function fetchNewReleases({ offset = 0 } = {}) {
  const year = new Date().getFullYear();
  const params = new URLSearchParams({
    q: `year:${year}`,
    type: "album",
  });
  if (offset > 0) params.set("offset", String(offset));
  const data = await spotifyFetch(`/search?${params}`);
  return data.albums; // { items, total, next, ... }
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
