import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const faqsTable = pgTable("faqs", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().default("booking"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  questionJa: text("question_ja"),
  answerJa: text("answer_ja"),
  questionZh: text("question_zh"),
  answerZh: text("answer_zh"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertFaqSchema = createInsertSchema(faqsTable).omit({ id: true });
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqsTable.$inferSelect;
