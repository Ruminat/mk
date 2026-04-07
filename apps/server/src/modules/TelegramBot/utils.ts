import TelegramBot from "node-telegram-bot-api";
import { getEnvironmentVariables } from "../../common/environment";
import { getHashFromNumber } from "../crypto/utils";
import { TTelegramCommandProps, TTelegramReply } from "./definitions";

export function code(content: string): string {
  return `<code>${content}</code>`;
}

export function b(content: string): string {
  return `<b>${content}</b>`;
}

export function messageHasPrefix(prefixes: string[], message: string) {
  return prefixes.some((prefix) => message.startsWith(prefix));
}

export function telegramSendReply(bot: TelegramBot, props: TTelegramCommandProps, reply: TTelegramReply) {
  if (Array.isArray(reply)) {
    for (const singleReply of reply) {
      telegramSendReply(bot, props, singleReply);
    }

    return;
  }

  if ("text" in reply) {
    bot.sendMessage(props.chatId, reply.text, { ...reply.options, parse_mode: "HTML" });
  } else {
    bot.sendSticker(props.chatId, reply.sticker, { ...reply.options });
  }
}

export function getTelegramUserIdHash(props: TTelegramCommandProps): string {
  const telegramUserId = props.message.from?.id;
  if (telegramUserId === undefined) {
    throw new Error("No telegram user id in message");
  }
  return getTelegramUserIdSecureHash(telegramUserId);
}

export function getTelegramUserIdSecureHash(userId: number) {
  const secret = getEnvironmentVariables().telegramBot.telegramUserIdSecureHash;

  if (!secret) {
    console.log("TELEGRAM_USER_ID_SECURE_HASH is not set!!!");
  }

  return getHashFromNumber(userId, { secret });
}
