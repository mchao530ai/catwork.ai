import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/events", async (req, res) => {
  const events = await db.select().from(eventsTable).orderBy(asc(eventsTable.sortOrder));
  res.json(events);
});

router.post("/events", requireAdmin, async (req, res) => {
  const body = req.body;
  const [event] = await db.insert(eventsTable).values(body).returning();
  res.status(201).json(event);
});

router.put("/events/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const body = req.body;
  const [event] = await db.update(eventsTable).set(body).where(eq(eventsTable.id, id)).returning();
  if (!event) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(event);
});

router.delete("/events/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.status(204).send();
});

export default router;
