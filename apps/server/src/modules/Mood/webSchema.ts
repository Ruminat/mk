import { LIST_MOOD_ENTRIES_MAX } from "@mooduck/contracts";
import { z } from "zod";

/**
 * Query for `GET /api/mood/entries`. `limit` is capped at the same 360-entry
 * window `/stat` uses; the service caps it again, so this is a fast reject for
 * obviously-bad input rather than the only guard.
 *
 * `offset` pages further back for the web's "load older" scroll. It needs no
 * ceiling: the query is already restricted to one user's rows, so a silly offset
 * costs that user an empty page and nobody else anything.
 */
export const ListMoodEntriesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(LIST_MOOD_ENTRIES_MAX).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
