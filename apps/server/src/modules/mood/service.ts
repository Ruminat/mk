import { db } from "../../db/client";
import { MoodTable, TInsertMoodEntry } from "./model";

export const moodService = {
  addMoodEntry: async (entry: TInsertMoodEntry) => {
    const response = await db.insert(MoodTable).values(entry);

    return { status: 200, result: {} };
  },

  deleteMoodEntry: controller(async () => {
    return { status: 200, result: {} };
  }),

  listMoodEntries: controller(async () => {
    return { status: 200, result: {} };
  }),
};
