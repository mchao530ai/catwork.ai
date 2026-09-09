import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testimonialsTable = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  role: text("role").notNull().default(""),
  quote: text("quote").notNull(),
  quoteJa: text("quote_ja"),
  quoteZh: text("quote_zh"),
  avatarUrl: text("avatar_url").notNull().default(""),
  rating: integer("rating").notNull().default(5),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  source: text("source"),
});

export const insertTestimonialSchema = createInsertSchema(testimonialsTable).omit({ id: true });
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonialsTable.$inferSelect;
