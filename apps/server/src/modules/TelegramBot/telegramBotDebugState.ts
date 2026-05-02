let debugEnabled = false;

export function toggleTelegramBotDebug(): boolean {
  debugEnabled = !debugEnabled;
  return debugEnabled;
}

export function isTelegramBotDebugEnabled(): boolean {
  return debugEnabled;
}
