// Spotify app configuration.
// Client ID is public by design — PKCE flow uses no secret.
// To run from a different host or port, add it to your Spotify app's
// Redirect URIs at https://developer.spotify.com/dashboard

(function () {
  const origin = window.location.origin;
  let path = window.location.pathname;
  if (path.endsWith("index.html")) path = path.slice(0, -"index.html".length);
  if (!path.endsWith("/")) path += "/";

  window.CONFIG = {
    CLIENT_ID:      "4015f12a17b9445d974b1ce00b7b22d9",
    REDIRECT_URI:   origin + path,
    // user-follow-read lets us read the user's followed artists, which
    // is the entry point to "what's new from artists you follow".
    SCOPES:         "user-follow-read",
    AUTH_ENDPOINT:  "https://accounts.spotify.com/authorize",
    TOKEN_ENDPOINT: "https://accounts.spotify.com/api/token",
    API_BASE:       "https://api.spotify.com/v1",
    MARKET:         "DE",
  };
})();
