import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  partySize: integer("party_size").notNull().default(1),
  notes: text("notes").notNull().default(""),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
