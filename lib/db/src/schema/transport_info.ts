import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transportInfoTable = pgTable("transport_info", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  note: text("note").notNull().default(""),
  titleJa: text("title_ja"),
  descriptionJa: text("description_ja"),
  noteJa: text("note_ja"),
  titleZh: text("title_zh"),
  descriptionZh: text("description_zh"),
  noteZh: text("note_zh"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertTransportInfoSchema = createInsertSchema(transportInfoTable).omit({ id: true });
export type InsertTransportInfo = z.infer<typeof insertTransportInfoSchema>;
export type TransportInfo = typeof transportInfoTable.$inferSelect;
