/** Telegram `sendMessage` text length limit (UTF-16 code units, same as `.length` in JS for BMP-heavy text). */
export const TELEGRAM_MESSAGE_MAX_CHARS = 4096;

const DEFAULT_TRUNCATION_SUFFIX = "\n\n… (обрезано)";

type TOptions = {
  maxChars?: number;
  suffix?: string;
};

export function truncateTelegramMessage(text: string, options?: TOptions): string {
  const maxChars = options?.maxChars ?? TELEGRAM_MESSAGE_MAX_CHARS;
  const suffix = options?.suffix ?? DEFAULT_TRUNCATION_SUFFIX;

  if (text.length <= maxChars) {
    return text;
  }

  const budget = Math.max(0, maxChars - suffix.length);
  return `${text.slice(0, budget)}${suffix}`;
}
