import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CommonTableField } from "../../common/database/commonFields";

/**
 * Durable per-user chat history for the bot's AI context. Backs the in-memory
 * LRU cache so context survives restarts/releases. Keyed by the same hashed
 * telegram user id used everywhere else (getTelegramUserIdSecureHash).
 */
export const TelegramChatMessageTable = sqliteTable(
  "telegram_chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    telegramUserIdHash: text("telegram_user_id_hash").notNull(),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    text: text("text").notNull(),
    createdAt: CommonTableField.createdAt.default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("telegram_chat_messages_user_idx").on(table.telegramUserIdHash)],
);

export type TInsertTelegramChatMessage = typeof TelegramChatMessageTable.$inferInsert;
export type TSelectTelegramChatMessage = typeof TelegramChatMessageTable.$inferSelect;
