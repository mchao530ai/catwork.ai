import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { instagramConnectionTable, instagramReelsTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/auth";
import { eq, desc } from "drizzle-orm";

const router = Router();

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

function getBaseUrl(req: import("express").Request): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"].replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  return `${proto}://${host}`;
}

function getOAuthConfig(req?: import("express").Request) {
  const clientId = process.env["FACEBOOK_APP_ID"];
  const clientSecret = process.env["FACEBOOK_APP_SECRET"];
  const redirectUri =
    process.env["INSTAGRAM_REDIRECT_URI"] ||
    (req ? `${getBaseUrl(req)}/api/instagram/callback` : `${process.env["APP_URL"] || ""}/api/instagram/callback`);
  return { clientId, clientSecret, redirectUri };
}

async function getConnection() {
  const rows = await db.select().from(instagramConnectionTable).limit(1);
  return rows[0] ?? null;
}

async function refreshLongLivedToken(connection: typeof instagramConnectionTable.$inferSelect) {
  const { clientId, clientSecret } = getOAuthConfig();
  if (!clientId || !clientSecret || !connection.accessToken) return null;

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: connection.accessToken,
  });

  const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);
  if (!res.ok) return null;

  const data = await res.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  const tokenExpiry = new Date(Date.now() + (data.expires_in ?? 5184000) * 1000);
  const [updated] = await db
    .update(instagramConnectionTable)
    .set({ accessToken: data.access_token, tokenExpiry, updatedAt: new Date() })
    .where(eq(instagramConnectionTable.id, connection.id))
    .returning();
  return updated ?? null;
}

async function getValidToken(connection: typeof instagramConnectionTable.$inferSelect): Promise<string | null> {
  if (connection.tokenExpiry && new Date() < new Date(connection.tokenExpiry.getTime() - FIVE_DAYS_MS)) {
    if (connection.accessToken) return connection.accessToken;
  }
  const updated = await refreshLongLivedToken(connection);
  return updated?.accessToken ?? connection.accessToken ?? null;
}

router.get("/instagram/status", requireAdmin, async (req, res) => {
  const connection = await getConnection();
  if (!connection || !connection.accessToken) {
    res.json({ connected: false });
    return;
  }
  await getValidToken(connection);
  const reelRows = await db.select().from(instagramReelsTable);
  res.json({
    connected: true,
    username: connection.username,
    accountId: connection.accountId,
    lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
    reelCount: reelRows.length,
  });
});

router.get("/instagram/auth", requireAdmin, async (req, res) => {
  const { clientId, redirectUri } = getOAuthConfig(req);
  if (!clientId) {
    res.status(500).json({ error: "Instagram OAuth not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET." });
    return;
  }

  const state = crypto.randomBytes(32).toString("hex");
  const stateExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const existing = await getConnection();
  if (existing) {
    await db
      .update(instagramConnectionTable)
      .set({ oauthState: state, oauthStateExpiry: stateExpiry, updatedAt: new Date() })
      .where(eq(instagramConnectionTable.id, existing.id));
  } else {
    await db.insert(instagramConnectionTable).values({
      oauthState: state,
      oauthStateExpiry: stateExpiry,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "instagram_basic,pages_show_list",
    response_type: "code",
    state,
  });

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  res.json({ authUrl });
});

router.get("/instagram/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  const { clientId, clientSecret, redirectUri } = getOAuthConfig(req);
  const frontendBase = getBaseUrl(req);

  if (!code || !state) {
    res.status(400).send("Missing code or state");
    return;
  }

  const connection = await getConnection();
  if (
    !connection ||
    !connection.oauthState ||
    connection.oauthState !== state ||
    !connection.oauthStateExpiry ||
    new Date() > connection.oauthStateExpiry
  ) {
    res.status(400).send("Invalid or expired OAuth state. Please start the connection flow again.");
    return;
  }

  if (!clientId || !clientSecret) {
    res.status(500).send("Instagram OAuth not configured");
    return;
  }

  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const shortLivedRes = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!shortLivedRes.ok) {
    const err = await shortLivedRes.text();
    res.status(500).send(`Token exchange failed: ${err}`);
    return;
  }

  const shortLivedData = await shortLivedRes.json() as { access_token?: string; error?: { message: string } };
  if (!shortLivedData.access_token) {
    res.status(500).send(`Token exchange failed: ${JSON.stringify(shortLivedData)}`);
    return;
  }

  const longLivedParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLivedData.access_token,
  });

  const longLivedRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${longLivedParams.toString()}`);
  if (!longLivedRes.ok) {
    const err = await longLivedRes.text();
    res.status(500).send(`Long-lived token exchange failed: ${err}`);
    return;
  }

  const longLivedData = await longLivedRes.json() as { access_token?: string; expires_in?: number };
  const accessToken = longLivedData.access_token ?? shortLivedData.access_token;
  const tokenExpiry = new Date(Date.now() + (longLivedData.expires_in ?? 5184000) * 1000);

  const igAccountsRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=instagram_business_account`
  );

  let igUserId = "";
  let igUsername = "";

  if (igAccountsRes.ok) {
    const igAccountsData = await igAccountsRes.json() as {
      data?: Array<{ instagram_business_account?: { id: string } }>;
    };
    const igAccount = igAccountsData.data?.find((p) => p.instagram_business_account)?.instagram_business_account;
    if (igAccount) {
      igUserId = igAccount.id;
      const profileRes = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}?fields=username&access_token=${accessToken}`
      );
      if (profileRes.ok) {
        const profile = await profileRes.json() as { username?: string };
        igUsername = profile.username ?? "";
      }
    }
  }

  await db
    .update(instagramConnectionTable)
    .set({
      accountId: igUserId,
      username: igUsername,
      accessToken,
      tokenExpiry,
      oauthState: null,
      oauthStateExpiry: null,
      updatedAt: new Date(),
    })
    .where(eq(instagramConnectionTable.id, connection.id));

  res.redirect(`${frontendBase}/admin/instagram?connected=1`);
});

router.post("/instagram/disconnect", requireAdmin, async (req, res) => {
  const connection = await getConnection();
  if (!connection) {
    res.json({ success: true });
    return;
  }

  await db.delete(instagramReelsTable);
  await db.delete(instagramConnectionTable).where(eq(instagramConnectionTable.id, connection.id));
  res.json({ success: true });
});

router.post("/instagram/sync", requireAdmin, async (req, res) => {
  const connection = await getConnection();
  if (!connection || !connection.accessToken) {
    res.status(400).json({ error: "Not connected to Instagram" });
    return;
  }

  if (!connection.accountId) {
    res.status(400).json({ error: "No Instagram Business account found. Please reconnect." });
    return;
  }

  const token = await getValidToken(connection);
  if (!token) {
    res.status(401).json({ error: "Could not refresh access token. Please reconnect." });
    return;
  }

  const mediaRes = await fetch(
    `https://graph.facebook.com/v18.0/${connection.accountId}/media?fields=id,caption,media_type,media_product_type,thumbnail_url,media_url,permalink,timestamp&limit=50&access_token=${token}`
  );

  if (!mediaRes.ok) {
    const errText = await mediaRes.text();
    res.status(502).json({ error: `Instagram API error: ${errText}` });
    return;
  }

  const mediaData = await mediaRes.json() as {
    data?: Array<{
      id: string;
      caption?: string;
      media_type?: string;
      media_product_type?: string;
      thumbnail_url?: string;
      media_url?: string;
      permalink?: string;
      timestamp?: string;
    }>;
  };

  const reels = (mediaData.data ?? [])
    .filter((item) => item.media_product_type === "REELS" || (item.media_type === "VIDEO" && item.media_product_type === undefined))
    .slice(0, 12);

  let syncedCount = 0;
  for (const reel of reels) {
    const thumbnailUrl = reel.thumbnail_url ?? reel.media_url ?? "";
    const postedAt = reel.timestamp ? new Date(reel.timestamp) : null;

    await db
      .insert(instagramReelsTable)
      .values({
        mediaId: reel.id,
        caption: reel.caption ?? "",
        thumbnailUrl,
        permalink: reel.permalink ?? "",
        postedAt,
        cachedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: instagramReelsTable.mediaId,
        set: {
          caption: reel.caption ?? "",
          thumbnailUrl,
          permalink: reel.permalink ?? "",
          postedAt,
          cachedAt: new Date(),
        },
      });
    syncedCount++;
  }

  await db
    .update(instagramConnectionTable)
    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(instagramConnectionTable.id, connection.id));

  res.json({ syncedCount, total: reels.length });
});

router.get("/instagram/reels", async (req, res) => {
  const reels = await db
    .select()
    .from(instagramReelsTable)
    .orderBy(desc(instagramReelsTable.postedAt))
    .limit(12);

  res.json(
    reels.map((r) => ({
      id: r.id,
      mediaId: r.mediaId,
      caption: r.caption,
      thumbnailUrl: r.thumbnailUrl,
      permalink: r.permalink,
      postedAt: r.postedAt?.toISOString() ?? null,
      cachedAt: r.cachedAt?.toISOString() ?? null,
    }))
  );
});

export default router;
