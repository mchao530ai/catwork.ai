import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const catsTable = pgTable("cats", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kanji: text("kanji").notNull().default(""),
  image: text("image").notNull().default(""),
  images: text("images").array().notNull().default([]),
  role: text("role").notNull().default(""),
  breed: text("breed").notNull().default(""),
  personality: text("personality").array().notNull().default([]),
  bio: text("bio").notNull().default(""),
  shortBio: text("short_bio").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  presentNow: boolean("present_now").notNull().default(false),
  onVacation: boolean("on_vacation").notNull().default(false),
});

export const insertCatSchema = createInsertSchema(catsTable).omit({ id: true });
export type InsertCat = z.infer<typeof insertCatSchema>;
export type Cat = typeof catsTable.$inferSelect;
