import TelegramBot, { Chat } from "node-telegram-bot-api";

export class TelegramInputError extends Error {}

export type TTelegramCommandProps = {
  metadata: TelegramBot.Metadata;
  chatId: Chat["id"];
  message: TelegramBot.Message;
  fromPart: string;
  messageParsed: string | undefined;
};

export type TTelegramReplySingle =
  | { text: string; options?: TelegramBot.SendMessageOptions }
  | { sticker: string; options?: TelegramBot.SendStickerOptions };
export type TTelegramReply = TTelegramReplySingle | TTelegramReplySingle[];
export type TTelegramGetReplyFn = (props: TTelegramCommandProps) => TTelegramReply | Promise<TTelegramReply>;

export type TTelegramCommandMethods = {
  test: (props: TTelegramCommandProps) => boolean;
  getReply: TTelegramGetReplyFn;
};

export type TTelegramCommand = "/start" | "/stat" | "/settings" | "/help";
