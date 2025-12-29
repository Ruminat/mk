import TelegramBot from "node-telegram-bot-api";
import { logInfo } from "../common/logging";
import { withProbability } from "../common/random/utils";
import { sentence } from "../models/SentenceBuilder";
import { Interjection } from "../models/SentenceBuilder/interjections";
import { telegramMoodEntry } from "./commands/addMoodEntry";
import { telegramErrorCommand } from "./commands/error";
import { telegramHelpCommand } from "./commands/help";
import { telegramSettingsCommand } from "./commands/settings";
import { telegramStartCommand } from "./commands/start";
import { telegramStatCommand } from "./commands/stat";
import { getErrorSticker, getUnknownSticker } from "./stickers/presets";

const MAX_SYMBOLS = 1024;
const MAX_SYMBOLS_COUNT = `${MAX_SYMBOLS} символа`;

const getReply: TTelegramGetReplyFn = (props) => {
  if (telegramStartCommand.test(props)) {
    return telegramStartCommand.getReply();
  }

  if (telegramHelpCommand.test(props)) {
    return telegramHelpCommand.getReply();
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

  const text = sentence`Не пон... ${Interjection.neutral} Напиши /help, чтобы почитать, как мной пользоваться`;
  const sticker = withProbability(0.3, () => getUnknownSticker());

  return sticker ? [{ sticker }, { text }] : { text };
};

export function telegramOnMessage(bot: TelegramBot): void {
  bot.on("message", async (message, metadata) => {
    const { from, chat } = message;

    const chatId = chat.id;
    const fromPart = from ? `@${from.username} (${from.first_name} ${from.last_name}):` : `Unknown fool:`;
    const messageParsed = message.text ? message.text.toLowerCase().replace(/ё/g, "е") : message.text;

    const commandProps = {
      metadata,
      chatId,
      message,
      fromPart,
      messageParsed,
    } satisfies TTelegramCommandProps;

    try {
      if (!message.text) {
        console.log("\nReceived message without text, ignoring...", message.sticker?.file_id, "\n");
        throw new TelegramInputError("Не знаю, что делать с таким сообщением...");
      }

      if (message.text.length >= MAX_SYMBOLS) {
        throw new TelegramInputError(`Не могу обрабатывать больше, чем ${MAX_SYMBOLS_COUNT}`);
      }

      logInfo(`${fromPart} ${message.text}`);

      bot.sendChatAction(chatId, "typing");

      const reply = await getReply(commandProps);

      logInfo(`@MooDuck: ${reply}\n`);

      telegramSendReply(bot, commandProps, reply);
    } catch (error) {
      if (error instanceof TelegramInputError) {
        telegramSendReply(bot, commandProps, { text: error.message });
      } else {
        console.log("Oopsie!...", error);

        telegramSendReply(bot, commandProps, [
          { sticker: getErrorSticker() },
          { text: sentence`${Interjection.negative} Какая-то ошибка! Попробуй написать попозже...` },
        ]);
      }
    }
  });

  console.log(`\n << MooDuck is listening >> \n`);
}
