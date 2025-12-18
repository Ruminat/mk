import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { Request } from "express";

export const UserTable = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  passwordHash: text("password_hash"),
  telegramId: text("telegram_id"),
  authProvider: text("auth_provider").notNull().default("telegram"), // 'telegram' | 'email'
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type TInsertUser = typeof UserTable.$inferInsert;
export type TSelectUser = typeof UserTable.$inferSelect;

export type AuthenticatedRequest = Request & {
  user: TSelectUser;
};
