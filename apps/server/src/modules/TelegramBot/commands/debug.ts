import { TTelegramCommandMethods } from "../definitions";
import { isAdminTelegramLogin } from "../isAdminTelegramLogin";
import { toggleTelegramBotDebug } from "../telegramBotDebugState";

export const telegramDebugCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/debug";
  },

  getReply: (props) => {
    if (!isAdminTelegramLogin(props.message.from?.username)) {
      return { text: "Эта команда только для администраторов." };
    }

    const enabled = toggleTelegramBotDebug();
    return { text: enabled ? "Debug: включён" : "Debug: выключен" };
  },
} satisfies TTelegramCommandMethods;
