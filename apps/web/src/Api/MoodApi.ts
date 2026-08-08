import {
  CreateMoodEntrySchema,
  LIST_MOOD_ENTRIES_MAX,
  MoodEntriesResponseSchema,
  MoodEntryResponseSchema,
  type TCreateMoodEntry,
  type TMoodEntry,
} from "@mooduck/contracts";
import { apiRequest } from "./ApiClient";

export interface ListEntriesParams {
  limit?: number;
  /** How many newer entries to skip — the "load older" page cursor. */
  offset?: number;
}

export const moodApi = {
  /** Newest-first page; the first one feeds the chart, the tiles and Recent. */
  listEntries: async ({
    limit = LIST_MOOD_ENTRIES_MAX,
    offset = 0,
  }: ListEntriesParams = {}): Promise<TMoodEntry[]> => {
    const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const { entries } = await apiRequest(`/api/mood/entries?${query}`, MoodEntriesResponseSchema);
    return entries;
  },

  addEntry: async (input: TCreateMoodEntry): Promise<TMoodEntry> => {
    const body = CreateMoodEntrySchema.parse(input);
    const { entry } = await apiRequest("/api/mood/entries", MoodEntryResponseSchema, { method: "POST", body });
    return entry;
  },
};
