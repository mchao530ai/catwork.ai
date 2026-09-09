import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";

export const adminAccountsTable = pgTable("admin_accounts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AdminAccount = typeof adminAccountsTable.$inferSelect;
