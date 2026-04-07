import { z } from "zod";

export const AddMoodRequestSchema = z.object({
  value: z.number().int().min(1).max(10),
  comment: z.string().optional(),
});

export const DeleteMoodRequestSchema = z.object({
  id: z.number(),
});

export type TAddMoodRequestSchema = z.infer<typeof AddMoodRequestSchema>;
export type TDeleteMoodRequestSchema = z.infer<typeof DeleteMoodRequestSchema>;
