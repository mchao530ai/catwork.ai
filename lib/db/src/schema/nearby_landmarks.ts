import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nearbyLandmarksTable = pgTable("nearby_landmarks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  distance: text("distance").notNull(),
  nameJa: text("name_ja"),
  nameZh: text("name_zh"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertNearbyLandmarkSchema = createInsertSchema(nearbyLandmarksTable).omit({ id: true });
export type InsertNearbyLandmark = z.infer<typeof insertNearbyLandmarkSchema>;
export type NearbyLandmark = typeof nearbyLandmarksTable.$inferSelect;
