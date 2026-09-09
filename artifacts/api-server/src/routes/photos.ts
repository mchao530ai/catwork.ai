import { Router } from "express";
import { db } from "@workspace/db";
import { photosTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/photos", async (req, res) => {
  const photos = await db.select().from(photosTable).orderBy(asc(photosTable.sortOrder));
  res.json(photos);
});

router.post("/photos", requireAdmin, async (req, res) => {
  const body = req.body;
  const [photo] = await db.insert(photosTable).values(body).returning();
  res.status(201).json(photo);
});

router.put("/photos/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const body = req.body;
  const [photo] = await db.update(photosTable).set(body).where(eq(photosTable.id, id)).returning();
  if (!photo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(photo);
});

router.delete("/photos/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(photosTable).where(eq(photosTable.id, id));
  res.status(204).send();
});

export default router;
