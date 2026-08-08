import he from "he";
import type { TLocale } from "@mooduck/core";
import { messages } from "../../../common/i18n/messages";
import { prompts } from "../../../common/i18n/prompts";
import { TTelegramCommandMethods } from "../definitions";
import { formatTelegramMoodEntryStatBullet } from "../moodReplyFormat";
import { moodService } from "../../Mood/service";
import { aiService } from "../../AI/service";
import type { TSelectMoodEntry } from "../../Mood/model";

const LAST_LIMIT = 10;
const AI_WORDS_MAX = 35;

function formatEntriesBlock(entries: TSelectMoodEntry[], locale: TLocale): string {
  return entries.map((entry) => formatTelegramMoodEntryStatBullet(entry, locale)).join("\n");
}

export const telegramLastCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/last";
  },

  getReply: async (props) => {
    const { telegramUserIdHash } = props;
    const entries = await moodService.listMoodEntries({
      userId: telegramUserIdHash,
      telegramId: props.telegramId,
      limit: LAST_LIMIT,
    });

    if (entries.length === 0) {
      return { text: messages(props.locale).last.empty };
    }

    const block = formatEntriesBlock(entries, props.locale);
    const prompt = prompts(props.locale).lastPrompt({ block, wordsLimit: AI_WORDS_MAX });

    try {
      const reply = await aiService.getDeepSeekReply({ prompt, userIdHash: telegramUserIdHash });

      if (reply) {
        return { text: `${block}\n\n${he.escape(reply.trim())}` };
      }
    } catch (error) {
      console.log("AI reply failed:", error);
    }

    return { text: block };
  },
} satisfies TTelegramCommandMethods;
