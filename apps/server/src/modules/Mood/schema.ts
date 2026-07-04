import { z } from "zod";

/**
 * Upper bound on a mood comment. Without it the API accepted an arbitrarily
 * large string that then hit the DB, every Telegram render, and the paid AI
 * prompt. Generous for a short mood note, in line with the bot's message cap.
 */
export const MOOD_COMMENT_MAX_LENGTH = 1000;

export const AddMoodRequestSchema = z.object({
  value: z.number().int().min(1).max(10),
  comment: z
    .string()
    .max(MOOD_COMMENT_MAX_LENGTH, `Комментарий слишком длинный (максимум ${MOOD_COMMENT_MAX_LENGTH} символов)`)
    .optional(),
});

export const DeleteMoodRequestSchema = z.object({
  id: z.number(),
});

export type TAddMoodRequestSchema = z.infer<typeof AddMoodRequestSchema>;
export type TDeleteMoodRequestSchema = z.infer<typeof DeleteMoodRequestSchema>;
