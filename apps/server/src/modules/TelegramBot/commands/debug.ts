import { messages } from "../../../common/i18n/messages";
import { isAdminLogin } from "../../../common/telegram/isAdminLogin";
import { TTelegramCommandMethods } from "../definitions";
import { toggleTelegramBotDebug } from "../telegramBotDebugState";

export const telegramDebugCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/debug";
  },

  getReply: (props) => {
    const strings = messages(props.locale).debug;

    if (!isAdminLogin(props.message.from?.username)) {
      return { text: strings.adminOnly };
    }

    const enabled = toggleTelegramBotDebug();
    return { text: enabled ? strings.on : strings.off };
  },
} satisfies TTelegramCommandMethods;
