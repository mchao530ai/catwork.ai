import { Router } from "express";
import { db } from "@workspace/db";
import { siteConfigTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/site-config", async (req, res) => {
  const rows = await db.select().from(siteConfigTable);
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  res.json(config);
});

router.put("/site-config/:key", requireAdmin, async (req, res) => {
  const key = req.params["key"] as string;
  const { value } = req.body as { value: string };

  const existing = await db.select().from(siteConfigTable).where(eq(siteConfigTable.key, key));
  let row;
  if (existing.length > 0) {
    [row] = await db.update(siteConfigTable).set({ value }).where(eq(siteConfigTable.key, key)).returning();
  } else {
    [row] = await db.insert(siteConfigTable).values({ key, value }).returning();
  }
  res.json(row);
});

export default router;
