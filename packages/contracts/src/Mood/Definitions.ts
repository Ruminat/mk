import { z } from "zod";

export const MOOD_SCORE_MIN = 1;
export const MOOD_SCORE_MAX = 10;

/** Mirrors the bot's `MAX_SYMBOLS` in `handlers/onMessage.ts`. */
export const MOOD_COMMENT_MAX_LENGTH = 1024;

/** The window `/stat` uses; one request feeds the chart, both tiles and Recent. */
export const LIST_MOOD_ENTRIES_MAX = 360;

/** A single mood entry on the wire — the comment is already decrypted. */
export const MoodEntrySchema = z.object({
  id: z.number().int(),
  value: z.number().int().min(MOOD_SCORE_MIN).max(MOOD_SCORE_MAX),
  comment: z.string().nullable(),
  // ISO 8601 UTC; null when the stored timestamp was unreadable (see
  // commonFields.ts — an unreadable value arrives as null, not an Invalid Date).
  createdAt: z.string().nullable(),
});
export type TMoodEntry = z.infer<typeof MoodEntrySchema>;

/** Request body for `POST /api/mood/entries`. */
export const CreateMoodEntrySchema = z.object({
  value: z.number().int().min(MOOD_SCORE_MIN).max(MOOD_SCORE_MAX),
  comment: z.string().max(MOOD_COMMENT_MAX_LENGTH).optional(),
});
export type TCreateMoodEntry = z.infer<typeof CreateMoodEntrySchema>;

/** Response for `GET /api/mood/entries`, newest first. */
export const MoodEntriesResponseSchema = z.object({
  entries: z.array(MoodEntrySchema),
});
export type TMoodEntriesResponse = z.infer<typeof MoodEntriesResponseSchema>;

/** Response for `POST /api/mood/entries`. */
export const MoodEntryResponseSchema = z.object({
  entry: MoodEntrySchema,
});
export type TMoodEntryResponse = z.infer<typeof MoodEntryResponseSchema>;
