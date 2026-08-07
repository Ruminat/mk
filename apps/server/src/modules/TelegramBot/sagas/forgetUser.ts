import { aiService } from "../../AI/service";
import { authService } from "../../Auth/service";
import { moodService } from "../../Mood/service";
import { forgetTelegramLocale } from "../resolveTelegramLocale";
import { clearTelegramChatHistory } from "../telegramUserChatHistory";

export type TForgetUserResult = {
  moodEntries: number;
  chatMessages: number;
};

/**
 * Erase a person from MooDuck completely: their whole conversation (stored rows
 * and the in-memory cache), every mood entry, the user record itself, the
 * language we worked out for them, and the leftover per-user AI throttling
 * state. Everything here is keyed by the one identity hash, so afterwards
 * nothing in the app is holding that key.
 *
 * Every step is idempotent, so a run that dies halfway can simply be repeated —
 * which matters, because these are separate statements rather than one
 * transaction.
 *
 * Content goes before identity: if this fails midway, the leftover is the empty
 * user row, never orphaned mood entries or messages.
 */
export async function forgetUser({
  telegramUserIdHash,
}: {
  telegramUserIdHash: string;
}): Promise<TForgetUserResult> {
  const chatMessages = await clearTelegramChatHistory({ telegramUserIdHash });
  const moodEntries = await moodService.deleteAllMoodEntries({ userId: telegramUserIdHash });

  await authService.deleteUser({ userId: telegramUserIdHash });
  await aiService.forgetUser(telegramUserIdHash);
  forgetTelegramLocale(telegramUserIdHash);

  return { moodEntries, chatMessages };
}
