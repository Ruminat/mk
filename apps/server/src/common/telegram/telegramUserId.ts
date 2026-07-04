import { getHashFromNumber } from "../../modules/crypto/utils";
import { getEnvironmentVariables } from "../config/environment";

/**
 * Single source of truth for a user's identity across the whole server.
 *
 * Both the Telegram bot and the web/API store and look up mood entries by this
 * hash, so a person is the same user no matter how they interact with MooDuck.
 */
export function getTelegramUserIdSecureHash(userId: number): string {
  const secret = getEnvironmentVariables().telegramBot.telegramUserIdSecureHash;

  if (!secret) {
    throw new Error("TELEGRAM_USER_ID_SECURE_HASH is not set");
  }

  return getHashFromNumber(userId, { secret });
}
