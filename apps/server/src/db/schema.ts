import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const userId = text("user_id");
const createdAt = text("created_at");

export const moodEntriesTable = sqliteTable("mood_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  value: integer("value").notNull(),
  comment: text("comment"),
  userId: userId.notNull(),
  createdAt: createdAt.default(sql`CURRENT_TIMESTAMP`),
});

export const userSettingsTable = sqliteTable("user_settings", {
  userId: userId.primaryKey(),
  theme: text("theme"),
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" }).default(false),
});

export const usersTable = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
});

export type TInsertMoodEntry = typeof moodEntriesTable.$inferInsert;
export type TSelectMoodEntry = typeof moodEntriesTable.$inferSelect;

export type TInsertUserSettings = typeof userSettingsTable.$inferInsert;
export type TSelectUserSettings = typeof userSettingsTable.$inferSelect;

export type TInsertUser = typeof usersTable.$inferInsert;
export type TSelectUser = typeof usersTable.$inferSelect;
