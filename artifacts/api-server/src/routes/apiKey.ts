import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { siteConfigTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/auth";
import { eq } from "drizzle-orm";

const router = Router();

const API_KEY_HASH_DB_KEY = "_apiKeyHash";
const API_KEY_PREFIX = "cwcapi_";

export function generateApiKey(): string {
  return API_KEY_PREFIX + crypto.randomBytes(32).toString("hex");
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

async function getStoredHash(): Promise<string | null> {
  const rows = await db
    .select()
    .from(siteConfigTable)
    .where(eq(siteConfigTable.key, API_KEY_HASH_DB_KEY));
  return rows[0]?.value ?? null;
}

async function upsertHash(hash: string): Promise<void> {
  const existing = await getStoredHash();
  if (existing !== null) {
    await db
      .update(siteConfigTable)
      .set({ value: hash })
      .where(eq(siteConfigTable.key, API_KEY_HASH_DB_KEY));
  } else {
    await db
      .insert(siteConfigTable)
      .values({ key: API_KEY_HASH_DB_KEY, value: hash });
  }
}

/** Verify a raw API key against the stored hash. Used by the v1 middleware. */
export async function verifyApiKey(rawKey: string): Promise<boolean> {
  const storedHash = await getStoredHash();
  if (!storedHash) return false;
  const incoming = hashApiKey(rawKey);
  return crypto.timingSafeEqual(Buffer.from(incoming, "hex"), Buffer.from(storedHash, "hex"));
}

// GET /api/admin/api-key/status — is a key currently active?
router.get("/admin/api-key/status", requireAdmin, async (_req, res) => {
  const hash = await getStoredHash();
  res.json({ active: hash !== null });
});

// POST /api/admin/api-key — generate a new key (invalidates old one), return plaintext once
router.post("/admin/api-key", requireAdmin, async (_req, res) => {
  const key = generateApiKey();
  const hash = hashApiKey(key);
  await upsertHash(hash);
  res.status(201).json({ key });
});

// DELETE /api/admin/api-key — revoke the key
router.delete("/admin/api-key", requireAdmin, async (_req, res) => {
  await db
    .delete(siteConfigTable)
    .where(eq(siteConfigTable.key, API_KEY_HASH_DB_KEY));
  res.json({ success: true });
});

export default router;
