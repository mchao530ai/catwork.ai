import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const instagramReelsTable = pgTable("instagram_reels", {
  id: serial("id").primaryKey(),
  mediaId: text("media_id").notNull().unique(),
  caption: text("caption").notNull().default(""),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  permalink: text("permalink").notNull().default(""),
  postedAt: timestamp("posted_at"),
  cachedAt: timestamp("cached_at").defaultNow(),
});

export const insertInstagramReelSchema = createInsertSchema(instagramReelsTable).omit({ id: true });
export type InsertInstagramReel = z.infer<typeof insertInstagramReelSchema>;
export type InstagramReel = typeof instagramReelsTable.$inferSelect;
