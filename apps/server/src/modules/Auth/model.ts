import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { Request } from "express";

/**
 * Telegram is the single source of truth for identity. `id` is the secure hash
 * of the numeric Telegram user id (see getTelegramUserIdSecureHash), which is
 * also the key mood entries and chat history are stored under — so the bot and
 * the web/API resolve to one and the same user.
 *
 * We deliberately store NO raw telegram identity here: not the numeric id, not
 * the username. The numeric id exists only in transit (login payload / bot
 * update) and is never persisted (see plans.md §2/§3). The username is
 * display/admin-only and must never be used as a storage key or hash input.
 */
export const UserTable = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type TInsertUser = typeof UserTable.$inferInsert;
export type TSelectUser = typeof UserTable.$inferSelect;

export type AuthenticatedRequest = Request & {
  user: TSelectUser;
  // Derived at sign-in from the (in-transit) telegram username and carried in the
  // JWT — the username itself is never stored. See requireAdmin / authService.
  isAdmin: boolean;
};
