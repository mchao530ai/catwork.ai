import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, enquiriesTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/auth";
import { gte, sql } from "drizzle-orm";
import { getConnection, getValidToken } from "./google";

const router = Router();

// ── Search Console in-memory cache ───────────────────────────────────────────
interface ScCacheEntry { data: unknown; expiresAt: number }
const scCache = new Map<string, ScCacheEntry>();
const SC_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** URL of the site property in Google Search Console. Trailing slash required
 *  for URL-prefix properties (the most common type). */
function getSiteUrl(): string {
  const base = process.env["APP_URL"] ?? "https://catwork.ai";
  return base.endsWith("/") ? base : base + "/";
}

interface ScApiError extends Error {
  status: number;
  /** True when the token lacks the webmasters.readonly OAuth scope. */
  isInsufficientScope: boolean;
}

async function querySearchConsole(
  token: string,
  siteUrl: string,
  body: object,
): Promise<unknown> {
  const encoded = encodeURIComponent(siteUrl);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const errText = await res.text();
    // Parse Google's structured error body to distinguish scope issues from
    // property-access / verification failures.
    let isInsufficientScope = false;
    try {
      const parsed = JSON.parse(errText) as {
        error?: { message?: string; errors?: Array<{ reason?: string; domain?: string }> };
      };
      const msg = parsed.error?.message ?? "";
      const reasons = (parsed.error?.errors ?? []).map((e) => e.reason ?? "");
      // Scope-related signals from the Google API
      isInsufficientScope =
        /insufficient.*(auth|scope|permission)/i.test(msg) ||
        reasons.some((r) => /insufficientPermissions|authError/i.test(r));
    } catch {
      // Non-JSON body — treat as non-scope error
    }
    const e = new Error(errText) as ScApiError;
    e.status = res.status;
    e.isInsufficientScope = isInsufficientScope;
    throw e;
  }
  return res.json();
}

// GET /api/admin/traffic/search-console
// Returns 28-day search impressions/clicks (by date) and top 10 queries.
// Caches results for 30 minutes. Gracefully handles missing webmasters scope.
router.get("/admin/traffic/search-console", requireAdmin, async (_req, res) => {
  const connection = await getConnection();
  if (!connection?.refreshToken) {
    res.json({ connected: false });
    return;
  }

  const token = await getValidToken(connection);
  if (!token) {
    res.status(401).json({ error: "Could not refresh access token. Please reconnect Google." });
    return;
  }

  const siteUrl = getSiteUrl();
  const cached = scCache.get(siteUrl);
  if (cached && Date.now() < cached.expiresAt) {
    res.json(cached.data);
    return;
  }

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const [byDate, byQuery] = await Promise.all([
      querySearchConsole(token, siteUrl, {
        startDate,
        endDate,
        dimensions: ["date"],
        rowLimit: 30,
      }),
      querySearchConsole(token, siteUrl, {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 10,
        orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }],
      }),
    ]);

    const data = { connected: true, needsReconnect: false, byDate, byQuery };
    scCache.set(siteUrl, { data, expiresAt: Date.now() + SC_TTL_MS });
    res.json(data);
  } catch (err: unknown) {
    const e = err as ScApiError;
    if (e.status === 403 || e.status === 401) {
      if (e.isInsufficientScope) {
        // Token lacks webmasters.readonly — admin must reconnect Google to grant the scope.
        res.json({ connected: true, needsReconnect: true });
      } else {
        // Token is fine but the account has no access to this Search Console property
        // (unverified site, no permission granted, or wrong property URL).
        res.json({ connected: true, needsReconnect: false, noPropertyAccess: true });
      }
      return;
    }
    if (e.status === 400) {
      // Malformed site URL or similar — treat as property configuration error.
      res.json({ connected: true, needsReconnect: false, noPropertyAccess: true });
      return;
    }
    throw err;
  }
});

// GET /api/admin/traffic/conversions
// Returns bookings and enquiry counts grouped by day for the last 28 days,
// padded so every day in the range is present (0 for days with no activity).
router.get("/admin/traffic/conversions", requireAdmin, async (_req, res) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 27);
  const fromDateStr = startDate.toISOString().slice(0, 10);

  const [bookingRows, enquiryRows] = await Promise.all([
    // Group by submission date (created_at), not the visit date, so this
    // measures when requests were actually made (conversion metric).
    db
      .select({
        date: sql<string>`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(bookingsTable)
      .where(gte(bookingsTable.createdAt, startDate))
      .groupBy(sql`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),

    db
      .select({
        date: sql<string>`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(enquiriesTable)
      .where(gte(enquiriesTable.createdAt, startDate))
      .groupBy(sql`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),
  ]);

  // Build padded 28-day date array so every day is present
  const dates: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const bookingMap = Object.fromEntries(bookingRows.map((r) => [r.date, Number(r.count)]));
  const enquiryMap = Object.fromEntries(enquiryRows.map((r) => [r.date, Number(r.count)]));

  const series = dates.map((date) => ({
    date,
    bookings: bookingMap[date] ?? 0,
    enquiries: enquiryMap[date] ?? 0,
  }));

  const totalBookings = bookingRows.reduce((s, r) => s + Number(r.count), 0);
  const totalEnquiries = enquiryRows.reduce((s, r) => s + Number(r.count), 0);

  res.json({ series, totalBookings, totalEnquiries });
});

export default router;
