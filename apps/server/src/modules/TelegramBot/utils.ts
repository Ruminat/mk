import TelegramBot from "node-telegram-bot-api";
import { formatPaddedMoodScoreDenominator } from "../../common/mood/moodFormat";
import { getTelegramUserIdSecureHash } from "../../common/telegram/telegramUserId";
import { TTelegramCommandProps, TTelegramReply } from "./definitions";

export function code(content: string): string {
  return `<code>${content}</code>`;
}

export function moodScoreCode(score: number): string {
  return code(formatPaddedMoodScoreDenominator(score));
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
  } else if ("photo" in reply) {
    bot.sendPhoto(
      props.chatId,
      reply.photo,
      { parse_mode: "HTML", ...reply.options },
      { filename: "mood-history.png", contentType: "image/png" },
    );
  } else {
    bot.sendSticker(props.chatId, reply.sticker, { ...reply.options });
  }
}

/** The raw numeric telegram id — needed to derive the per-user encryption key. */
export function getTelegramUserId(props: TTelegramCommandProps): number {
  const telegramUserId = props.message.from?.id;
  if (telegramUserId === undefined) {
    throw new Error("No telegram user id in message");
  }
  return telegramUserId;
}

export function getTelegramUserIdHash(props: TTelegramCommandProps): string {
  return getTelegramUserIdSecureHash(getTelegramUserId(props));
}
