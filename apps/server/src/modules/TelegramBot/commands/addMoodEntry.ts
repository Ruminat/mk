import { notEmpty, randomFrom, stringToNumberOrUndefined } from "@mooduck/core";
import he from "he";
import { messages } from "../../../common/i18n/messages";
import { TelegramInputError, TTelegramCommandMethods, TTelegramReply } from "../definitions";
import { formatTelegramAiReplyText } from "../formatTelegramAiReplyText";
import { appendTelegramChatMessage } from "../telegramUserChatHistory";
import { getTelegramUserId, getTelegramUserIdHash } from "../utils";
import { moodService } from "../../Mood/service";
import { aiService } from "../../AI/service";
import { getPromptByMood } from "../../Mood/prompts/getPromptByMood";

export const telegramMoodEntry = {
  test: ({ messageParsed, locale }) => {
    if (!messageParsed) return false;

    if (!/^([1-9]|10)( .+)?$/.test(messageParsed)) {
      return false;
    }

    const matched = messageParsed.match(/^\d{1,2}/);
    if (!matched || matched.length !== 1) {
      throw new Error("invalid start number");
    }

    const [scoreString] = matched;

    const score = getValidMoodScoreOrUndefined(scoreString);
    if (notEmpty(score)) {
      return true;
    } else {
      throw new TelegramInputError(messages(locale).bot.moodOutOfRange);
    }
  },

  getReply: async (props): Promise<TTelegramReply> => {
    const message = props.message.text;
    if (!message) throw new Error("Empty message");

    const [scoreString, ...rest] = message.split(" ");
    const comment = rest && rest.length > 0 ? rest.join(" ") : undefined;
    const score = getValidMoodScoreOrUndefined(scoreString);

    if (!notEmpty(score)) {
      throw new TelegramInputError(messages(props.locale).bot.moodOutOfRange);
    }

    const telegramId = getTelegramUserId(props);
    const telegramUserIdHash = getTelegramUserIdHash(props);
    await moodService.addMoodEntry({
      value: score,
      comment,
      telegramUserIdHash,
      telegramId,
    });

    await appendTelegramChatMessage({
      telegramUserIdHash,
      telegramId,
      entry: { role: "user", text: message },
    });

    const bot = messages(props.locale).bot;
    const boring = `(${score}${comment ? ` + "${he.escape(comment)}"` : ""})`;
    const defaultResults: TTelegramReply[] = [
      { text: bot.moodAckShort(boring) },
      { text: bot.moodAckLong(boring) },
    ];
    let result: TTelegramReply = randomFrom(defaultResults);

    try {
      const entries = await moodService.listMoodEntries({ userId: telegramUserIdHash, telegramId });
      const prompt = getPromptByMood({ entries, score, comment, locale: props.locale });
      const reply = await aiService.getDeepSeekReply({ prompt, userIdHash: telegramUserIdHash });

      if (reply) {
        result = {
          text: formatTelegramAiReplyText({
            prompt,
            reply,
            username: props.message.from?.username,
            locale: props.locale,
          }),
        };
        await appendTelegramChatMessage({
          telegramUserIdHash,
          telegramId,
          entry: { role: "assistant", text: reply },
        });
      }
    } catch (error) {
      console.log("AI reply failed:", error);
    }

    return result;
  },
} satisfies TTelegramCommandMethods;

function getValidMoodScoreOrUndefined(scoreString: string | undefined) {
  if (!scoreString) return undefined;

  const score = stringToNumberOrUndefined(scoreString);

  return notEmpty(score) && score >= 1 && score <= 10 ? score : undefined;
}
