import TelegramBot from "node-telegram-bot-api";
import { messages } from "../../../common/i18n/messages";
import { getTelegramUserIdSecureHash } from "../../../common/telegram/telegramUserId";
import { aiService, AiRateLimitError } from "../../AI/service";
import { telegramMoodEntry } from "../commands/addMoodEntry";
import { telegramDebugCommand } from "../commands/debug";
import { telegramErrorCommand } from "../commands/error";
import { telegramForgetMeCommand } from "../commands/forgetMe";
import { telegramHelpCommand } from "../commands/help";
import { telegramLastCommand } from "../commands/last";
import { telegramStartCommand } from "../commands/start";
import { telegramStatCommand } from "../commands/stat";
import {
  TelegramInputError,
  type TTelegramCommandProps,
  type TTelegramGetReplyFn,
} from "../definitions";
import { forgetMeConfirmations } from "../forgetMeConfirmations";
import { logTelegram } from "../logging/utils";
import { formatTelegramAiReplyText } from "../formatTelegramAiReplyText";
import { getPromptForTelegramChat } from "../prompts/getPromptForTelegramChat";
import { resolveTelegramLocale } from "../resolveTelegramLocale";
import { getErrorSticker, getUnknownSticker } from "../stickers/presets";
import {
  appendTelegramChatMessage,
  getRecentTelegramChatMessages,
} from "../telegramUserChatHistory";
import { telegramSendReply } from "../utils";

const MAX_SYMBOLS = 1024;

const getReply: TTelegramGetReplyFn = async (props) => {
  // First, ahead of everything else: a pending "forget me" confirmation has to be
  // the very next thing the user sends, so nothing can slip in and keep it armed.
  if (telegramForgetMeCommand.test(props)) {
    return telegramForgetMeCommand.getReply(props);
  }
  forgetMeConfirmations.clear(props.telegramUserIdHash);

  if (telegramStartCommand.test(props)) {
    return telegramStartCommand.getReply();
  }

  if (telegramHelpCommand.test(props)) {
    return telegramHelpCommand.getReply(props);
  }

  if (telegramDebugCommand.test(props)) {
    return telegramDebugCommand.getReply(props);
  }

  if (telegramLastCommand.test(props)) {
    return telegramLastCommand.getReply(props);
  }

  if (telegramMoodEntry.test(props)) {
    return telegramMoodEntry.getReply(props);
  }

  if (telegramStatCommand.test(props)) {
    return telegramStatCommand.getReply(props);
  }

  if (telegramErrorCommand.test(props)) {
    return telegramErrorCommand.getReply();
  }

  const userText = props.message.text;
  if (!userText) {
    throw new Error("Empty message text");
  }

  const { telegramId, telegramUserIdHash } = props;
  await appendTelegramChatMessage({
    telegramUserIdHash,
    telegramId,
    entry: { role: "user", text: userText },
  });
  const recentMessages = await getRecentTelegramChatMessages({ telegramUserIdHash, telegramId });
  const prompt = getPromptForTelegramChat({ recentMessages, locale: props.locale });

  try {
    const aiReply = await aiService.getDeepSeekReply({
      prompt,
      userIdHash: telegramUserIdHash,
    });
    if (aiReply) {
      await appendTelegramChatMessage({
        telegramUserIdHash,
        telegramId,
        entry: { role: "assistant", text: aiReply },
      });
      return {
        text: formatTelegramAiReplyText({
          prompt,
          reply: aiReply,
          username: props.message.from?.username,
          locale: props.locale,
        }),
      };
    }
  } catch (error) {
    if (error instanceof AiRateLimitError) {
      return { text: messages(props.locale).bot.rateLimited };
    }
    console.log("AI chat reply failed:", error);
  }

  const text = messages(props.locale).bot.helpHint;
  const sticker = Math.random() < 0.3 ? getUnknownSticker() : undefined;

  return sticker ? [{ sticker }, { text }] : { text };
};

export function telegramOnMessage(bot: TelegramBot): void {
  bot.on("message", async (message, metadata) => {
    const { from, chat } = message;

    if (!from) {
      console.log("\nReceived message without from, ignoring...");
      return;
    }

    const chatId = chat.id;
    const fromPart = `@${from.username} (${from.first_name} ${from.last_name}):`;
    const messageParsed = message.text
      ? message.text.toLowerCase().replace(/ё/g, "е").trim()
      : message.text;
    const telegramId = from.id;
    const telegramUserIdHash = getTelegramUserIdSecureHash(telegramId);
    const locale = await resolveTelegramLocale({
      languageCode: from.language_code,
      text: message.text,
      telegramId,
      telegramUserIdHash,
    });

    const commandProps = {
      metadata,
      chatId,
      message,
      fromPart,
      messageParsed,
      locale,
      telegramId,
      telegramUserIdHash,
    } satisfies TTelegramCommandProps;

    try {
      if (!message.text) {
        console.log(
          "\nReceived message without text, ignoring...",
          message.sticker?.file_id,
          "\n",
        );
        throw new TelegramInputError(messages(locale).bot.unknownMessage);
      }

      if (message.text.length >= MAX_SYMBOLS) {
        throw new TelegramInputError(messages(locale).bot.tooLong(MAX_SYMBOLS));
      }

      logTelegram(`${fromPart} ${message.text}`);

      bot.sendChatAction(chatId, "typing");

      const reply = await getReply(commandProps);

      logTelegram(`@MooDuck:`, reply);

      telegramSendReply(bot, commandProps, reply);
    } catch (error) {
      if (error instanceof TelegramInputError) {
        telegramSendReply(bot, commandProps, { text: error.message });
      } else {
        console.log("Oopsie!...", error);

        telegramSendReply(bot, commandProps, [
          { sticker: getErrorSticker() },
          { text: messages(locale).bot.genericError },
        ]);
      }
    }
  });
}
