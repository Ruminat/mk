import { TTelegramCommandMethods } from "../definitions";
import { formatTelegramMoodEntryStatBullet } from "../moodReplyFormat";
import { getTelegramUserIdHash } from "../utils";
import { moodService } from "../../Mood/service";
import { aiService } from "../../AI/service";
import { MoodPromptCommon } from "../../Mood/prompts/definitions";
import { pickRandomPromptMode } from "../../Mood/prompts/mode";
import type { TSelectMoodEntry } from "../../Mood/model";

const LAST_LIMIT = 10;
const AI_WORDS_MAX = 35;

function formatEntriesBlock(entries: TSelectMoodEntry[]): string {
  return entries.map((entry) => formatTelegramMoodEntryStatBullet(entry)).join("\n");
}

export const telegramLastCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/last";
  },

  getReply: async (props) => {
    const telegramUserIdHash = getTelegramUserIdHash(props);
    const entries = await moodService.listMoodEntries({ userId: telegramUserIdHash, limit: LAST_LIMIT });

    if (entries.length === 0) {
      return {
        text: "Пока нет записей. Напиши настроение вроде «7 отличный день» или открой /help.",
      };
    }

    const block = formatEntriesBlock(entries);

    const prompt = `${MoodPromptCommon.promptRole}

Последние записи пользователя (от новых к старым):
${block}

Напиши одно короткое замечание (1–2 предложения) о том, как выглядит эта полоска настроения — без советов и без перечисления записей.
${pickRandomPromptMode()}
${MoodPromptCommon.banPhrases}
${MoodPromptCommon.wordsLimit(AI_WORDS_MAX)}`;

    try {
      const reply = await aiService.getDeepSeekReply({ prompt, userIdHash: telegramUserIdHash });

      if (reply) {
        return { text: `${block}\n\n${reply.trim()}` };
      }
    } catch (error) {
      console.log("AI reply failed:", error);
    }

    return { text: block };
  },
} satisfies TTelegramCommandMethods;
