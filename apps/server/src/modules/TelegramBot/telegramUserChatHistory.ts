import { decryptUserData, encryptUserData } from "../crypto/userDataCrypto";
import { createTelegramChatHistory, type TTelegramChatHistoryEntry } from "./telegramChatHistory";
import { telegramChatHistoryDbStore } from "./telegramChatHistoryStore";

export type { TTelegramChatHistoryEntry } from "./telegramChatHistory";

/** The app-wide chat history: an in-memory LRU cache backed by the durable DB store. */
const defaultHistory = createTelegramChatHistory({ store: telegramChatHistoryDbStore });

type TAppendArgs = {
  /** The user's identity key (getTelegramUserIdSecureHash) — what history is stored under. */
  telegramUserIdHash: string;
  /** The raw numeric telegram id — used to derive the per-user encryption key. */
  telegramId: number;
  entry: TTelegramChatHistoryEntry;
};

type TGetRecentArgs = {
  telegramUserIdHash: string;
  telegramId: number;
};

/**
 * Message text is encrypted here, at the boundary, so it's ciphertext both in the
 * durable store AND in the in-memory cache — the underlying history stays a plain
 * content-agnostic string store. The key is derived from the numeric `telegramId`
 * (never persisted), so callers must supply it.
 */
export function appendTelegramChatMessage({
  telegramUserIdHash,
  telegramId,
  entry,
}: TAppendArgs): Promise<void> {
  return defaultHistory.append(telegramUserIdHash, {
    role: entry.role,
    text: encryptUserData(entry.text, telegramId),
  });
}

export async function getRecentTelegramChatMessages({
  telegramUserIdHash,
  telegramId,
}: TGetRecentArgs): Promise<readonly TTelegramChatHistoryEntry[]> {
  const entries = await defaultHistory.getRecent(telegramUserIdHash);
  return entries.map((entry) => ({
    role: entry.role,
    text: decryptUserData(entry.text, telegramId),
  }));
}
