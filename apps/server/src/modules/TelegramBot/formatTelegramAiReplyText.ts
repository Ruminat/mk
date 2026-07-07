import he from "he";
import type { TLocale } from "../../common/i18n/locale";
import { messages } from "../../common/i18n/messages";
import { isAdminLogin } from "../../common/telegram/isAdminLogin";
import { truncateTelegramMessage } from "../../common/telegram/truncateTelegramMessage";
import { isTelegramBotDebugEnabled } from "./telegramBotDebugState";

type TArgs = {
  prompt: string;
  reply: string;
  username: string | undefined;
  locale: TLocale;
};

export function formatTelegramAiReplyText({ prompt, reply, username, locale }: TArgs): string {
  const showPrompt = isAdminLogin(username) && isTelegramBotDebugEnabled();
  const raw = showPrompt
    ? `Prompt:\n${he.escape(prompt)}\n\nReply:\n${he.escape(reply)}`
    : he.escape(reply);
  return truncateTelegramMessage(raw, { suffix: messages(locale).common.truncatedSuffix });
}
