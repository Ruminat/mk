import he from "he";
import { truncateTelegramMessage } from "../../common/telegram/truncateTelegramMessage";
import { isAdminTelegramLogin } from "./isAdminTelegramLogin";
import { isTelegramBotDebugEnabled } from "./telegramBotDebugState";

type TArgs = {
  prompt: string;
  reply: string;
  username: string | undefined;
};

export function formatTelegramAiReplyText({ prompt, reply, username }: TArgs): string {
  const showPrompt = isAdminTelegramLogin(username) && isTelegramBotDebugEnabled();
  const raw = showPrompt
    ? `Промпт:\n${he.escape(prompt)}\n\nОтвет:\n${he.escape(reply)}`
    : he.escape(reply);
  return truncateTelegramMessage(raw);
}
