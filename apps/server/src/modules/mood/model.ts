import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CommonTableField } from "../../models/commonFields";

export const MoodTable = sqliteTable("mood_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  value: integer("value").notNull(),
  comment: text("comment"),
  userId: CommonTableField.userId.notNull(),
  createdAt: CommonTableField.createdAt.default(sql`CURRENT_TIMESTAMP`),
});

export type TInsertMoodEntry = typeof MoodTable.$inferInsert;
export type TSelectMoodEntry = typeof MoodTable.$inferSelect;
