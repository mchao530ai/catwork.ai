import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const photosTable = pgTable("photos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption").notNull().default(""),
  category: text("category").notNull().default("cafe"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertPhotoSchema = createInsertSchema(photosTable).omit({ id: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photosTable.$inferSelect;
