import he from "he";
import { howLongAgo } from "../../common/date/dateUtils";
import { parseMoodEntryCreatedAtMs } from "../../common/mood/moodFormat";
import type { TSelectMoodEntry } from "../Mood/model";
import { moodScoreCode } from "./utils";

export function formatTelegramMoodEntryStatBullet(
  entry: Pick<TSelectMoodEntry, "value" | "comment" | "createdAt">,
): string {
  const when = howLongAgo(Date.now() - parseMoodEntryCreatedAtMs(entry.createdAt));
  const scorePart = moodScoreCode(entry.value);

  if (entry.comment) {
    return `— ${scorePart}: ${he.escape(entry.comment)} (${when})`;
  }

  return `— ${scorePart}: (${when})`;
}
