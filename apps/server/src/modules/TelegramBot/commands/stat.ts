import { getRandomInt } from "@mooduck/core";
import { TTelegramCommandMethods } from "../definitions";
import { getTelegramUserIdHash } from "../utils";
import { moodService } from "../../Mood/service";
import { aiService } from "../../AI/service";
import { getMoodStatReply } from "../../Mood/sagas/getMoodStatReply";
import { MoodPromptCommon } from "../../Mood/prompts/definitions";
import { pickRandomPromptMode } from "../../Mood/prompts/mode";

export const telegramStatCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/stat";
  },

  getReply: async (props) => {
    const telegramUserIdHash = getTelegramUserIdHash(props);
    const entries = await moodService.listMoodEntries({ userId: telegramUserIdHash });

    const stats = getMoodStatReply(entries);

    if (!stats) {
      return {
        text: "Пока нет никаких записей... Не могу выдать никакой статистики без них. Напиши /help для того, чтобы посмотреть, как мной пользоваться",
      };
    }

    const prompt = `${MoodPromptCommon.promptRole}

Нужно прокомментировать статистику пользователя.
${pickRandomPromptMode()}
Предоставь только ответ пользователю и больше ничего.
${MoodPromptCommon.banPhrases}
${MoodPromptCommon.wordsLimit(getRandomInt(300, 500))}

${stats}`;

    try {
      const reply = await aiService.getDeepSeekReply({ prompt });

      if (reply) {
        return { text: `${stats}\n\n${reply}` };
      }
    } catch (error) {
      console.log("AI reply failed:", error);
    }

    return { text: stats };
  },
} satisfies TTelegramCommandMethods;
