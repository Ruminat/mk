import { howLongAgo } from "../../../common/dateUtils";
import { TSelectMoodEntry } from "../model";
import { getMoodStats } from "./getMoodStats";

export function getLastMoodCommentsForPrompt(entries: TSelectMoodEntry[]): string | undefined {
  const stats = getMoodStats({ entries, lastCommentedEntries: 5 });

  if (!stats) {
    return undefined;
  }

  const lastEntries = stats.lastCommentedEntries;

  if (lastEntries.length === 0) {
    return undefined;
  }

  return `Недавние комментарии пользователя. Прими их к сведению, но не упоминай их. Можешь обыграть интересные комментарии, но только если это будет в тему:

${lastEntries
  .map((entry) => `- ${entry.score}/10: ${entry.comment!} (${howLongAgo(Date.now() - entry.created)})`)
  .join("\n")}`;
}
