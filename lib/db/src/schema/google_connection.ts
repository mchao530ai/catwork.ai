import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const googleConnectionTable = pgTable("google_connection", {
  id: serial("id").primaryKey(),
  accountEmail: text("account_email").notNull().default(""),
  accountId: text("account_id").notNull().default(""),
  locationId: text("location_id").notNull().default(""),
  accessToken: text("access_token").notNull().default(""),
  refreshToken: text("refresh_token").notNull().default(""),
  tokenExpiry: timestamp("token_expiry"),
  oauthState: text("oauth_state"),
  oauthStateExpiry: timestamp("oauth_state_expiry"),
  lastSyncHours: timestamp("last_sync_hours"),
  lastSyncDescription: timestamp("last_sync_description"),
  lastSyncPhotos: timestamp("last_sync_photos"),
  lastSyncPosts: timestamp("last_sync_posts"),
  lastSyncWebsiteUrl: timestamp("last_sync_website_url"),
  statusHours: text("status_hours").notNull().default(""),
  statusDescription: text("status_description").notNull().default(""),
  statusPhotos: text("status_photos").notNull().default(""),
  statusPosts: text("status_posts").notNull().default(""),
  statusWebsiteUrl: text("status_website_url").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoogleConnectionSchema = createInsertSchema(googleConnectionTable).omit({ id: true });
export type InsertGoogleConnection = z.infer<typeof insertGoogleConnectionSchema>;
export type GoogleConnection = typeof googleConnectionTable.$inferSelect;
