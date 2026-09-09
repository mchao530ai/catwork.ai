import { Router } from "express";
import { db } from "@workspace/db";
import { faqsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/faqs", async (req, res) => {
  const faqs = await db.select().from(faqsTable).orderBy(asc(faqsTable.sortOrder));
  res.json(faqs);
});

router.post("/faqs", requireAdmin, async (req, res) => {
  const body = req.body;
  const [faq] = await db.insert(faqsTable).values(body).returning();
  res.status(201).json(faq);
});

router.put("/faqs/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const body = req.body;
  const [faq] = await db.update(faqsTable).set(body).where(eq(faqsTable.id, id)).returning();
  if (!faq) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(faq);
});

router.delete("/faqs/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(faqsTable).where(eq(faqsTable.id, id));
  res.status(204).send();
});

export default router;
