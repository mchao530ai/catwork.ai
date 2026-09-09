import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, enquiriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { sendAdminReply } from "../lib/email";

const router = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/admin/email/reply", requireAdmin, async (req, res) => {
  const { recordType, recordId, subject, message } = req.body as {
    recordType?: string;
    recordId?: number;
    subject?: string;
    message?: string;
  };

  if (recordType !== "booking" && recordType !== "enquiry") {
    res.status(400).json({ error: "recordType must be booking or enquiry" });
    return;
  }

  const id = typeof recordId === "number" ? recordId : Number(recordId);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "A valid recordId is required" });
    return;
  }

  const cleanSubject = typeof subject === "string" ? subject.trim() : "";
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  if (!cleanSubject) {
    res.status(400).json({ error: "Subject is required" });
    return;
  }
  if (cleanSubject.length > 200 || /[\r\n]/.test(cleanSubject)) {
    res.status(400).json({ error: "Subject must be 200 characters or fewer" });
    return;
  }
  if (!cleanMessage) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  if (cleanMessage.length > 10000) {
    res.status(400).json({ error: "Message must be 10,000 characters or fewer" });
    return;
  }

  const record = recordType === "booking"
    ? (await db
        .select({ email: bookingsTable.email })
        .from(bookingsTable)
        .where(eq(bookingsTable.id, id))
        .limit(1))[0]
    : (await db
        .select({ email: enquiriesTable.email })
        .from(enquiriesTable)
        .where(eq(enquiriesTable.id, id))
        .limit(1))[0];

  if (!record) {
    res.status(404).json({ error: "The selected customer record was not found" });
    return;
  }
  if (!EMAIL_PATTERN.test(record.email)) {
    res.status(422).json({ error: "The selected customer does not have a valid email address" });
    return;
  }

  const result = await sendAdminReply({
    to: record.email,
    subject: cleanSubject,
    message: cleanMessage,
  });

  if (!result.sent) {
    console.warn("Admin reply email failed:", result.error);
    res.status(502).json({
      error: "The email could not be sent. Please try again or use Open in email app.",
    });
    return;
  }

  res.json({ success: true, to: record.email });
});

export default router;