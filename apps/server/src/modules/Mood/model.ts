import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CommonTableField } from "../../common/commonFields";

/**
 * Stores hashed telegram user ID (from getTelegramUserIdSecureHash).
 * No user registration - only the hash is persisted.
 */
export const MoodTable = sqliteTable("mood_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  value: integer("value").notNull(),
  comment: text("comment"),
  telegramUserIdHash: text("telegram_user_id_hash").notNull(),
  createdAt: CommonTableField.createdAt.default(sql`CURRENT_TIMESTAMP`),
});

export type TInsertMoodEntry = typeof MoodTable.$inferInsert;
export type TSelectMoodEntry = typeof MoodTable.$inferSelect;
