import type { TLocale } from "@mooduck/core";
import { messages } from "../i18n/messages";

export function howLongAgo(ms: number, locale: TLocale): string {
  const time = messages(locale).time;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return time.daysAgo(days);
  if (hours > 0) return time.hoursAgo(hours);
  if (minutes > 0) return time.minutesAgo(minutes);
  return time.justNow;
}
