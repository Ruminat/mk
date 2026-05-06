import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { ServiceError } from "../../services/errors/ServiceError";
import { MoodTable, TInsertMoodEntry, TSelectMoodEntry } from "./model";

const LIST_MOOD_ENTRIES_MAX = 360;

export const moodService = {
  addMoodEntry: async (entry: TInsertMoodEntry) => {
    const response = await db.insert(MoodTable).values(entry).returning();

    if (response.length !== 1) {
      throw new ServiceError("Failed to add mood entry");
    }

    const [row] = response;

    return row;
  },

  deleteMoodEntry: async ({ entryId, userId }: { entryId: TSelectMoodEntry["id"]; userId: string }) => {
    const response = await db
      .delete(MoodTable)
      .where(and(eq(MoodTable.id, entryId), eq(MoodTable.telegramUserIdHash, userId)));

    if (response.rowsAffected !== 1) {
      throw new ServiceError("Failed to delete the mood entry");
    }
  },

  listMoodEntries: async ({ userId, limit = LIST_MOOD_ENTRIES_MAX }: { userId: string; limit?: number }) => {
    const cappedLimit = Math.min(limit, LIST_MOOD_ENTRIES_MAX);
    const response = await db
      .select()
      .from(MoodTable)
      .where(eq(MoodTable.telegramUserIdHash, userId))
      .orderBy(desc(sql`datetime(${MoodTable.createdAt})`), desc(MoodTable.id))
      .limit(cappedLimit);

    return response;
  },
};
