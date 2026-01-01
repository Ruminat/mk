import { TTelegramCommandMethods } from "../definitions";
import { code } from "../utils";

const helpMessage = `Просто пиши мне настроение в формате:
${code("1-10 комментарий")}
и я запомню его. Например:
${code("4 болит живот")}
или:
${code("8 навернул пельменей")}
либо же можно просто без комментария:
${code("7")}

Доступные команды:
- /start — начать работу со мной,
- /stat — получить статистику по своим записям,
- /settings — мои настройки,
- /help — получить это сообщение`;

export const telegramHelpCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/help";
  },

  getReply: () => {
    return { text: helpMessage };
  },
} satisfies TTelegramCommandMethods;
