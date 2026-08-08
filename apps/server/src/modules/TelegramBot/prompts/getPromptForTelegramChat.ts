import { getRandomInt } from "@mooduck/core";
import type { TLocale } from "@mooduck/core";
import { prompts } from "../../../common/i18n/prompts";
import type { TTelegramChatHistoryEntry } from "../telegramUserChatHistory";

type TProps = {
  recentMessages: readonly TTelegramChatHistoryEntry[];
  locale: TLocale;
};

export function getPromptForTelegramChat(props: TProps): string {
  const catalog = prompts(props.locale);
  const wordsLimit = getRandomInt(20, 60);
  const messageCount = props.recentMessages.length;

  const numberedLines = props.recentMessages
    .map((entry, index) => `${index + 1}. ${catalog.chatSpeaker(entry.role)}: ${entry.text}`)
    .join("\n");

  const historyBlock =
    numberedLines.length > 0
      ? `${numberedLines}

${catalog.chatHistoryHeader(messageCount)}

`
      : "";

  return catalog.chatPrompt({ historyBlock, wordsLimit });
}
