import { getRandomInt, randomFrom } from "@mooduck/core";
import { pickRandomPromptMode, PROMPT_MODE } from "./mode";
import { getLastMoodCommentsForPrompt } from "../sagas/getLastMoodCommentsForPrompt";
import { TSelectMoodEntry } from "../model";

type TProps = {
  entries: TSelectMoodEntry[];
  score: number;
  comment?: string;
};

export function getPromptByMood(props: TProps): string {
  const score = `${props.score}/10`;

  return `Представь, что тебя используют в чат-боте для записи настроения пользователя.
Пришло сообщение о том, что у пользователя настроение ${score}.

${getComment(props)}

Напиши ответ пользователю — реакцию на его настроение.
Не предлагай кофе, пряники или печеньки — это банально и скучно.
НИЧЕГО, КРОМЕ ОТВЕТА ПОЛЬЗОВАТЕЛЮ, ПИСАТЬ НЕ НАДО

${getMode(props)}

Нужен содержательный и краткий ответ — не больше ${getWordsLimit(props)} слов.
Каждый раз ответ должен быть уникальным и интересным.

${getLastMoodCommentsForPrompt(props.entries) ?? ""}

ЕЩЁ РАЗ, НИЧЕГО, КРОМЕ ОТВЕТА ПОЛЬЗОВАТЕЛЮ, ПИСАТЬ НЕ НАДО`;
}

function getComment(props: TProps): string {
  return props.comment
    ? `Пользователь написал: "${props.comment}". Обыграй это в ответе — возможно, это ключ к его настроению!`
    : "";
}

function getMode(props: TProps): string {
  if (props.score >= 4) {
    return pickRandomPromptMode();
  }

  if (props.score >= 2) {
    return randomFrom([PROMPT_MODE.friendly, PROMPT_MODE.philosophical]);
  }

  return PROMPT_MODE.friendly;
}

function getWordsLimit(props: TProps): number {
  switch (props.score) {
    case 10:
    case 1:
      return getRandomInt(80, 120);
    case 9:
    case 2:
      return getRandomInt(70, 110);
    case 8:
    case 3:
      return getRandomInt(60, 100);
    case 7:
    case 4:
      return getRandomInt(30, 70);
    default:
      return getRandomInt(20, 60);
  }
}
