import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const adminSessionsTable = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  accountId: integer("account_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AdminSession = typeof adminSessionsTable.$inferSelect;
