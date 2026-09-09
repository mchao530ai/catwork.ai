import { Router } from "express";
import { db } from "@workspace/db";
import { transportInfoTable, nearbyLandmarksTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/site-config/transport", async (req, res) => {
  const rows = await db
    .select()
    .from(transportInfoTable)
    .orderBy(asc(transportInfoTable.sortOrder));
  res.json(rows);
});

router.post("/site-config/transport", requireAdmin, async (req, res) => {
  const [row] = await db.insert(transportInfoTable).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/site-config/transport/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const [row] = await db
    .update(transportInfoTable)
    .set(req.body)
    .where(eq(transportInfoTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/site-config/transport/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(transportInfoTable).where(eq(transportInfoTable.id, id));
  res.status(204).send();
});

router.get("/site-config/landmarks", async (req, res) => {
  const rows = await db
    .select()
    .from(nearbyLandmarksTable)
    .orderBy(asc(nearbyLandmarksTable.sortOrder));
  res.json(rows);
});

router.post("/site-config/landmarks", requireAdmin, async (req, res) => {
  const [row] = await db.insert(nearbyLandmarksTable).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/site-config/landmarks/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const [row] = await db
    .update(nearbyLandmarksTable)
    .set(req.body)
    .where(eq(nearbyLandmarksTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/site-config/landmarks/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(nearbyLandmarksTable).where(eq(nearbyLandmarksTable.id, id));
  res.status(204).send();
});

export default router;
