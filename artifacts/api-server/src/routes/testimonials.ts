import { Router } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/testimonials", async (req, res) => {
  const rows = await db
    .select()
    .from(testimonialsTable)
    .orderBy(asc(testimonialsTable.sortOrder));
  res.json(rows);
});

router.post("/testimonials", requireAdmin, async (req, res) => {
  const [row] = await db.insert(testimonialsTable).values(req.body).returning();
  res.status(201).json(row);
});

router.put("/testimonials/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const [row] = await db
    .update(testimonialsTable)
    .set(req.body)
    .where(eq(testimonialsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/testimonials/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
  res.status(204).send();
});

export default router;
