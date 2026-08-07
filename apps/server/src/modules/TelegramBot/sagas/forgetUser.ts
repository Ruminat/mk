import { aiService } from "../../AI/service";
import { moodService } from "../../Mood/service";
import { forgetTelegramLocale } from "../resolveTelegramLocale";
import { clearTelegramChatHistory } from "../telegramUserChatHistory";

export type TForgetUserResult = {
  moodEntries: number;
  chatMessages: number;
};

/**
 * Erase a person from MooDuck completely: their whole conversation (stored rows
 * and the in-memory cache), every mood entry, the language we worked out for
 * them, and the leftover per-user AI throttling state. Everything the app keeps
 * is keyed by the one identity hash, so afterwards nothing is holding that key.
 *
 * Every step is idempotent, so a run that dies halfway can simply be repeated —
 * which matters, because these are separate statements rather than one
 * transaction.
 */
export async function forgetUser({
  telegramUserIdHash,
}: {
  telegramUserIdHash: string;
}): Promise<TForgetUserResult> {
  const chatMessages = await clearTelegramChatHistory({ telegramUserIdHash });
  const moodEntries = await moodService.deleteAllMoodEntries({ userId: telegramUserIdHash });

  await aiService.forgetUser(telegramUserIdHash);
  forgetTelegramLocale(telegramUserIdHash);

  return { moodEntries, chatMessages };
}
