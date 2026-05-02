const MAX_CHAT_MESSAGES = 10;

export type TTelegramChatHistoryEntry = {
  role: "user" | "assistant";
  text: string;
};

const messagesByTelegramUserIdHash = new Map<string, TTelegramChatHistoryEntry[]>();

export function appendTelegramChatMessage(telegramUserIdHash: string, entry: TTelegramChatHistoryEntry): void {
  const existing = messagesByTelegramUserIdHash.get(telegramUserIdHash) ?? [];
  existing.push(entry);
  if (existing.length > MAX_CHAT_MESSAGES) {
    existing.splice(0, existing.length - MAX_CHAT_MESSAGES);
  }
  messagesByTelegramUserIdHash.set(telegramUserIdHash, existing);
}

export function getRecentTelegramChatMessages(telegramUserIdHash: string): readonly TTelegramChatHistoryEntry[] {
  return messagesByTelegramUserIdHash.get(telegramUserIdHash) ?? [];
}
