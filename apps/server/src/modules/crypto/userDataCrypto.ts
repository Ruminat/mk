import { getEnvironmentVariables } from "../../common/config/environment";
import { decryptWithSecret, encryptWithSecret } from "./userDataCryptoCore";

/**
 * Env-bound wrappers around the pure crypto core ({@link ./userDataCryptoCore}).
 * The encryption secret is separate from the identity-hash secret and required at
 * startup (see environment.ts). Rotating it makes existing ciphertext
 * undecryptable — treat it as permanent.
 */

function getEncryptionSecret(): string {
  const secret = getEnvironmentVariables().crypto.userDataEncryptionSecret;
  if (!secret) {
    throw new Error("TELEGRAM_USER_DATA_ENCRYPTION_SECRET is not set");
  }
  return secret;
}

/** Encrypt user text for storage, keyed by the numeric telegram id. */
export function encryptUserData(plaintext: string, telegramId: number): string {
  return encryptWithSecret(plaintext, { telegramId, secret: getEncryptionSecret() });
}

/** Decrypt stored user text, keyed by the numeric telegram id. */
export function decryptUserData(stored: string, telegramId: number): string {
  return decryptWithSecret(stored, { telegramId, secret: getEncryptionSecret() });
}
