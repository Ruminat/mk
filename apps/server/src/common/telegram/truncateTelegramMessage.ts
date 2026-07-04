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
  return `${stripDanglingHtmlEntity(text.slice(0, budget))}${suffix}`;
}

/**
 * A slice may land in the middle of an escaped entity like `&lt;` or `&#x27;`,
 * leaving a bare `&` tail that would break Telegram's HTML parser — the very
 * failure the escaping is meant to prevent. Drop any incomplete trailing entity
 * (a `&` followed only by entity chars, with no closing `;`). Complete entities
 * end in `;` and are left untouched.
 */
function stripDanglingHtmlEntity(text: string): string {
  return text.replace(/&[a-z0-9#]*$/i, "");
}
