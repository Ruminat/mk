import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { CommonTableField } from "../../models/commonFields";

export type TMoodValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const MoodTable = sqliteTable("mood_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  value: integer("value").notNull(),
  comment: text("comment"),
  userId: CommonTableField.userId.notNull(),
  createdAt: CommonTableField.createdAt.default(sql`CURRENT_TIMESTAMP`),
});

export type TInsertMoodEntry = typeof MoodTable.$inferInsert;
export type TSelectMoodEntry = typeof MoodTable.$inferSelect;

export type TAddMoodRequest = Omit<TInsertMoodEntry, "id" | "createdAt" | "userId">;

export const AddMoodRequestSchema = z.object({
  value: z.number().int().min(1).max(10),
  comment: z.string().nullable().optional(),
});

export type TAddMoodRequestSchema = z.infer<typeof AddMoodRequestSchema>;
