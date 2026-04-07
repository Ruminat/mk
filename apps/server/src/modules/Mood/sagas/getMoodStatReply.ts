import { code } from "../../TelegramBot/utils";
import { getMoodStats } from "./getMoodStats";
import { getMoodStatsLists } from "../utils";

function padStart(str: string, length: number, pad: string): string {
  return str.padStart(length, pad);
}

export function getMoodStatReply(entries: Parameters<typeof getMoodStats>[0]["entries"]) {
  const stats = getMoodStats({ entries });

  if (!stats) {
    return undefined;
  }

  const { statsList, scoresList, topEntriesList } = getMoodStatsLists(stats, {
    moodMarkup: (score) => code(`${padStart(String(score), 2, " ")}/10`),
  });

  const topEntriesMarkup =
    stats.topEntries.length > 0 ? `\n\n${b("Топ интересных комментариев")}\n\n${topEntriesList}` : "";

  const statsMarkup = `${b("Вот твоя статистика")}

${statsList}

${b("Оценки")}

${scoresList}${topEntriesMarkup}`;

  return statsMarkup;
}

function b(content: string): string {
  return `<b>${content}</b>`;
}
