import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable } from "@workspace/db/schema";
import { verifyApiKey } from "./apiKey";
import { desc, eq, gte, lte, and, type SQL } from "drizzle-orm";

const router = Router();

/** Extract the raw key from Authorization: Bearer <key> or X-API-Key: <key> */
function extractKey(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers["authorization"];
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  const xKey = req.headers["x-api-key"];
  if (typeof xKey === "string" && xKey.trim()) {
    return xKey.trim();
  }
  return null;
}

/**
 * GET /api/v1/bookings
 *
 * Auth: Authorization: Bearer <api-key>  OR  X-API-Key: <api-key>
 *
 * Query params (all optional):
 *   date=YYYY-MM-DD          — exact date filter
 *   from=YYYY-MM-DD          — start of date range (inclusive)
 *   to=YYYY-MM-DD            — end of date range (inclusive)
 *   unread=true              — only unread bookings
 *   limit=50                 — max rows (default 200, max 1000)
 *   offset=0                 — pagination offset
 */
router.get("/v1/bookings", async (req, res) => {
  // --- Auth ---
  const rawKey = extractKey(req as Parameters<typeof extractKey>[0]);
  if (!rawKey) {
    res.status(401).json({ error: "Unauthorized", hint: "Provide an API key via Authorization: Bearer <key> or X-API-Key: <key>" });
    return;
  }
  const valid = await verifyApiKey(rawKey);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // --- Filters ---
  const { date, from, to, unread, limit: limitParam, offset: offsetParam } = req.query as Record<string, string | undefined>;

  const conditions: SQL[] = [];

  if (date) {
    conditions.push(eq(bookingsTable.date, date));
  } else {
    if (from) conditions.push(gte(bookingsTable.date, from));
    if (to)   conditions.push(lte(bookingsTable.date, to));
  }

  if (unread === "true") {
    conditions.push(eq(bookingsTable.isRead, false));
  }

  const limit  = Math.min(1000, Math.max(1, parseInt(limitParam  ?? "200", 10) || 200));
  const offset = Math.max(0, parseInt(offsetParam ?? "0",   10) || 0);

  const rows = await db
    .select()
    .from(bookingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    data: rows,
    meta: {
      count: rows.length,
      limit,
      offset,
    },
  });
});

export default router;
