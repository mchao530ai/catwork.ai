import { Router } from "express";
import { db } from "@workspace/db";
import { enquiriesTable, siteConfigTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/auth";
import { eq, desc } from "drizzle-orm";
import { sendEnquiryNotification } from "../lib/email";

const router = Router();

router.post("/contact", async (req, res) => {
  const { name, email, phone, enquiryType, subject, message } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    enquiryType?: string;
    subject?: string;
    message?: string;
  };

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    res.status(400).json({ error: "Name, email and message are required" });
    return;
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const [enquiry] = await db
    .insert(enquiriesTable)
    .values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() ?? "",
      enquiryType: enquiryType ?? "general",
      subject: subject?.trim() ?? "",
      message: message.trim(),
    })
    .returning();

  const emailResult = await sendEnquiryNotification({
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    enquiryType: enquiryType ?? "general",
    subject: subject?.trim(),
    message: message.trim(),
  });

  if (!emailResult.sent) {
    console.warn("Email notification failed:", emailResult.error);
  }

  res.status(201).json({ success: true, id: enquiry!.id });
});

router.get("/admin/enquiries", requireAdmin, async (_req, res) => {
  const enquiries = await db
    .select()
    .from(enquiriesTable)
    .orderBy(desc(enquiriesTable.createdAt));
  res.json(enquiries);
});

router.get("/admin/enquiries/unread-count", requireAdmin, async (_req, res) => {
  const all = await db
    .select({ isRead: enquiriesTable.isRead })
    .from(enquiriesTable);
  const count = all.filter((e) => !e.isRead).length;
  res.json({ count });
});

router.patch("/admin/enquiries/:id/read", requireAdmin, async (req, res) => {
  const id = Number(req.params["id"]);
  const { isRead } = req.body as { isRead?: boolean };

  await db
    .update(enquiriesTable)
    .set({ isRead: isRead ?? true })
    .where(eq(enquiriesTable.id, id));

  res.json({ success: true });
});

router.delete("/admin/enquiries/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(enquiriesTable).where(eq(enquiriesTable.id, id));
  res.status(204).send();
});

export default router;
