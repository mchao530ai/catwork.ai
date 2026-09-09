import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { catsTable } from "./cats";

export const catSubscribersTable = pgTable("cat_subscribers", {
  id: serial("id").primaryKey(),
  catId: integer("cat_id")
    .notNull()
    .references(() => catsTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
