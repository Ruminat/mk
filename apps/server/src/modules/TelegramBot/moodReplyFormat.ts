import { howLongAgo } from "../../common/dateUtils";
import { parseMoodEntryCreatedAtMs } from "../../common/moodFormat";
import type { TSelectMoodEntry } from "../Mood/model";
import { moodScoreCode } from "./utils";

export function formatTelegramMoodEntryStatBullet(
  entry: Pick<TSelectMoodEntry, "value" | "comment" | "createdAt">,
): string {
  const when = howLongAgo(Date.now() - parseMoodEntryCreatedAtMs(entry.createdAt));
  const scorePart = moodScoreCode(entry.value);

  if (entry.comment) {
    return `— ${scorePart}: ${entry.comment} (${when})`;
  }

  return `— ${scorePart}: (${when})`;
}
