import { howLongAgo } from "../../../common/date/dateUtils";
import type { TLocale } from "@mooduck/core";
import { prompts } from "../../../common/i18n/prompts";
import { formatPaddedMoodScoreDenominator } from "../../../common/mood/moodFormat";
import { TSelectMoodEntry } from "../model";
import { getMoodStats } from "./getMoodStats";

export function getLastMoodCommentsForPrompt(
  entries: TSelectMoodEntry[],
  locale: TLocale,
): string | undefined {
  const stats = getMoodStats({ entries, lastCommentedEntries: 5 });

  if (!stats) {
    return undefined;
  }

  const lastEntries = stats.lastCommentedEntries;

  if (lastEntries.length === 0) {
    return undefined;
  }

  const renderedEntries = lastEntries
    .map(
      (entry) =>
        `- ${formatPaddedMoodScoreDenominator(entry.score)}: ${entry.comment!} (${howLongAgo(Date.now() - entry.created, locale)})`,
    )
    .join("\n");

  return prompts(locale).recentComments(renderedEntries);
}
