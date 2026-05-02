import { getRandomInt } from "@mooduck/core";
import { pickRandomPromptMode } from "../../Mood/prompts/mode";

type TProps = {
  recentUserMessages: readonly string[];
};

export function getPromptForTelegramChat(props: TProps): string {
  const wordsLimit = getWordsLimit();
  const messageCount = props.recentUserMessages.length;

  const numberedLines = props.recentUserMessages
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");

  const historyBlock =
    numberedLines.length > 0
      ? `${numberedLines}

${lastMessagesLabel(messageCount)}

`
      : "";

  return `${historyBlock}Представь, что тебя используют в чат-боте для беседы с пользователем.

Напиши ответ пользователю.
Не предлагай кофе, пряники или печеньки — это банально и скучно.
НИЧЕГО, КРОМЕ ОТВЕТА ПОЛЬЗОВАТЕЛЮ, ПИСАТЬ НЕ НАДО

${pickRandomPromptMode()}

Нужен содержательный и краткий ответ — не больше ${wordsLimit} слов.
Каждый раз ответ должен быть уникальным и интересным.

ЕЩЁ РАЗ, НИЧЕГО, КРОМЕ ОТВЕТА ПОЛЬЗОВАТЕЛЮ, ПИСАТЬ НЕ НАДО`;
}

function getWordsLimit(): number {
  return getRandomInt(20, 60);
}

function lastMessagesLabel(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  let word: string;
  if (mod100 >= 11 && mod100 <= 14) {
    word = "сообщений";
  } else if (mod10 === 1) {
    word = "сообщение";
  } else if (mod10 >= 2 && mod10 <= 4) {
    word = "сообщения";
  } else {
    word = "сообщений";
  }
  return `Выше — последние ${count} ${word} пользователя.`;
}
