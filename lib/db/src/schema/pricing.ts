import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pricingPlansTable = pgTable("pricing_plans", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  step: text("step").notNull().default(""),
  title: text("title").notNull(),
  titleJa: text("title_ja").notNull().default(""),
  price: text("price").notNull(),
  priceNote: text("price_note").notNull().default(""),
  description: text("description").notNull().default(""),
  includes: text("includes").array().notNull().default([]),
  highlight: boolean("highlight").notNull().default(false),
  badge: text("badge").notNull().default(""),
  cta: text("cta").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertPricingPlanSchema = createInsertSchema(pricingPlansTable).omit({ id: true });
export type InsertPricingPlan = z.infer<typeof insertPricingPlanSchema>;
export type PricingPlan = typeof pricingPlansTable.$inferSelect;
