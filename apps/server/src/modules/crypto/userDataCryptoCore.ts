import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "crypto";

/**
 * Pure (env-independent) encryption of user-generated text at rest — mood
 * comments and chat messages. A DB leak must not expose plaintext.
 *
 * Each user gets their own AES-256-GCM key, derived (HKDF-SHA256) from the
 * *numeric* Telegram user id plus a server secret — NOT from the stored identity
 * hash. The numeric id only ever exists in transit (bot update / login payload /
 * JWT), so the id needed to decrypt is never in the database.
 *
 * These take an explicit `secret` so they stay testable without env. The env-bound
 * wrappers live in {@link ./userDataCrypto}.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // AES-256
const IV_LENGTH = 12; // 96-bit nonce, the GCM standard
const AUTH_TAG_LENGTH = 16; // 128-bit GCM tag

/**
 * Marks a value as one of our encrypted blobs. Anything without this prefix is
 * treated as legacy plaintext and returned unchanged on decrypt — so rows written
 * before encryption was introduced keep working (new writes are always encrypted).
 */
const VERSION_PREFIX = "__v1:";

/** Fixed, non-secret domain separator for HKDF (safe to be public). */
const HKDF_SALT = "mooduck:user-data:v1";

type TCryptoParams = { telegramId: number; secret: string };

/**
 * Whether a stored value is one of our encrypted blobs (vs. legacy plaintext
 * written before encryption existed). Used to drive lazy re-encryption on read.
 */
export function isEncrypted(stored: string): boolean {
  return stored.startsWith(VERSION_PREFIX);
}

/**
 * Deterministically derive a per-user 256-bit key from the numeric telegram id
 * and the server secret. Same (id, secret) → same key; different id → different key.
 */
export function deriveUserDataKey({
  telegramId,
  secret,
}: TCryptoParams): Buffer {
  if (!secret) {
    throw new Error(
      "A non-empty encryption secret is required to derive a user data key",
    );
  }

  const info = `telegram-user:${telegramId}`;
  const key = hkdfSync("sha256", secret, HKDF_SALT, info, KEY_LENGTH);
  return Buffer.from(key);
}

/** Encrypt with an explicit secret (env-independent; used directly by tests). */
export function encryptWithSecret(
  plaintext: string,
  params: TCryptoParams,
): string {
  const key = deriveUserDataKey(params);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Layout: [iv | authTag | ciphertext], base64 with a version prefix.
  const blob = Buffer.concat([iv, authTag, ciphertext]);
  return VERSION_PREFIX + blob.toString("base64");
}

/**
 * Decrypt a value produced by {@link encryptWithSecret}. A value without the
 * version prefix is assumed to be legacy plaintext and returned as-is. A tampered
 * blob or a wrong telegram id fails the GCM auth check and throws.
 */
export function decryptWithSecret(
  stored: string,
  params: TCryptoParams,
): string {
  if (!stored.startsWith(VERSION_PREFIX)) {
    return stored; // legacy plaintext, written before encryption existed
  }

  const blob = Buffer.from(stored.slice(VERSION_PREFIX.length), "base64");
  if (blob.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Ciphertext is too short to be a valid encrypted blob");
  }

  const iv = blob.subarray(0, IV_LENGTH);
  const authTag = blob.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveUserDataKey(params);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // `.final()` throws if the auth tag doesn't match (tamper / wrong key).
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
