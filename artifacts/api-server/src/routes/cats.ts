import { Router } from "express";
import { db } from "@workspace/db";
import { catsTable, catSubscribersTable } from "@workspace/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { sendCatPresenceNotification } from "../lib/email";

const router = Router();

router.get("/cats", async (req, res) => {
  const cats = await db.select().from(catsTable).orderBy(asc(catsTable.sortOrder));
  res.json(cats);
});

router.get("/cats/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const [cat] = await db.select().from(catsTable).where(eq(catsTable.id, id));
  if (!cat) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(cat);
});

router.post("/cats", requireAdmin, async (req, res) => {
  const body = req.body;
  const [cat] = await db.insert(catsTable).values(body).returning();
  res.status(201).json(cat);
});

router.put("/cats/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const body = req.body;
  const [cat] = await db.update(catsTable).set(body).where(eq(catsTable.id, id)).returning();
  if (!cat) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(cat);
});

router.patch("/cats/:id/presence", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const { presentNow } = req.body as { presentNow: boolean };

  const [prevCat] = await db.select().from(catsTable).where(eq(catsTable.id, id));
  if (!prevCat) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [cat] = await db.update(catsTable).set({ presentNow }).where(eq(catsTable.id, id)).returning();
  if (!cat) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (presentNow && !prevCat.presentNow) {
    const subscribers = await db
      .select({ email: catSubscribersTable.email })
      .from(catSubscribersTable)
      .where(eq(catSubscribersTable.catId, id));

    if (subscribers.length > 0) {
      const emails = subscribers.map((s) => s.email);
      sendCatPresenceNotification(cat.name, emails).catch((err) => {
        console.warn("Failed to send cat presence notifications:", err);
      });
    }
  }

  res.json(cat);
});

router.delete("/cats/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(catsTable).where(eq(catsTable.id, id));
  res.status(204).send();
});

router.post("/cats/:id/subscribe", async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const { email } = req.body as { email?: string };

  if (!email?.trim() || !/\S+@\S+\.\S+/.test(email)) {
    res.status(400).json({ error: "A valid email address is required" });
    return;
  }

  const [cat] = await db.select().from(catsTable).where(eq(catsTable.id, id));
  if (!cat) {
    res.status(404).json({ error: "Cat not found" });
    return;
  }

  const normalised = email.trim().toLowerCase();

  const existing = await db
    .select()
    .from(catSubscribersTable)
    .where(eq(catSubscribersTable.catId, id))
    .then((rows) => rows.find((r) => r.email === normalised));

  if (existing) {
    res.json({ success: true, alreadySubscribed: true });
    return;
  }

  await db.insert(catSubscribersTable).values({ catId: id, email: normalised });
  res.status(201).json({ success: true });
});

router.get("/admin/cats/subscribers", requireAdmin, async (_req, res) => {
  const counts = await db
    .select({
      catId: catSubscribersTable.catId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(catSubscribersTable)
    .groupBy(catSubscribersTable.catId);

  res.json(counts);
});

export default router;
