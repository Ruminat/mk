import { z } from "zod";

/**
 * The payload the Telegram Login Widget hands back to the browser. `id` and
 * `auth_date` arrive as numbers, the rest as strings; Telegram may add more
 * fields over time, which is why HMAC verification works over the *raw* body
 * rather than this parsed (and therefore field-stripped) shape.
 */
export const TelegramLoginPayloadSchema = z.object({
  id: z.number().int().positive(),
  auth_date: z.number().int(),
  hash: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
});
export type TTelegramLoginPayload = z.infer<typeof TelegramLoginPayloadSchema>;

/**
 * The only user profile the web ever exposes. It lives in the sealed session
 * cookie and is never persisted — no `users` table, no numeric id at rest.
 */
export const SessionUserSchema = z.object({
  name: z.string(),
  photo: z.string().optional(),
});
export type TSessionUser = z.infer<typeof SessionUserSchema>;

/** Response for `POST /api/auth/telegram` and `GET /api/auth/session`. */
export const SessionResponseSchema = z.object({
  user: SessionUserSchema,
});
export type TSessionResponse = z.infer<typeof SessionResponseSchema>;
