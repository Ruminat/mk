import { z } from "zod";

export const TelegramAuthSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

export const EmailAuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type TTelegramAuth = z.infer<typeof TelegramAuthSchema>;
export type TEmailAuth = z.infer<typeof EmailAuthSchema>;
