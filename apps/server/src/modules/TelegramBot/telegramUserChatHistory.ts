import { createTelegramChatHistory, type TTelegramChatHistoryEntry } from "./telegramChatHistory";
import { telegramChatHistoryDbStore } from "./telegramChatHistoryStore";

export type { TTelegramChatHistoryEntry } from "./telegramChatHistory";

/** The app-wide chat history: an in-memory LRU cache backed by the durable DB store. */
const defaultHistory = createTelegramChatHistory({ store: telegramChatHistoryDbStore });

export function appendTelegramChatMessage(
  telegramUserIdHash: string,
  entry: TTelegramChatHistoryEntry,
): Promise<void> {
  return defaultHistory.append(telegramUserIdHash, entry);
}

export function getRecentTelegramChatMessages(
  telegramUserIdHash: string,
): Promise<readonly TTelegramChatHistoryEntry[]> {
  return defaultHistory.getRecent(telegramUserIdHash);
}
