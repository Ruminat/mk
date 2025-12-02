import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { ServiceError } from "../../services/errors/ServiceError";
import { MoodTable, TInsertMoodEntry, TSelectMoodEntry } from "./model";

export const moodService = {
  addMoodEntry: async (entry: TInsertMoodEntry) => {
    const response = await db.insert(MoodTable).values(entry).returning();

    if (response.length !== 1) {
      new ServiceError("Failed to add mood entry");
    }

    const [row] = response;

    return row;
  },

  deleteMoodEntry: async (entryId: TSelectMoodEntry["id"]) => {
    const response = await db.delete(MoodTable).where(eq(MoodTable.id, entryId));

    if (response.rows.length !== 1) {
      new ServiceError("Failed to delete the mood entry");
    }
  },

  listMoodEntries: async ({ userId }: Pick<TSelectMoodEntry, "userId">) => {
    const response = await db.select().from(MoodTable).where(eq(MoodTable.userId, userId));

    return response;
  },
};
