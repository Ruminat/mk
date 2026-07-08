import TelegramBot, { Chat } from "node-telegram-bot-api";
import type { TLocale } from "../../common/i18n/locale";

export class TelegramInputError extends Error {}

export type TTelegramCommandProps = {
  metadata: TelegramBot.Metadata;
  chatId: Chat["id"];
  message: TelegramBot.Message;
  fromPart: string;
  messageParsed: string | undefined;
  /** Resolved once per turn from the telegram language and message text. */
  locale: TLocale;
};

export type TTelegramReplySingle =
  | { text: string; options?: TelegramBot.SendMessageOptions }
  | { sticker: string; options?: TelegramBot.SendStickerOptions }
  | { photo: Buffer; options?: TelegramBot.SendPhotoOptions };
export type TTelegramReply = TTelegramReplySingle | TTelegramReplySingle[];
export type TTelegramGetReplyFn = (props: TTelegramCommandProps) => TTelegramReply | Promise<TTelegramReply>;

export type TTelegramCommandMethods = {
  test: (props: TTelegramCommandProps) => boolean;
  getReply: TTelegramGetReplyFn;
};

export type TTelegramCommand = "/start" | "/last" | "/stat" | "/settings" | "/help" | "/debug";
