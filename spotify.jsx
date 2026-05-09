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
    return new Promise(() => {});
  }
  if (res.status === 429) {
    const retry = Number(res.headers.get("Retry-After") || 1);
    await new Promise(r => setTimeout(r, retry * 1000));
    return spotifyFetch(path, opts);
  }
  if (!res.ok) {
    const body = await res.text();
    // Insufficient-scope 403s mean the token predates a SCOPES change;
    // log out so the next login picks up the new scope automatically.
    if (res.status === 403 && /scope|insufficient/i.test(body)) {
      console.warn("[spotify] scope changed — re-authorising");
      Auth.logout();
      return new Promise(() => {});
    }
    console.error("[spotify] ←", res.status, res.statusText, body);
    throw new Error(`Spotify API ${res.status}: ${body}`);
  }
  return res.json();
}

// /browse/new-releases and /search field operators are mostly locked for
// non-quota apps, so we ground the "new releases" feed in the user's own
// followed-artists list instead. /me/following returns full artist
// objects (genres included), and /artists/{id}/albums is open enough to
// fetch each artist's recent catalogue without needing the bulk
// /artists endpoint.
async function fetchFollowedArtists() {
  const all = [];
  let after = null;
  while (true) {
    const params = new URLSearchParams({ type: "artist", limit: "50" });
    if (after) params.set("after", after);
    const data = await spotifyFetch(`/me/following?${params}`);
    const items = data.artists?.items || [];
    all.push(...items);
    after = data.artists?.cursors?.after;
    if (!after || !items.length) break;
  }
  return all;
}

async function fetchArtistAlbums(artistId, { limit = 20 } = {}) {
  const params = new URLSearchParams({
    include_groups: "album,single,compilation",
    limit: String(limit),
  });
  const data = await spotifyFetch(`/artists/${artistId}/albums?${params}`);
  return data.items || [];
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

async function searchArtists({ query } = {}) {
  const params = new URLSearchParams({ q: (query || "").trim(), type: "artist" });
  const data = await spotifyFetch(`/search?${params}`);
  return data.artists?.items || [];
}

window.Spotify = {
  fetchFollowedArtists, fetchArtistAlbums,
  fetchArtists, fetchAlbum, searchAlbums, searchArtists,
};
