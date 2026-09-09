import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("news"),
  date: text("date").notNull(),
  title: text("title").notNull(),
  titleJa: text("title_ja").notNull().default(""),
  summary: text("summary").notNull(),
  image: text("image").notNull().default(""),
  tag: text("tag").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
