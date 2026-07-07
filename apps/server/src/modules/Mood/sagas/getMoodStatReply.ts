import type { TLocale } from "../../../common/i18n/locale";
import { messages } from "../../../common/i18n/messages";
import { moodScoreCode } from "../../TelegramBot/utils";
import { getMoodStats } from "./getMoodStats";
import { getMoodStatsLists } from "../utils";

export function getMoodStatReply(entries: Parameters<typeof getMoodStats>[0]["entries"], locale: TLocale) {
  const stats = getMoodStats({ entries });

  if (!stats) {
    return undefined;
  }

  const strings = messages(locale).stat;
  const { statsList, scoresList, topEntriesList } = getMoodStatsLists(stats, {
    moodMarkup: moodScoreCode,
    locale,
  });

  const topEntriesMarkup =
    stats.topEntries.length > 0 ? `\n\n${b(strings.topComments)}\n\n${topEntriesList}` : "";

  const statsMarkup = `${b(strings.title)}

${statsList}

${b(strings.scores)}

${scoresList}${topEntriesMarkup}`;

  return statsMarkup;
}

function b(content: string): string {
  return `<b>${content}</b>`;
}
