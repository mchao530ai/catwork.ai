import { Router, type Request } from "express";
import crypto from "crypto";
import { generateToken, storeToken, invalidateTokenByValue, requireAdmin } from "../middlewares/auth";

const router = Router();

function getBaseUrl(req: Request): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
  return `${proto}://${host}`;
}

function getCallbackUri(req: Request): string {
  return process.env["GOOGLE_LOGIN_REDIRECT_URI"] || `${getBaseUrl(req)}/api/auth/google/callback`;
}

function getVisitorCallbackUri(req: Request): string {
  return process.env["VISITOR_GOOGLE_REDIRECT_URI"] || `${getBaseUrl(req)}/api/auth/visitor/google/callback`;
}

const pendingStates = new Map<string, number>();
const pendingVisitorStates = new Map<string, number>();

// Short-lived visitor profile handoff tokens (opaque → {name, email, expiresAt}).
// Consumed once by GET /api/auth/visitor/profile then immediately deleted.
interface VisitorProfile { name: string; email: string; expiresAt: number; }
const visitorProfileTokens = new Map<string, VisitorProfile>();

function pruneStates() {
  const now = Date.now();
  for (const [state, expiry] of pendingStates.entries()) {
    if (now > expiry) pendingStates.delete(state);
  }
}

function pruneVisitorStates() {
  const now = Date.now();
  for (const [state, expiry] of pendingVisitorStates.entries()) {
    if (now > expiry) pendingVisitorStates.delete(state);
  }
}

function pruneProfileTokens() {
  const now = Date.now();
  for (const [token, entry] of visitorProfileTokens.entries()) {
    if (now > entry.expiresAt) visitorProfileTokens.delete(token);
  }
}

router.get("/auth/google", (req, res) => {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  if (!clientId) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  pruneStates();
  const state = crypto.randomBytes(32).toString("hex");
  pendingStates.set(state, Date.now() + 10 * 60 * 1000);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getCallbackUri(req),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    state,
    prompt: "select_account",
  });

  res.json({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

router.get("/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
  const frontendBase = process.env["APP_URL"] || getBaseUrl(req);

  if (error || !code || !state) {
    res.redirect(`${frontendBase}/admin?error=google_cancelled`);
    return;
  }

  pruneStates();
  if (!pendingStates.has(state)) {
    res.redirect(`${frontendBase}/admin?error=invalid_state`);
    return;
  }
  pendingStates.delete(state);

  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    res.redirect(`${frontendBase}/admin?error=not_configured`);
    return;
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getCallbackUri(req),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    res.redirect(`${frontendBase}/admin?error=token_exchange`);
    return;
  }

  const tokenData = await tokenRes.json() as { access_token?: string };
  if (!tokenData.access_token) {
    res.redirect(`${frontendBase}/admin?error=no_token`);
    return;
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    res.redirect(`${frontendBase}/admin?error=profile_fetch`);
    return;
  }

  const profile = await profileRes.json() as { email?: string };
  const email = profile.email?.toLowerCase() ?? "";

  const allowedRaw = process.env["ADMIN_ALLOWED_EMAILS"] ?? "";
  const allowedEmails = allowedRaw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length === 0) {
    res.redirect(`${frontendBase}/admin?error=no_allowed_emails`);
    return;
  }

  if (!allowedEmails.includes(email)) {
    res.redirect(`${frontendBase}/admin?error=not_authorized`);
    return;
  }

  const token = generateToken();
  await storeToken(token, null);

  res.redirect(`${frontendBase}/admin/dashboard?adminToken=${encodeURIComponent(token)}`);
});

// POST /api/auth/logout — invalidate the current session token in the DB
router.post("/auth/logout", requireAdmin, async (req, res) => {
  const token = (req.headers.authorization as string).slice(7);
  await invalidateTokenByValue(token);
  res.json({ success: true });
});

// ── Visitor Google OAuth ─────────────────────────────────────────────────────
// Returns a Google OAuth URL for visitors. No email allowlist — any Google
// account works. The callback stores name + email in a short-lived server-side
// map keyed by an opaque token, then redirects to /visit?googleToken=<opaque>.
// The client immediately exchanges the token via GET /api/auth/visitor/profile,
// which consumes and deletes it (one-time use, 5-minute TTL). No PII in URLs.

router.get("/auth/visitor/google", (req, res) => {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  if (!clientId) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  pruneVisitorStates();
  const state = crypto.randomBytes(32).toString("hex");
  pendingVisitorStates.set(state, Date.now() + 10 * 60 * 1000);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getVisitorCallbackUri(req),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    state,
    prompt: "select_account",
  });

  res.json({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

router.get("/auth/visitor/google/callback", async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
  const frontendBase = process.env["APP_URL"] || getBaseUrl(req);

  if (error || !code || !state) {
    res.redirect(`${frontendBase}/visit?googleError=cancelled`);
    return;
  }

  pruneVisitorStates();
  if (!pendingVisitorStates.has(state)) {
    res.redirect(`${frontendBase}/visit?googleError=invalid_state`);
    return;
  }
  pendingVisitorStates.delete(state);

  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    res.redirect(`${frontendBase}/visit?googleError=not_configured`);
    return;
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getVisitorCallbackUri(req),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    res.redirect(`${frontendBase}/visit?googleError=token_exchange`);
    return;
  }

  const tokenData = await tokenRes.json() as { access_token?: string };
  if (!tokenData.access_token) {
    res.redirect(`${frontendBase}/visit?googleError=no_token`);
    return;
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    res.redirect(`${frontendBase}/visit?googleError=profile_fetch`);
    return;
  }

  const profile = await profileRes.json() as { email?: string; name?: string };
  const name = profile.name ?? "";
  const email = profile.email ?? "";

  // Store profile under an opaque token — no PII touches the redirect URL
  pruneProfileTokens();
  const profileToken = crypto.randomBytes(32).toString("hex");
  visitorProfileTokens.set(profileToken, {
    name,
    email,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5-minute TTL
  });

  res.redirect(`${frontendBase}/visit?googleToken=${encodeURIComponent(profileToken)}`);
});

// GET /api/auth/visitor/profile?token=<opaque>
// One-time endpoint: returns {name, email} and immediately deletes the token.
router.get("/auth/visitor/profile", (req, res) => {
  const token = req.query["token"] as string | undefined;
  if (!token) {
    res.status(400).json({ error: "Missing token" });
    return;
  }

  pruneProfileTokens();
  const entry = visitorProfileTokens.get(token);
  if (!entry) {
    res.status(404).json({ error: "Token not found or expired" });
    return;
  }

  // Consume immediately — single use
  visitorProfileTokens.delete(token);
  res.json({ name: entry.name, email: entry.email });
});

export default router;
