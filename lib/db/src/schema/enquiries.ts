import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const enquiriesTable = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  enquiryType: text("enquiry_type").notNull().default("general"),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
