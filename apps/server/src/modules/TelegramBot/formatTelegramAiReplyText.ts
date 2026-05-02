import { truncateTelegramMessage } from "../../common/truncateTelegramMessage";
import { isAdminTelegramLogin } from "./isAdminTelegramLogin";
import { isTelegramBotDebugEnabled } from "./telegramBotDebugState";

type TArgs = {
  prompt: string;
  reply: string;
  username: string | undefined;
};

export function formatTelegramAiReplyText({ prompt, reply, username }: TArgs): string {
  const showPrompt = isAdminTelegramLogin(username) && isTelegramBotDebugEnabled();
  const raw = showPrompt ? `Промпт:\n${prompt}\n\nОтвет:\n${reply}` : reply;
  return truncateTelegramMessage(raw);
}
