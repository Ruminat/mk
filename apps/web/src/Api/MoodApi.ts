import {
  CreateMoodEntrySchema,
  LIST_MOOD_ENTRIES_MAX,
  MoodEntriesResponseSchema,
  MoodEntryResponseSchema,
  type TCreateMoodEntry,
  type TMoodEntry,
} from "@mooduck/contracts";
import { apiRequest } from "./ApiClient";

export const moodApi = {
  /** Newest-first window; one request feeds the chart, both tiles and Recent. */
  listEntries: async (limit: number = LIST_MOOD_ENTRIES_MAX): Promise<TMoodEntry[]> => {
    const { entries } = await apiRequest(`/api/mood/entries?limit=${limit}`, MoodEntriesResponseSchema);
    return entries;
  },

  addEntry: async (input: TCreateMoodEntry): Promise<TMoodEntry> => {
    const body = CreateMoodEntrySchema.parse(input);
    const { entry } = await apiRequest("/api/mood/entries", MoodEntryResponseSchema, { method: "POST", body });
    return entry;
  },
};
