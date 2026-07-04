import { TTelegramCommandMethods } from "../definitions";
import { isAdminLogin } from "../../../common/telegram/isAdminLogin";
import { toggleTelegramBotDebug } from "../telegramBotDebugState";

export const telegramDebugCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/debug";
  },

  getReply: (props) => {
    if (!isAdminLogin(props.message.from?.username)) {
      return { text: "Эта команда только для администраторов." };
    }

    const enabled = toggleTelegramBotDebug();
    return { text: enabled ? "Debug: включён" : "Debug: выключен" };
  },
} satisfies TTelegramCommandMethods;
