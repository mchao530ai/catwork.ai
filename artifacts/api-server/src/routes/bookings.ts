import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable } from "@workspace/db/schema";
import { requireAdmin } from "../middlewares/auth";
import { isBookingDateTooSoon, isValidIsoDate } from "../lib/bookingPolicy";
import { eq, desc } from "drizzle-orm";
import { normalizeBookingLanguage, sendBookingNotification, sendBookingConfirmation } from "../lib/email";

const router = Router();

router.post("/bookings", async (req, res) => {
  const { name, email, phone, date, timeSlot, partySize, notes, language } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    date?: string;
    timeSlot?: string;
    partySize?: string | number;
    notes?: string;
    language?: string;
  };

  if (!name?.trim() || !email?.trim() || !date?.trim() || !timeSlot?.trim()) {
    res.status(400).json({ error: "Name, email, date and time slot are required" });
    return;
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const bookingDate = date.trim();
  if (!isValidIsoDate(bookingDate)) {
    res.status(400).json({
      code: "INVALID_BOOKING_DATE",
      error: "Please provide a valid booking date",
    });
    return;
  }

  if (isBookingDateTooSoon(bookingDate)) {
    res.status(400).json({
      code: "BOOKING_TOO_SOON",
      error: "Bookings must be made at least one day in advance",
    });
    return;
  }

  const size = Math.max(1, Number(partySize) || 1);

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() ?? "",
      date: bookingDate,
      timeSlot: timeSlot.trim(),
      partySize: size,
      notes: notes?.trim() ?? "",
    })
    .returning();

  const emailData = {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    date: bookingDate,
    timeSlot: timeSlot.trim(),
    partySize: size,
    notes: notes?.trim(),
    language: normalizeBookingLanguage(language),
  };

  sendBookingNotification(emailData).then((r) => {
    if (!r.sent) console.warn("Owner booking notification failed:", r.error);
  });

  sendBookingConfirmation(emailData).then((r) => {
    if (!r.sent) console.warn("Guest booking confirmation failed:", r.error);
  });

  res.status(201).json({ success: true, id: booking!.id });
});

router.get("/admin/bookings", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(bookingsTable);
  res.json(rows);
});

router.get("/admin/bookings/unread-count", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(bookingsTable);
  const count = rows.filter((r) => !r.isRead).length;
  res.json({ count });
});

router.patch("/admin/bookings/:id/read", requireAdmin, async (req, res) => {
  const id = Number(req.params["id"]);
  const { isRead } = req.body as { isRead?: boolean };
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .update(bookingsTable)
    .set({ isRead: isRead ?? true })
    .where(eq(bookingsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/admin/bookings/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(bookingsTable).where(eq(bookingsTable.id, id));
  res.json({ success: true });
});

export default router;
