# Listening Post

A Spotify helper for browsing new releases — across all genres, with style, composer and date filters. Magazine-style UI, fully client-side.

## Status

Early prototype. UI runs from static files, real Spotify Web API integration is wired up. Genre buckets are derived from the primary artist's Spotify genre tags via a small mapping table in `genres.jsx`.

## Setup (one-time)

1. Create an app at https://developer.spotify.com/dashboard
2. Add Redirect URIs to that app:
   - `http://127.0.0.1:5500/` for local development
   - `https://<your-username>.github.io/listening-post/` once deployed to Pages
3. Tick **Web API** under "Which API/SDKs are you planning to use?"
4. Copy the **Client ID** from the app's Settings page into `config.jsx` (replace the existing one if you're forking).

## Running locally

You need to serve the files via HTTP (Spotify rejects `file://` redirect URIs). Three easy options:

- **VS Code Live Server extension** — right-click `index.html` → "Open with Live Server" (default port 5500).
- **Python:** `python -m http.server 5500`
- **Node:** `npx serve -l 5500`

Then open http://127.0.0.1:5500/ in your browser and click **Connect to Spotify**.

## Stack

- React 18 (UMD via unpkg)
- Babel Standalone for in-browser JSX
- No bundler, no Node required

## Files

| File          | Purpose                                                             |
|---------------|---------------------------------------------------------------------|
| `config.jsx`  | Spotify Client ID, redirect URI, endpoints                          |
| `auth.jsx`    | OAuth 2.0 PKCE flow, token storage in localStorage                  |
| `spotify.jsx` | Web API client (new releases, artists, album, search)               |
| `genres.jsx`  | Maps Spotify's micro-genres to bucket names                         |
| `data.jsx`    | Transforms Spotify album payloads into the UI's release shape       |
| `cover.jsx`   | Album art with typographic fallback                                 |
| `grid.jsx`    | Hero card, grid card, list view                                     |
| `filters.jsx` | Sidebar filters (sort, date window, style, composer)                |
| `drawer.jsx`  | Detail drawer with full tracklist (fetches album on open)           |
| `app.jsx`     | Main app — login gate, data loading, filtering, layout              |
| `index.html`  | Entry point, font + style globals, script loader                    |

## Roadmap

- [x] OAuth PKCE flow against Spotify
- [x] Replace dummy data with real `/browse/new-releases`
- [x] Genre bucket mapping from artist genre tags
- [x] Real album art and tracklist on demand
- [ ] Pagination / "Load more" beyond the first 50 releases
- [ ] Search hits Spotify search API instead of in-memory
- [ ] Deploy to GitHub Pages

## License

MIT
