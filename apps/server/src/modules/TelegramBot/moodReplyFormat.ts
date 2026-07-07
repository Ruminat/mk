import he from "he";
import { howLongAgo } from "../../common/date/dateUtils";
import type { TLocale } from "../../common/i18n/locale";
import { parseMoodEntryCreatedAtMs } from "../../common/mood/moodFormat";
import type { TSelectMoodEntry } from "../Mood/model";
import { moodScoreCode } from "./utils";

export function formatTelegramMoodEntryStatBullet(
  entry: Pick<TSelectMoodEntry, "value" | "comment" | "createdAt">,
  locale: TLocale,
): string {
  const when = howLongAgo(Date.now() - parseMoodEntryCreatedAtMs(entry.createdAt), locale);
  const scorePart = moodScoreCode(entry.value);

  if (entry.comment) {
    return `— ${scorePart}: ${he.escape(entry.comment)} (${when})`;
  }

  return `— ${scorePart}: (${when})`;
}
