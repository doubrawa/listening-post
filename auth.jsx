// Spotify OAuth 2.0 — Authorization Code with PKCE flow.
// All token state lives in localStorage. No backend, no secrets.

const TOKEN_KEY   = "lp.access_token";
const REFRESH_KEY = "lp.refresh_token";
const EXPIRES_KEY = "lp.expires_at";
const VERIFIER_KEY = "lp.pkce_verifier";
const STATE_KEY   = "lp.oauth_state";

// ── PKCE helpers ─────────────────────────────────────────────
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(byteLen) {
  const arr = new Uint8Array(byteLen);
  crypto.getRandomValues(arr);
  return base64url(arr);
}

async function sha256Bytes(text) {
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return new Uint8Array(hash);
}

// ── Token storage ────────────────────────────────────────────
function saveTokens({ access_token, refresh_token, expires_in }) {
  localStorage.setItem(TOKEN_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
  // refresh 60s before actual expiry
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + (expires_in - 60) * 1000));
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
}

function isLoggedIn() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// ── Login redirect ───────────────────────────────────────────
async function startLogin() {
  const verifier = randomString(48);
  const challenge = base64url(await sha256Bytes(verifier));
  const state = randomString(16);

  localStorage.setItem(VERIFIER_KEY, verifier);
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             CONFIG.CLIENT_ID,
    redirect_uri:          CONFIG.REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge:        challenge,
    state,
  });
  if (CONFIG.SCOPES) params.set("scope", CONFIG.SCOPES);

  window.location.href = `${CONFIG.AUTH_ENDPOINT}?${params}`;
}

// ── Token exchange + refresh ─────────────────────────────────
async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier");

  const body = new URLSearchParams({
    grant_type:    "authorization_code",
    code,
    redirect_uri:  CONFIG.REDIRECT_URI,
    client_id:     CONFIG.CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch(CONFIG.TOKEN_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  const tokens = await res.json();
  saveTokens(tokens);
  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new Error("No refresh token");

  const body = new URLSearchParams({
    grant_type:    "refresh_token",
    refresh_token: refresh,
    client_id:     CONFIG.CLIENT_ID,
  });
  const res = await fetch(CONFIG.TOKEN_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    clearTokens();
    throw new Error(`Refresh failed: ${res.status}`);
  }
  const tokens = await res.json();
  saveTokens(tokens);
  return tokens.access_token;
}

async function getValidToken() {
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) || 0);
  const access = localStorage.getItem(TOKEN_KEY);
  if (access && Date.now() < expiresAt) return access;
  return refreshAccessToken();
}

// ── Redirect handler — runs once on page load ────────────────
async function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code  = params.get("code");
  const error = params.get("error");
  const state = params.get("state");

  if (error) {
    clearTokens();
    throw new Error(`Spotify auth error: ${error}`);
  }
  if (!code) return false;

  const expectedState = localStorage.getItem(STATE_KEY);
  if (expectedState && state !== expectedState) {
    clearTokens();
    throw new Error("OAuth state mismatch — possible CSRF, aborted");
  }

  await exchangeCodeForToken(code);
  // strip ?code=… from the URL so a refresh doesn't retry
  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}

function logout() {
  clearTokens();
  window.location.reload();
}

window.Auth = {
  startLogin, logout, isLoggedIn, getValidToken, handleRedirect,
};
