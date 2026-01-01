import { TTelegramCommandMethods } from "../definitions";

export const telegramErrorCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/error";
  },

  getReply: () => {
    throw new Error("This is an error command, it should not be called directly.");
  },
} satisfies TTelegramCommandMethods;
