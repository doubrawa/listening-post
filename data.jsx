// Dummy data — fictional, prototype only. Real Spotify hookup later.
// Each release has a generated cover (gradient + glyph) so we don't need image assets.

const GENRES = [
  "All",
  "Soundtracks",
  "Classical",
  "Jazz",
  "Electronic",
  "Ambient",
  "Hip-Hop",
  "Indie",
  "Rock",
  "World",
  "Experimental",
];

// Mediums only apply when genre = Soundtracks
const MEDIUMS = ["Film", "Series", "Game", "Documentary", "Theatre", "Anime"];

const STYLES = [
  "Orchestral", "Electronic", "Hybrid", "Ambient", "Choral", "Solo Piano",
  "Synthwave", "Modular", "Drone", "Jazz", "Big Band", "Chamber",
  "Lo-fi", "Trip-hop", "Glitch", "Folk", "Spiritual", "Spectral",
  "Vocal", "Minimalism", "Post-rock", "Avant-garde",
];

// Cover seed → produces a unique abstract gradient + glyph for each card
function coverSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function makeCover(seed, paletteIdx) {
  const PALETTES = [
    ["#3a1f12", "#a85a2d", "#f0c890"],   // amber
    ["#0f2230", "#2c5a7a", "#a8d1e8"],   // ocean
    ["#1a1f2e", "#4a3d8a", "#c8b8e8"],   // violet
    ["#0e1f1a", "#2d6850", "#a8d8b8"],   // forest
    ["#2a0e1f", "#7a2848", "#e8a8c0"],   // wine
    ["#1f1a0e", "#6e5a28", "#e8d088"],   // ochre
    ["#0e0e0e", "#3a3a3a", "#a0a0a0"],   // mono
    ["#2a1a0e", "#9a4a18", "#f0a058"],   // rust
    ["#1a2a0e", "#5a7a18", "#c8e088"],   // moss
    ["#0e1a2a", "#185a9a", "#88c0e8"],   // azure
  ];
  const p = PALETTES[paletteIdx % PALETTES.length];
  const angle = (seed % 8) * 45;
  const shape = seed % 5;
  return { palette: p, angle, shape };
}

// Helper to create a release record
function R({ id, title, artist, date, genre, medium, source, styles, label, tracks, duration, palette }) {
  const seed = coverSeed(title + artist);
  return {
    id,
    title,
    artist,
    date, // ISO YYYY-MM-DD
    genre,
    medium,
    source,
    styles,
    label,
    tracks,
    duration,
    spotifyUrl: "https://open.spotify.com/album/dummy" + id,
    cover: makeCover(seed, palette ?? id),
  };
}

const RELEASES = [
  // ── Soundtracks (Film) ──────────────────────────────────────────
  R({ id: 1,  title: "Mountains in Motion", artist: "Hans Zimmer", date: "2026-05-02",
      genre: "Soundtracks", medium: "Film", source: "Mountains in Motion (2026)",
      styles: ["Orchestral", "Hybrid"], label: "WaterTower Music", tracks: 18, duration: "1h 12m", palette: 0 }),
  R({ id: 2,  title: "The Long Field", artist: "Ludwig Göransson", date: "2026-04-28",
      genre: "Soundtracks", medium: "Film", source: "The Long Field (2026)",
      styles: ["Hybrid", "Choral"], label: "Milan Records", tracks: 22, duration: "1h 24m", palette: 7 }),
  R({ id: 3,  title: "Saltwater", artist: "Mica Levi", date: "2026-05-05",
      genre: "Soundtracks", medium: "Film", source: "Saltwater (A24)",
      styles: ["Avant-garde", "Spectral"], label: "Milan Records", tracks: 11, duration: "38m", palette: 4 }),
  R({ id: 4,  title: "A Hand on the Lever", artist: "Nicholas Britell", date: "2026-04-19",
      genre: "Soundtracks", medium: "Film", source: "A Hand on the Lever",
      styles: ["Chamber", "Jazz"], label: "Lakeshore", tracks: 16, duration: "52m", palette: 3 }),
  R({ id: 5,  title: "Vespertine Hours", artist: "Jóhann Jóhannsson Estate", date: "2026-04-11",
      genre: "Soundtracks", medium: "Film", source: "Vespertine Hours (re-issue)",
      styles: ["Ambient", "Orchestral"], label: "Deutsche Grammophon", tracks: 9, duration: "47m", palette: 6 }),

  // ── Soundtracks (Series) ────────────────────────────────────────
  R({ id: 6,  title: "Cold Stations", artist: "Cristobal Tapia de Veer", date: "2026-05-04",
      genre: "Soundtracks", medium: "Series", source: "Cold Stations S2",
      styles: ["Electronic", "Choral"], label: "HBO Music", tracks: 14, duration: "44m", palette: 2 }),
  R({ id: 7,  title: "House of Glass", artist: "Ramin Djawadi", date: "2026-04-30",
      genre: "Soundtracks", medium: "Series", source: "House of Glass S1",
      styles: ["Orchestral", "Hybrid"], label: "Sony Classical", tracks: 19, duration: "1h 02m", palette: 5 }),
  R({ id: 8,  title: "Slow West", artist: "Volker Bertelmann", date: "2026-04-15",
      genre: "Soundtracks", medium: "Series", source: "Slow West S3",
      styles: ["Chamber", "Folk"], label: "Mute", tracks: 12, duration: "39m", palette: 1 }),

  // ── Soundtracks (Game) ──────────────────────────────────────────
  R({ id: 9,  title: "Hollow Reach", artist: "Gareth Coker", date: "2026-05-06",
      genre: "Soundtracks", medium: "Game", source: "Hollow Reach (Xbox)",
      styles: ["Orchestral", "Vocal"], label: "Materia Collective", tracks: 28, duration: "1h 48m", palette: 9 }),
  R({ id: 10, title: "Atlas Drift", artist: "Lena Raine", date: "2026-04-25",
      genre: "Soundtracks", medium: "Game", source: "Atlas Drift",
      styles: ["Electronic", "Lo-fi"], label: "Black Screen", tracks: 24, duration: "1h 11m", palette: 2 }),
  R({ id: 11, title: "Concord (OST)", artist: "Yasunori Mitsuda", date: "2026-04-08",
      genre: "Soundtracks", medium: "Game", source: "Concord",
      styles: ["Orchestral", "World"], label: "Procyon Studio", tracks: 35, duration: "2h 14m", palette: 8 }),
  R({ id: 12, title: "Quiet Engine", artist: "Disasterpeace", date: "2026-05-01",
      genre: "Soundtracks", medium: "Game", source: "Quiet Engine",
      styles: ["Synthwave", "Modular"], label: "Milan Records", tracks: 21, duration: "58m", palette: 2 }),

  // ── Soundtracks (Documentary / Theatre / Anime) ─────────────────
  R({ id: 13, title: "Slow Tide", artist: "Hildur Guðnadóttir", date: "2026-04-22",
      genre: "Soundtracks", medium: "Documentary", source: "Slow Tide (BBC)",
      styles: ["Drone", "Solo Piano"], label: "Deutsche Grammophon", tracks: 8, duration: "41m", palette: 1 }),
  R({ id: 14, title: "Salt and Iron", artist: "Max Richter", date: "2026-04-04",
      genre: "Soundtracks", medium: "Documentary", source: "Salt and Iron",
      styles: ["Minimalism", "Chamber"], label: "DG", tracks: 13, duration: "55m", palette: 9 }),
  R({ id: 15, title: "After the Light", artist: "Ryuichi Sakamoto Estate", date: "2026-04-17",
      genre: "Soundtracks", medium: "Anime", source: "After the Light",
      styles: ["Solo Piano", "Ambient"], label: "Commmons", tracks: 10, duration: "44m", palette: 3 }),

  // ── Classical ───────────────────────────────────────────────────
  R({ id: 16, title: "Études Volume IV", artist: "Vikingur Olafsson", date: "2026-05-03",
      genre: "Classical", source: "Études Volume IV",
      styles: ["Solo Piano", "Minimalism"], label: "DG", tracks: 18, duration: "1h 04m", palette: 6 }),
  R({ id: 17, title: "String Quartets 1–3", artist: "Caroline Shaw", date: "2026-04-27",
      genre: "Classical", source: "String Quartets 1–3",
      styles: ["Chamber", "Vocal"], label: "Nonesuch", tracks: 12, duration: "58m", palette: 4 }),
  R({ id: 18, title: "Horizon Mass", artist: "Anna Thorvaldsdottir", date: "2026-04-12",
      genre: "Classical", source: "Horizon Mass",
      styles: ["Orchestral", "Choral"], label: "Sono Luminus", tracks: 6, duration: "49m", palette: 9 }),

  // ── Jazz ────────────────────────────────────────────────────────
  R({ id: 19, title: "Slow Train North", artist: "Nubya Garcia", date: "2026-05-05",
      genre: "Jazz", source: "Slow Train North",
      styles: ["Jazz", "Spiritual"], label: "Concord Jazz", tracks: 9, duration: "52m", palette: 7 }),
  R({ id: 20, title: "Pendulum", artist: "GoGo Penguin", date: "2026-04-24",
      genre: "Jazz", source: "Pendulum",
      styles: ["Jazz", "Electronic"], label: "Sony Music", tracks: 11, duration: "47m", palette: 0 }),
  R({ id: 21, title: "Bigger Rooms", artist: "Maria Schneider Orchestra", date: "2026-04-09",
      genre: "Jazz", source: "Bigger Rooms",
      styles: ["Big Band", "Orchestral"], label: "ArtistShare", tracks: 7, duration: "1h 10m", palette: 3 }),

  // ── Electronic ──────────────────────────────────────────────────
  R({ id: 22, title: "Patterns at Dusk", artist: "Floating Points", date: "2026-05-02",
      genre: "Electronic", source: "Patterns at Dusk",
      styles: ["Electronic", "Modular"], label: "Ninja Tune", tracks: 10, duration: "54m", palette: 2 }),
  R({ id: 23, title: "Field Recordings", artist: "Caterina Barbieri", date: "2026-04-21",
      genre: "Electronic", source: "Field Recordings",
      styles: ["Modular", "Drone"], label: "light-years", tracks: 7, duration: "44m", palette: 4 }),
  R({ id: 24, title: "Halflight", artist: "Jamie xx", date: "2026-04-30",
      genre: "Electronic", source: "Halflight",
      styles: ["Electronic", "Trip-hop"], label: "Young", tracks: 13, duration: "49m", palette: 5 }),

  // ── Ambient ─────────────────────────────────────────────────────
  R({ id: 25, title: "Glacier (extended)", artist: "Brian Eno", date: "2026-04-18",
      genre: "Ambient", source: "Glacier (extended)",
      styles: ["Ambient", "Drone"], label: "UMC", tracks: 4, duration: "1h 28m", palette: 9 }),
  R({ id: 26, title: "Soft Architecture", artist: "Kali Malone", date: "2026-05-06",
      genre: "Ambient", source: "Soft Architecture",
      styles: ["Drone", "Spectral"], label: "Ideologic Organ", tracks: 5, duration: "1h 16m", palette: 6 }),

  // ── Hip-Hop ─────────────────────────────────────────────────────
  R({ id: 27, title: "Long Division", artist: "Little Simz", date: "2026-05-01",
      genre: "Hip-Hop", source: "Long Division",
      styles: ["Hip-Hop", "Jazz"], label: "AGE 101", tracks: 14, duration: "48m", palette: 4 }),
  R({ id: 28, title: "Off the Grid", artist: "Danny Brown", date: "2026-04-26",
      genre: "Hip-Hop", source: "Off the Grid",
      styles: ["Hip-Hop", "Glitch"], label: "Warp", tracks: 12, duration: "38m", palette: 7 }),

  // ── Indie / Rock / World / Experimental ─────────────────────────
  R({ id: 29, title: "Field Magnet", artist: "Big Thief", date: "2026-05-04",
      genre: "Indie", source: "Field Magnet",
      styles: ["Folk", "Post-rock"], label: "4AD", tracks: 13, duration: "57m", palette: 1 }),
  R({ id: 30, title: "Burner", artist: "Idles", date: "2026-04-23",
      genre: "Rock", source: "Burner",
      styles: ["Post-rock"], label: "Partisan", tracks: 11, duration: "44m", palette: 7 }),
  R({ id: 31, title: "Casa Tropicalia", artist: "Sessa", date: "2026-04-13",
      genre: "World", source: "Casa Tropicalia",
      styles: ["Folk", "Vocal"], label: "Mexican Summer", tracks: 10, duration: "39m", palette: 8 }),
  R({ id: 32, title: "Mirror, Mirror", artist: "Oneohtrix Point Never", date: "2026-05-03",
      genre: "Experimental", source: "Mirror, Mirror",
      styles: ["Glitch", "Avant-garde"], label: "Warp", tracks: 9, duration: "46m", palette: 2 }),
  R({ id: 33, title: "Threshold", artist: "Tim Hecker", date: "2026-04-29",
      genre: "Experimental", source: "Threshold",
      styles: ["Drone", "Ambient"], label: "Kranky", tracks: 6, duration: "52m", palette: 6 }),
  R({ id: 34, title: "Riverine", artist: "Arooj Aftab", date: "2026-04-16",
      genre: "World", source: "Riverine",
      styles: ["Vocal", "Spiritual"], label: "Verve", tracks: 8, duration: "41m", palette: 3 }),
  R({ id: 35, title: "Late Show", artist: "Khruangbin", date: "2026-05-05",
      genre: "Indie", source: "Late Show",
      styles: ["Lo-fi", "Trip-hop"], label: "Dead Oceans", tracks: 11, duration: "43m", palette: 0 }),
];

Object.assign(window, { GENRES, MEDIUMS, STYLES, RELEASES });
