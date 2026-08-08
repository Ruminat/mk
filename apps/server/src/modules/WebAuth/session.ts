import { z } from "zod";
import { decryptWithSecret, encryptWithSecret } from "../crypto/userDataCryptoCore";

/**
 * The session cookie *is* the session — there is no session table. It carries the
 * numeric telegram id (needed to decrypt comments, never persisted), the identity
 * hash, and the display name/avatar (which live nowhere else). It's sealed with
 * AES-256-GCM by the audited crypto core, keyed off `WEB_SESSION_SECRET`.
 */

export const SESSION_COOKIE_NAME = "mooduck_session";
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
/** Re-seal with a fresh `exp` once the session is more than a day old. */
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * A fixed domain constant (not a real user) so the crypto core derives one
 * server-wide session key from `WEB_SESSION_SECRET`. Real telegram ids are always
 * positive, so this can never collide with a per-user data key.
 */
const SESSION_KEY_DOMAIN = 0;

const SessionPayloadSchema = z.object({
  tgId: z.number().int().positive(),
  hash: z.string().min(1),
  name: z.string(),
  photo: z.string().optional(),
  exp: z.number().int(),
});
export type TSessionPayload = z.infer<typeof SessionPayloadSchema>;

/** Build a payload with `exp` set `SESSION_TTL_SECONDS` into the future. */
export function mintSessionPayload(
  data: Omit<TSessionPayload, "exp">,
  now: number,
): TSessionPayload {
  return { ...data, exp: now + SESSION_TTL_MS };
}

export function sealSession(payload: TSessionPayload, secret: string): string {
  return encryptWithSecret(JSON.stringify(payload), { telegramId: SESSION_KEY_DOMAIN, secret });
}

/**
 * Decrypt and validate a cookie value. Returns null for anything we didn't seal,
 * a tampered blob (GCM auth fails), a malformed payload, or an expired session —
 * every failure collapses to "no session", which the caller turns into a 401.
 */
export function unsealSession(value: string, secret: string, now: number): TSessionPayload | null {
  let json: string;
  try {
    json = decryptWithSecret(value, { telegramId: SESSION_KEY_DOMAIN, secret });
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  const result = SessionPayloadSchema.safeParse(parsed);
  if (!result.success) {
    return null;
  }
  if (result.data.exp <= now) {
    return null;
  }
  return result.data;
}

/** True once the session is old enough that `GET /api/auth/session` should re-seal it. */
export function shouldRenewSession(payload: TSessionPayload, now: number): boolean {
  const issuedAt = payload.exp - SESSION_TTL_MS;
  return now - issuedAt > RENEW_AFTER_MS;
}

/** Parse the one cookie we care about from a raw `Cookie` header (no dependency). */
export function readSessionCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const name = part.slice(0, eq).trim();
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/** Serialize the Set-Cookie header for a fresh session. */
export function serializeSessionCookie(value: string, secure: boolean): string {
  return buildCookie(encodeURIComponent(value), SESSION_TTL_SECONDS, secure);
}

/** Serialize the Set-Cookie header that clears the session (logout). */
export function serializeClearedSessionCookie(secure: boolean): string {
  return buildCookie("", 0, secure);
}

function buildCookie(value: string, maxAgeSeconds: number, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${value}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
