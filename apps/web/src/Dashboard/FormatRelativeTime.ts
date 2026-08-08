import type { TLocale } from "@mooduck/core";
import { webMessages } from "@/I18n/Messages";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Locale-aware "how long ago". Thresholds match the bot's `howLongAgo`
 * (`dateUtils.ts`) except for the design's "yesterday" special case at exactly
 * one day. A null/unreadable timestamp renders as "just now" — something sane
 * rather than an Invalid Date.
 */
export function formatRelativeTime(iso: string | null, locale: TLocale, now: number = Date.now()): string {
  const time = webMessages(locale).time;
  if (iso === null) {
    return time.justNow;
  }
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return time.justNow;
  }

  const diff = now - then;
  const days = Math.floor(diff / DAY);
  const hours = Math.floor(diff / HOUR);
  const minutes = Math.floor(diff / MINUTE);

  if (days >= 2) {
    return time.daysAgo(days);
  }
  if (days === 1) {
    return time.yesterday;
  }
  if (hours > 0) {
    return time.hoursAgo(hours);
  }
  if (minutes > 0) {
    return time.minutesAgo(minutes);
  }
  return time.justNow;
}
