import { getRandomInt } from "@mooduck/core";
import he from "he";
import { messages } from "../../../common/i18n/messages";
import { prompts } from "../../../common/i18n/prompts";
import { TTelegramCommandMethods } from "../definitions";
import { getTelegramUserIdHash } from "../utils";
import { moodService } from "../../Mood/service";
import { aiService } from "../../AI/service";
import { getMoodStatReply } from "../../Mood/sagas/getMoodStatReply";

export const telegramStatCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/stat";
  },

  getReply: async (props) => {
    const telegramUserIdHash = getTelegramUserIdHash(props);
    const entries = await moodService.listMoodEntries({ userId: telegramUserIdHash });

    const stats = getMoodStatReply(entries, props.locale);

    if (!stats) {
      return { text: messages(props.locale).stat.empty };
    }

    const prompt = prompts(props.locale).statPrompt({ stats, wordsLimit: getRandomInt(80, 180) });

    try {
      const reply = await aiService.getDeepSeekReply({ prompt, userIdHash: telegramUserIdHash });

      if (reply) {
        return { text: `${stats}\n\n${he.escape(reply)}` };
      }
    } catch (error) {
      console.log("AI reply failed:", error);
    }

    return { text: stats };
  },
} satisfies TTelegramCommandMethods;
