import { Router } from "express";
import { db } from "@workspace/db";
import { pricingPlansTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/pricing", async (req, res) => {
  const plans = await db.select().from(pricingPlansTable).orderBy(asc(pricingPlansTable.sortOrder));
  res.json(plans);
});

router.post("/pricing", requireAdmin, async (req, res) => {
  const body = req.body;
  const [plan] = await db.insert(pricingPlansTable).values(body).returning();
  res.status(201).json(plan);
});

router.put("/pricing/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const body = req.body;
  const [plan] = await db.update(pricingPlansTable).set(body).where(eq(pricingPlansTable.id, id)).returning();
  if (!plan) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(plan);
});

router.delete("/pricing/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(pricingPlansTable).where(eq(pricingPlansTable.id, id));
  res.status(204).send();
});

export default router;
