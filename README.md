# Listening Post

A Spotify helper for discovering new instrumental and soundtrack releases — film, series, game, and documentary scores.

## Status

Early prototype. The UI is built and runs from static files; release data is currently fake. Real Spotify Web API integration is the next step.

## Running locally

Open `index.html` directly in a browser. No build step — React 18 and Babel are loaded via CDN.

## Stack

- React 18 (UMD via unpkg)
- Babel Standalone for in-browser JSX
- No bundler, no Node required

## Roadmap

- [ ] Wire up Spotify Web API (PKCE auth flow in the browser)
- [ ] Replace dummy data in `data.jsx` with real new-release queries
- [ ] Strategy for surfacing soundtracks (label-based filtering, search tags, curated sources)
- [ ] Deploy to GitHub Pages

## License

MIT
