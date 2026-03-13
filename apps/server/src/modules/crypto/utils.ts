import { createHmac } from "crypto";

/**
 * HMAC-SHA256 hash of a number, truncated to `length` base64url chars.
 * @example getHashFromNumber(userId, { secret: jwtSecret })
 */
export function getHashFromNumber(
  userId: number,
  { secret = "not so secret", length = 16 }: { secret?: string; length?: number } = {}
): string {
  if (length < 0 || length > 255) {
    throw new Error("Length must be between 0 and 255");
  }

  const hmac = createHmac("sha256", secret);

  hmac.update(String(userId));

  const digest = hmac.digest("base64url");

  return digest.slice(0, length);
}
