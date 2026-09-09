import { Router, Request } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { googleConnectionTable, siteConfigTable, photosTable, eventsTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/auth";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Derives the application base URL from environment or, as a fallback, from
 * the incoming request's forwarded headers (set by the Replit proxy).
 * Always returns an absolute URL string — never an empty string.
 */
function getBaseUrl(req: Request): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
  return `${proto}://${host}`;
}

function getOAuthConfig(req?: Request) {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  // GOOGLE_REDIRECT_URI takes precedence; otherwise build an absolute URI from the request.
  const redirectUri =
    process.env["GOOGLE_REDIRECT_URI"] ||
    (req ? `${getBaseUrl(req)}/api/google/callback` : "/api/google/callback");
  return { clientId, clientSecret, redirectUri };
}

export async function getConnection() {
  const rows = await db.select().from(googleConnectionTable).limit(1);
  return rows[0] ?? null;
}

async function refreshAccessToken(connection: typeof googleConnectionTable.$inferSelect) {
  const { clientId, clientSecret } = getOAuthConfig();
  if (!clientId || !clientSecret || !connection.refreshToken) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: connection.refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  const tokenExpiry = new Date(Date.now() + (data.expires_in ?? 3600) * 1000);
  const [updated] = await db
    .update(googleConnectionTable)
    .set({ accessToken: data.access_token, tokenExpiry, updatedAt: new Date() })
    .where(eq(googleConnectionTable.id, connection.id))
    .returning();
  return updated ?? null;
}

export async function getValidToken(connection: typeof googleConnectionTable.$inferSelect): Promise<string | null> {
  if (connection.tokenExpiry && new Date() < new Date(connection.tokenExpiry.getTime() - 60_000)) {
    if (connection.accessToken) return connection.accessToken;
  }
  const updated = await refreshAccessToken(connection);
  return updated?.accessToken ?? null;
}

router.get("/google/status", requireAdmin, async (req, res) => {
  const connection = await getConnection();
  if (!connection || !connection.refreshToken) {
    res.json({ connected: false });
    return;
  }
  res.json({
    connected: true,
    email: connection.accountEmail,
    locationId: connection.locationId,
    accountId: connection.accountId,
    lastSyncHours: connection.lastSyncHours,
    lastSyncDescription: connection.lastSyncDescription,
    lastSyncPhotos: connection.lastSyncPhotos,
    lastSyncPosts: connection.lastSyncPosts,
    lastSyncWebsiteUrl: connection.lastSyncWebsiteUrl,
    statusHours: connection.statusHours,
    statusDescription: connection.statusDescription,
    statusPhotos: connection.statusPhotos,
    statusPosts: connection.statusPosts,
    statusWebsiteUrl: connection.statusWebsiteUrl,
  });
});

router.get("/google/auth", requireAdmin, async (req, res) => {
  const { clientId, redirectUri } = getOAuthConfig(req);
  if (!clientId) {
    res.status(500).json({ error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    return;
  }

  const state = crypto.randomBytes(32).toString("hex");
  const stateExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const existing = await getConnection();
  if (existing) {
    await db
      .update(googleConnectionTable)
      .set({ oauthState: state, oauthStateExpiry: stateExpiry, updatedAt: new Date() })
      .where(eq(googleConnectionTable.id, existing.id));
  } else {
    await db.insert(googleConnectionTable).values({
      oauthState: state,
      oauthStateExpiry: stateExpiry,
    });
  }

  const scopes = [
    "https://www.googleapis.com/auth/business.manage",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "email",
    "profile",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ authUrl });
});

router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  const { clientId, clientSecret, redirectUri } = getOAuthConfig(req);

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
    res.status(500).send("Google OAuth not configured");
    return;
  }

  const tokenParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    res.status(500).send(`Token exchange failed: ${err}`);
    return;
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json() as { email?: string };
  const tokenExpiry = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000);

  await db
    .update(googleConnectionTable)
    .set({
      accountEmail: profile.email ?? "",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? connection.refreshToken,
      tokenExpiry,
      oauthState: null,
      oauthStateExpiry: null,
      updatedAt: new Date(),
    })
    .where(eq(googleConnectionTable.id, connection.id));

  const frontendBase = process.env["APP_URL"] || getBaseUrl(req);
  res.redirect(`${frontendBase}/admin/google?connected=1`);
});

router.post("/google/disconnect", requireAdmin, async (req, res) => {
  const connection = await getConnection();
  if (!connection) {
    res.json({ success: true });
    return;
  }

  if (connection.accessToken) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.accessToken}`, {
      method: "POST",
    }).catch(() => {});
  }

  await db.delete(googleConnectionTable).where(eq(googleConnectionTable.id, connection.id));
  res.json({ success: true });
});

router.put("/google/location", requireAdmin, async (req, res) => {
  const { locationId, accountId } = req.body as { locationId?: string; accountId?: string };
  if (!locationId || !accountId) {
    res.status(400).json({ error: "locationId and accountId are required" });
    return;
  }
  const connection = await getConnection();
  if (!connection) {
    res.status(400).json({ error: "Not connected" });
    return;
  }
  const [updated] = await db
    .update(googleConnectionTable)
    .set({ locationId, accountId, updatedAt: new Date() })
    .where(eq(googleConnectionTable.id, connection.id))
    .returning();
  res.json({ locationId: updated.locationId, accountId: updated.accountId });
});

router.get("/google/locations", requireAdmin, async (req, res) => {
  const connection = await getConnection();
  if (!connection || !connection.refreshToken) {
    res.status(400).json({ error: "Not connected" });
    return;
  }
  const token = await getValidToken(connection);
  if (!token) {
    res.status(401).json({ error: "Could not refresh access token" });
    return;
  }

  const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!accountsRes.ok) {
    const err = await accountsRes.text();
    res.status(502).json({ error: `Google API error: ${err}` });
    return;
  }

  const accountsData = await accountsRes.json() as { accounts?: Array<{ name: string; accountName?: string }> };
  const accounts = accountsData.accounts ?? [];

  const locations: Array<{ id: string; accountId: string; name: string; accountName: string }> = [];
  for (const account of accounts) {
    const locRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!locRes.ok) continue;
    const locData = await locRes.json() as { locations?: Array<{ name: string; title?: string }> };
    for (const loc of locData.locations ?? []) {
      locations.push({
        id: loc.name,
        accountId: account.name,
        name: loc.title ?? loc.name,
        accountName: account.accountName ?? account.name,
      });
    }
  }

  res.json({ locations });
});

router.get("/google/business-info", requireAdmin, async (req, res) => {
  const connection = await getConnection();
  if (!connection || !connection.refreshToken) {
    res.status(400).json({ error: "Not connected to Google" });
    return;
  }
  const locationId = connection.locationId;
  if (!locationId) {
    res.status(400).json({ error: "No location selected" });
    return;
  }
  const token = await getValidToken(connection);
  if (!token) {
    res.status(401).json({ error: "Could not refresh access token. Please reconnect." });
    return;
  }

  const infoRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?readMask=regularHours,profile,phoneNumbers,websiteUri`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!infoRes.ok) {
    const err = await infoRes.text();
    res.status(502).json({ error: `Google API error: ${err}` });
    return;
  }

  const data = await infoRes.json() as {
    regularHours?: { periods?: Array<{ openDay: string; openTime?: { hours?: number; minutes?: number }; closeDay?: string; closeTime?: { hours?: number; minutes?: number } }> };
    profile?: { description?: string };
    phoneNumbers?: { primaryPhone?: string };
    websiteUri?: string;
  };

  res.json(data);
});

router.patch("/google/business-info", requireAdmin, async (req, res) => {
  const connection = await getConnection();
  if (!connection || !connection.refreshToken) {
    res.status(400).json({ error: "Not connected to Google" });
    return;
  }
  const locationId = connection.locationId;
  if (!locationId) {
    res.status(400).json({ error: "No location selected" });
    return;
  }
  const token = await getValidToken(connection);
  if (!token) {
    res.status(401).json({ error: "Could not refresh access token. Please reconnect." });
    return;
  }

  const { regularHours, description, phone, websiteUri } = req.body as {
    regularHours?: { periods: Array<{ openDay: string; openTime: { hours: number; minutes: number }; closeDay: string; closeTime: { hours: number; minutes: number } }> };
    description?: string;
    phone?: string;
    websiteUri?: string;
  };

  const body: Record<string, unknown> = {};
  const maskParts: string[] = [];

  if (regularHours !== undefined) {
    body["regularHours"] = regularHours;
    maskParts.push("regularHours");
  }
  if (description !== undefined) {
    body["profile"] = { description };
    maskParts.push("profile.description");
  }
  if (phone !== undefined) {
    body["phoneNumbers"] = { primaryPhone: phone };
    maskParts.push("phoneNumbers.primaryPhone");
  }
  if (websiteUri !== undefined) {
    body["websiteUri"] = websiteUri;
    maskParts.push("websiteUri");
  }

  if (maskParts.length === 0) {
    res.status(400).json({ error: "No fields provided to update" });
    return;
  }

  const patchRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?updateMask=${maskParts.join(",")}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!patchRes.ok) {
    const errText = await patchRes.text();
    res.status(502).json({ error: `Google API error: ${errText}` });
    return;
  }

  const result = await patchRes.json();
  res.json({ success: true, data: result });
});

router.post("/google/sync", requireAdmin, async (req, res) => {
  const { fields } = req.body as { fields?: string[] };
  if (!fields || fields.length === 0) {
    res.status(400).json({ error: "No fields selected" });
    return;
  }

  const connection = await getConnection();
  if (!connection || !connection.refreshToken) {
    res.status(400).json({ error: "Not connected to Google" });
    return;
  }

  const locationId = connection.locationId;
  const accountId = connection.accountId;
  if (!locationId || !accountId) {
    res.status(400).json({ error: "No Google Business location configured. Please select a location first." });
    return;
  }

  const token = await getValidToken(connection);
  if (!token) {
    res.status(401).json({ error: "Could not refresh access token. Please reconnect." });
    return;
  }

  const configRows = await db.select().from(siteConfigTable);
  const config: Record<string, string> = {};
  for (const row of configRows) {
    config[row.key] = row.value;
  }

  const results: Record<string, { success: boolean; error?: string; syncedAt?: string }> = {};
  const statusUpdates: Partial<typeof googleConnectionTable.$inferSelect> = { updatedAt: new Date() };

  const syncedAt = new Date().toISOString();

  for (const field of fields) {
    try {
      if (field === "hours") {
        const openTime = config["hoursOpen"] ?? "11:00";
        const closeTime = config["hoursClose"] ?? "18:00";

        const dayMap: Record<string, string> = {
          "Mon": "MONDAY", "Tue": "TUESDAY", "Wed": "WEDNESDAY",
          "Thu": "THURSDAY", "Fri": "FRIDAY", "Sat": "SATURDAY", "Sun": "SUNDAY",
          "Monday": "MONDAY", "Tuesday": "TUESDAY", "Wednesday": "WEDNESDAY",
          "Thursday": "THURSDAY", "Friday": "FRIDAY", "Saturday": "SATURDAY", "Sunday": "SUNDAY",
        };

        const allDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
        const closedDaysRaw = config["hoursClosedDays"] ?? "";
        const closedDayNames = closedDaysRaw.split(/[,、]+/).map((d) => d.trim()).filter(Boolean);
        const closedDays = closedDayNames.map((d) => dayMap[d]).filter(Boolean);

        const openDays = allDays.filter((d) => !closedDays.includes(d));
        const [openHour, openMin] = openTime.split(":").map(Number);
        const [closeHour, closeMin] = closeTime.split(":").map(Number);

        const periods = openDays.map((day) => ({
          openDay: day,
          openTime: { hours: openHour, minutes: openMin ?? 0 },
          closeDay: day,
          closeTime: { hours: closeHour, minutes: closeMin ?? 0 },
        }));

        const patchRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?updateMask=regularHours`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ regularHours: { periods } }),
          }
        );

        if (!patchRes.ok) {
          const errText = await patchRes.text();
          results["hours"] = { success: false, error: errText };
          statusUpdates.statusHours = `error: ${errText.slice(0, 200)}`;
        } else {
          results["hours"] = { success: true, syncedAt };
          statusUpdates.lastSyncHours = new Date();
          statusUpdates.statusHours = "success";
        }
      }

      if (field === "description") {
        const description = config["description"] ?? config["tagline"] ?? "";
        const phone = config["phone"] ?? "";

        const body: Record<string, unknown> = {};
        const maskParts: string[] = [];

        if (description) {
          body["profile"] = { description };
          maskParts.push("profile.description");
        }
        if (phone) {
          body["phoneNumbers"] = { primaryPhone: phone };
          maskParts.push("phoneNumbers.primaryPhone");
        }

        if (maskParts.length === 0) {
          results["description"] = { success: false, error: "No description or phone configured" };
          statusUpdates.statusDescription = "error: no data";
          continue;
        }

        const patchRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?updateMask=${maskParts.join(",")}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );

        if (!patchRes.ok) {
          const errText = await patchRes.text();
          results["description"] = { success: false, error: errText };
          statusUpdates.statusDescription = `error: ${errText.slice(0, 200)}`;
        } else {
          results["description"] = { success: true, syncedAt };
          statusUpdates.lastSyncDescription = new Date();
          statusUpdates.statusDescription = "success";
        }
      }

      if (field === "websiteUrl") {
        const websiteUri = config["websiteUrl"] ?? config["website"] ?? "";
        if (!websiteUri) {
          results["websiteUrl"] = { success: false, error: "No website URL configured" };
          statusUpdates.statusWebsiteUrl = "error: no URL";
          continue;
        }

        const patchRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?updateMask=websiteUri`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ websiteUri }),
          }
        );

        if (!patchRes.ok) {
          const errText = await patchRes.text();
          results["websiteUrl"] = { success: false, error: errText };
          statusUpdates.statusWebsiteUrl = `error: ${errText.slice(0, 200)}`;
        } else {
          results["websiteUrl"] = { success: true, syncedAt };
          statusUpdates.lastSyncWebsiteUrl = new Date();
          statusUpdates.statusWebsiteUrl = "success";
        }
      }

      if (field === "photos") {
        const photos = await db.select().from(photosTable);
        if (photos.length === 0) {
          results["photos"] = { success: false, error: "No photos to sync" };
          statusUpdates.statusPhotos = "error: no photos";
          continue;
        }

        let photoErrors = 0;
        for (const photo of photos.slice(0, 10)) {
          const photoRes = await fetch(
            `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/media`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                mediaFormat: "PHOTO",
                locationAssociation: { category: "ADDITIONAL" },
                sourceUrl: photo.url,
              }),
            }
          );
          if (!photoRes.ok) photoErrors++;
        }

        if (photoErrors === photos.slice(0, 10).length) {
          results["photos"] = { success: false, error: "All photo uploads failed" };
          statusUpdates.statusPhotos = "error: all failed";
        } else {
          results["photos"] = { success: true, syncedAt };
          statusUpdates.lastSyncPhotos = new Date();
          statusUpdates.statusPhotos = "success";
        }
      }

      if (field === "posts") {
        const events = await db.select().from(eventsTable);
        if (events.length === 0) {
          results["posts"] = { success: false, error: "No events to sync as posts" };
          statusUpdates.statusPosts = "error: no events";
          continue;
        }

        const recentEvents = events.slice(0, 5);
        let postErrors = 0;
        for (const event of recentEvents) {
          const postBody: Record<string, unknown> = {
            languageCode: "en-US",
            summary: event.title,
            callToAction: {
              actionType: "LEARN_MORE",
              url: config["websiteUrl"] ?? config["website"] ?? "",
            },
          };

          if (event.date) {
            const parts = event.date.split("-");
            if (parts.length === 3) {
              postBody["event"] = {
                title: event.title,
                schedule: {
                  startDate: { year: parseInt(parts[0]!), month: parseInt(parts[1]!), day: parseInt(parts[2]!) },
                  endDate: { year: parseInt(parts[0]!), month: parseInt(parts[1]!), day: parseInt(parts[2]!) },
                },
              };
            }
          }

          const postRes = await fetch(
            `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/localPosts`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(postBody),
            }
          );
          if (!postRes.ok) postErrors++;
        }

        if (postErrors === recentEvents.length) {
          results["posts"] = { success: false, error: "All post uploads failed" };
          statusUpdates.statusPosts = "error: all failed";
        } else {
          results["posts"] = { success: true, syncedAt };
          statusUpdates.lastSyncPosts = new Date();
          statusUpdates.statusPosts = "success";
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results[field] = { success: false, error: message };
      if (field === "hours") statusUpdates.statusHours = `error: ${message.slice(0, 200)}`;
      if (field === "description") statusUpdates.statusDescription = `error: ${message.slice(0, 200)}`;
      if (field === "photos") statusUpdates.statusPhotos = `error: ${message.slice(0, 200)}`;
      if (field === "posts") statusUpdates.statusPosts = `error: ${message.slice(0, 200)}`;
      if (field === "websiteUrl") statusUpdates.statusWebsiteUrl = `error: ${message.slice(0, 200)}`;
    }
  }

  await db
    .update(googleConnectionTable)
    .set(statusUpdates)
    .where(eq(googleConnectionTable.id, connection.id));

  res.json({ results });
});

export default router;
