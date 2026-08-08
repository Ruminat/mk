import { LIST_MOOD_ENTRIES_MAX } from "@mooduck/contracts";
import { z } from "zod";

/**
 * Query for `GET /api/mood/entries`. `limit` is capped at the same 360-entry
 * window `/stat` uses; the service caps it again, so this is a fast reject for
 * obviously-bad input rather than the only guard.
 */
export const ListMoodEntriesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(LIST_MOOD_ENTRIES_MAX).optional(),
});
