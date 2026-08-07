import he from "he";
import { howLongAgo } from "../../common/date/dateUtils";
import type { TLocale } from "../../common/i18n/locale";
import type { TSelectMoodEntry } from "../Mood/model";
import { moodScoreCode } from "./utils";

export function formatTelegramMoodEntryStatBullet(
  entry: Pick<TSelectMoodEntry, "value" | "comment" | "createdAt">,
  locale: TLocale,
): string {
  // An entry with no readable timestamp reads as "just now" — better than hiding it.
  const when = howLongAgo(Date.now() - (entry.createdAt?.getTime() ?? Date.now()), locale);
  const scorePart = moodScoreCode(entry.value);

  if (entry.comment) {
    return `— ${scorePart}: ${he.escape(entry.comment)} (${when})`;
  }

  return `— ${scorePart}: (${when})`;
}
