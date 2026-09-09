import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const instagramConnectionTable = pgTable("instagram_connection", {
  id: serial("id").primaryKey(),
  accountId: text("account_id").notNull().default(""),
  username: text("username").notNull().default(""),
  accessToken: text("access_token").notNull().default(""),
  tokenExpiry: timestamp("token_expiry"),
  oauthState: text("oauth_state"),
  oauthStateExpiry: timestamp("oauth_state_expiry"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInstagramConnectionSchema = createInsertSchema(instagramConnectionTable).omit({ id: true });
export type InsertInstagramConnection = z.infer<typeof insertInstagramConnectionSchema>;
export type InstagramConnection = typeof instagramConnectionTable.$inferSelect;
