import { timingSafeEqual } from "crypto";
import { LOGIN_STATE_COOKIE_NAME, LOGIN_STATE_COOKIE_PATH } from "@mooduck/contracts";
import { serializeCookie } from "./cookies";

/**
 * The one-shot nonce that makes `GET /api/auth/telegram/callback` safe.
 *
 * The browser generates it, writes it to a cookie, and puts the same value in
 * the callback URL it hands Telegram. A callback is only honoured when the two
 * agree — which an attacker replaying their *own* validly signed Telegram
 * payload can't arrange, because they can't write a cookie on our origin. That
 * closes login CSRF: without it, a link could silently sign a victim into the
 * attacker's account, and every check-in the victim then wrote would land in it.
 *
 * The nonce proves nothing about identity. That is still, and only, the HMAC.
 */

/** Wide enough for any sane nonce, narrow enough to reject junk outright. */
const MIN_LENGTH = 16;
const MAX_LENGTH = 128;
const ALLOWED = /^[A-Za-z0-9_-]+$/;

export function isWellFormedLoginState(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= MIN_LENGTH &&
    value.length <= MAX_LENGTH &&
    ALLOWED.test(value)
  );
}

/**
 * True when the nonce echoed in the query matches the one in the cookie. Both
 * must be present and well-formed; a missing cookie is a failure, never a pass.
 */
export function loginStateMatches(fromQuery: unknown, fromCookie: string | undefined): boolean {
  if (!isWellFormedLoginState(fromQuery) || !isWellFormedLoginState(fromCookie)) {
    return false;
  }

  const query = Buffer.from(fromQuery);
  const cookie = Buffer.from(fromCookie);

  if (query.length !== cookie.length) {
    return false;
  }

  return timingSafeEqual(query, cookie);
}

/**
 * Clear the nonce cookie. Name and path must match what the browser wrote (both
 * sides read the constants from `@mooduck/contracts`) or the browser keeps it.
 * Always sent on the callback response, success or failure — it is single-use.
 */
export function serializeClearedLoginStateCookie(secure: boolean): string {
  return serializeCookie(LOGIN_STATE_COOKIE_NAME, "", {
    maxAgeSeconds: 0,
    secure,
    // Lax, matching the browser: the callback is a top-level GET navigation, and
    // Strict would withhold the cookie if Telegram ever returned via a redirect
    // of its own rather than through our page.
    sameSite: "Lax",
    path: LOGIN_STATE_COOKIE_PATH,
  });
}
