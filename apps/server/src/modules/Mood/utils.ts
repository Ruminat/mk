import he from "he";
import type { TLocale } from "@mooduck/core";
import { messages } from "../../common/i18n/messages";

export type TMoodScore = number;

export type TMoodStatsEntry = {
  score: TMoodScore;
  comment?: string;
  created: number;
};

export type TMoodStats = {
  scores: Record<TMoodScore, number | undefined>;
  avg: number;
  std: number;
  topEntries: (TMoodStatsEntry & { comment: string })[];
  lastCommentedEntries: TMoodStatsEntry[];
};

export function getMoodInterest({ mood, avgMood }: { mood: TMoodScore; avgMood: number }): number {
  return Math.abs(mood - avgMood);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function getMoodStatsLists(
  stats: TMoodStats,
  {
    moodMarkup = (score) => `${score}/10`,
    locale,
  }: { moodMarkup?: (score: TMoodScore) => string; locale: TLocale }
) {
  const strings = messages(locale).stat;

  const statsList = `— ${strings.avgMood}: ${round(stats.avg, 2)}
— ${strings.avgDeviation}: ${round(stats.std, 2)}`;

  const scoresList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .map((score) => `— ${moodMarkup(score)}: ${stats.scores[score] ?? 0}`)
    .join("\n");

  const topEntriesList = stats.topEntries
    .map((entry) => `— ${moodMarkup(entry.score)}: ${he.escape(entry.comment)}`)
    .join("\n");

  return { statsList, scoresList, topEntriesList };
}
