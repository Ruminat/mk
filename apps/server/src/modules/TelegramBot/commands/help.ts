import { messages } from "../../../common/i18n/messages";
import { TTelegramCommandMethods } from "../definitions";

export const telegramHelpCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/help";
  },

  getReply: (props) => {
    return { text: messages(props.locale).bot.help };
  },
} satisfies TTelegramCommandMethods;
