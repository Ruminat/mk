import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * Pure verification of a Telegram **Login Widget** payload. This is deliberately
 * env-free and express-free so it can be unit-tested exhaustively — it's the
 * single highest-value test in the whole web feature.
 *
 * NOTE: Login Widget verification is NOT Mini App `initData` verification:
 *
 *   data_check_string = every received field except `hash`, "key=value",
 *                       sorted alphabetically by key, joined with "\n"
 *   secret_key        = SHA256(bot_token)                  // raw bytes, NOT hmac
 *   expected          = HMAC_SHA256(data_check_string, secret_key).hex()
 *
 * (Mini Apps use HMAC(bot_token, "WebAppData") — using the wrong one fails 100%
 * of the time and looks like a config bug.)
 */

const DEFAULT_MAX_AGE_SECONDS = 15 * 60;
const MAX_NAME_LENGTH = 256;
const MAX_PHOTO_URL_LENGTH = 2048;
/**
 * Hosts an avatar may come from. This is the SSRF guard for `/api/auth/avatar`,
 * which fetches whatever URL ends up in the session — so the list bounds where
 * the server can be made to send a request, and nothing outside Telegram's own
 * names belongs on it. `telesco.pe` is Telegram's userpic CDN, which
 * `t.me/i/userpic/…` redirects to and which it sometimes returns directly.
 *
 * A host Telegram starts using that isn't here means no avatar at all, so the
 * login logs the host it rejected (see `controller.ts`) rather than going quiet.
 */
const ALLOWED_PHOTO_HOSTS = ["t.me", "telegram.org", "telesco.pe"];

export type TVerifiedLogin = {
  id: number;
  firstName: string;
  photoUrl?: string;
  authDate: number;
};

export type TVerifyLoginResult =
  | { ok: true; user: TVerifiedLogin }
  | { ok: false; reason: "malformed" | "invalid_hash" | "expired" | "invalid_id" };

export type TVerifyLoginOptions = {
  /** Injected for tests; defaults to `Date.now()`. */
  now?: number;
  maxAgeSeconds?: number;
};

export function verifyTelegramLogin(
  payload: Record<string, unknown>,
  botToken: string,
  options: TVerifyLoginOptions = {},
): TVerifyLoginResult {
  const now = options.now ?? Date.now();
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;

  const providedHash = payload["hash"];
  if (typeof providedHash !== "string" || providedHash.length === 0) {
    return { ok: false, reason: "malformed" };
  }

  // Every field except `hash`, "key=value", sorted by key, "\n"-joined. Unknown
  // extra fields are included on purpose — Telegram may add fields, and they all
  // count toward the signature.
  const dataCheckString = Object.keys(payload)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${stringifyField(payload[key])}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!timingSafeHexEqual(expected, providedHash)) {
    return { ok: false, reason: "invalid_hash" };
  }

  // Only trust the fields now that the HMAC holds.
  const id = toPositiveInt(payload["id"]);
  if (id === null) {
    return { ok: false, reason: "invalid_id" };
  }

  const authDate = toInt(payload["auth_date"]);
  if (authDate === null) {
    return { ok: false, reason: "malformed" };
  }
  const ageMs = now - authDate * 1000;
  if (ageMs > maxAgeSeconds * 1000 || ageMs < -maxAgeSeconds * 1000) {
    return { ok: false, reason: "expired" };
  }

  const firstName = cap(String(payload["first_name"] ?? ""), MAX_NAME_LENGTH);
  const photoUrl = sanitizePhotoUrl(payload["photo_url"]);

  return {
    ok: true,
    user: { id, firstName, authDate, ...(photoUrl ? { photoUrl } : {}) },
  };
}

function stringifyField(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return Number(value);
  }
  return null;
}

function toPositiveInt(value: unknown): number | null {
  const parsed = toInt(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function cap(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** Keep only an `https://` avatar on a Telegram host; otherwise drop it. */
function sanitizePhotoUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_PHOTO_URL_LENGTH) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") {
    return undefined;
  }
  const host = url.hostname.toLowerCase();
  const allowed = ALLOWED_PHOTO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  return allowed ? value : undefined;
}
