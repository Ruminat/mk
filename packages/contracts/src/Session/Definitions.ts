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
 * The Login Widget hands its result back by navigating to `data-auth-url` with
 * the signed fields appended, so login finishes as a plain GET on our own origin
 * rather than a JS callback. (The callback form, `data-onauth`, is parsed with
 * `eval` inside telegram-widget.js and would force `'unsafe-eval'` into the
 * app's CSP.)
 *
 * A GET that mints a session is open to login CSRF — an attacker can't forge
 * someone else's signed payload, but they can hand a victim a link carrying
 * their own, silently signing the victim into the attacker's account. The
 * defence is a one-shot nonce: the browser writes it to a cookie and echoes it
 * in the query, and the server only accepts a callback where the two agree.
 *
 * Both sides read these constants, so the cookie the browser writes and the one
 * the server reads and clears cannot drift apart.
 */
export const LOGIN_STATE_COOKIE_NAME = "mooduck_login_state";
/** Narrow enough that the nonce is never sent to anything but the auth routes. */
export const LOGIN_STATE_COOKIE_PATH = "/api/auth";
/** Long enough to finish a Telegram login, short enough to be useless later. */
export const LOGIN_STATE_TTL_SECONDS = 10 * 60;
/** Query parameter the nonce is echoed back in. Telegram never signs it. */
export const LOGIN_STATE_PARAM = "state";

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
