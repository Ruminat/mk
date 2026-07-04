import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { Request } from "express";

/**
 * Telegram is the single source of truth for identity. `id` is the secure hash
 * of the Telegram user id (see getTelegramUserIdSecureHash), which is also the
 * key mood entries are stored under — so the bot and the web/API share one user.
 */
export const UserTable = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  telegramId: text("telegram_id"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type TInsertUser = typeof UserTable.$inferInsert;
export type TSelectUser = typeof UserTable.$inferSelect;

export type AuthenticatedRequest = Request & {
  user: TSelectUser;
};
