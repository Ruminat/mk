import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CommonTableField } from "../../common/database/commonFields";

/**
 * Stores hashed telegram user ID (from getTelegramUserIdSecureHash).
 * No user registration - only the hash is persisted.
 *
 * Every read here is "this one user's newest entries first" — /stat, /last, the
 * mood prompt, locale detection. The index covers both halves of that: the hash
 * narrows to the user, and `created_at` next to it means SQLite walks the index
 * backwards instead of sorting the result. `id` is the rowid and rides along at
 * the end of the index, so the `id DESC` tiebreak comes free.
 */
export const MoodTable = sqliteTable(
  "mood_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    value: integer("value").notNull(),
    comment: text("comment"),
    telegramUserIdHash: text("telegram_user_id_hash").notNull(),
    createdAt: CommonTableField.createdAt().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("mood_entries_user_created_idx").on(table.telegramUserIdHash, table.createdAt)],
);

export type TInsertMoodEntry = typeof MoodTable.$inferInsert;
export type TSelectMoodEntry = typeof MoodTable.$inferSelect;
