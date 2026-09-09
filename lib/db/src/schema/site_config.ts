import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteConfigTable = pgTable("site_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSiteConfigSchema = createInsertSchema(siteConfigTable).omit({ id: true });
export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
export type SiteConfig = typeof siteConfigTable.$inferSelect;
