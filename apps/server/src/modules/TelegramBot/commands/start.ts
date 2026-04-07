import { TTelegramCommandMethods } from "../definitions";
import { Sticker } from "../stickers";

export const telegramStartCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/start";
  },

  getReply: () => {
    return { sticker: Sticker.YellowBoi.hey };
  },
} satisfies TTelegramCommandMethods;
