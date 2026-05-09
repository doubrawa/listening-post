// Curated default artist list for the "new releases" feed when the user
// follows few or no artists on Spotify. Names are resolved to Spotify IDs
// once via /search?type=artist and cached in localStorage so subsequent
// loads skip the search round-trip.

const SEED_VERSION = 1;

const DEFAULT_ARTISTS = [
  // Soundtrack composers
  "Hans Zimmer", "Ludwig Göransson", "John Williams", "Hildur Guðnadóttir",
  "Max Richter", "Jóhann Jóhannsson", "Trent Reznor", "Atticus Ross",
  "Ramin Djawadi", "Nicholas Britell", "Bear McCreary", "Daniel Pemberton",
  "Mica Levi", "Volker Bertelmann", "Kris Bowers", "Cliff Martinez",
  "Howard Shore", "Carter Burwell", "Alexandre Desplat", "Jonny Greenwood",
  "Cristobal Tapia de Veer", "Disasterpeace", "Lena Raine", "Gareth Coker",
  "Yasunori Mitsuda", "Nainita Desai",
  // Modern Classical / Instrumental
  "Brian Eno", "Ryuichi Sakamoto", "Vikingur Olafsson", "Caroline Shaw",
  "Anna Thorvaldsdottir", "Nils Frahm", "Olafur Arnalds",
  "A Winged Victory for the Sullen", "Poppy Ackroyd",
  // Jazz
  "Nubya Garcia", "GoGo Penguin", "Maria Schneider Orchestra",
  "Kamasi Washington", "Brad Mehldau",
  // Ambient / Electronic
  "Floating Points", "Caterina Barbieri", "Kali Malone", "Tim Hecker",
  "Stars of the Lid", "Aphex Twin", "Boards of Canada",
  "Oneohtrix Point Never", "Jamie xx",
  // Indie / Rock / World
  "Big Thief", "Khruangbin", "Radiohead", "Sigur Rós",
  "Arooj Aftab", "Idles", "Nick Cave & the Bad Seeds", "Sessa",
];

const STORAGE_KEY = "lp.seed_artists";

// Run async work in batches to avoid hammering Spotify's rate limit on
// the first cold load (~50 search calls).
async function batched(items, fn, concurrency = 8) {
  const out = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    out.push(...await Promise.allSettled(chunk.map(fn)));
  }
  return out;
}

async function resolveSeedArtists() {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const cache = raw._version === SEED_VERSION ? raw : { _version: SEED_VERSION };

  const out = [];
  const toResolve = [];
  for (const name of DEFAULT_ARTISTS) {
    if (cache[name]) out.push(cache[name]);
    else toResolve.push(name);
  }

  if (toResolve.length) {
    console.log(`[listening-post] resolving ${toResolve.length} seed artists…`);
    const results = await batched(
      toResolve,
      name => Spotify.searchArtists({ query: name }),
    );
    for (let i = 0; i < toResolve.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled" && r.value.length) {
        const a = r.value[0];
        const entry = { id: a.id, name: a.name, genres: a.genres || [] };
        cache[toResolve[i]] = entry;
        out.push(entry);
      } else {
        console.warn(`[listening-post] couldn't resolve seed: ${toResolve[i]}`);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }

  return out;
}

window.Seeds = { DEFAULT_ARTISTS, resolveSeedArtists, SEED_VERSION };
