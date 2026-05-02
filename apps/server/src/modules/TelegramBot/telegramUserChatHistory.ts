const MAX_USER_MESSAGES = 10;

const messagesByTelegramUserIdHash = new Map<string, string[]>();

export function recordTelegramUserChatMessage(telegramUserIdHash: string, text: string): void {
  const existing = messagesByTelegramUserIdHash.get(telegramUserIdHash) ?? [];
  existing.push(text);
  if (existing.length > MAX_USER_MESSAGES) {
    existing.splice(0, existing.length - MAX_USER_MESSAGES);
  }
  messagesByTelegramUserIdHash.set(telegramUserIdHash, existing);
}

export function getRecentTelegramUserChatMessages(telegramUserIdHash: string): readonly string[] {
  return messagesByTelegramUserIdHash.get(telegramUserIdHash) ?? [];
}
