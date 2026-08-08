import { getRandomInt } from "@mooduck/core";
import type { TLocale } from "@mooduck/core";
import { prompts } from "../../../common/i18n/prompts";
import { TSelectMoodEntry } from "../model";
import { getLastMoodCommentsForPrompt } from "../sagas/getLastMoodCommentsForPrompt";

type TProps = {
  entries: TSelectMoodEntry[];
  score: number;
  comment?: string;
  locale: TLocale;
};

export function getPromptByMood(props: TProps): string {
  const catalog = prompts(props.locale);

  const commentSection = props.comment ? catalog.moodCommentSection(props.comment) : "";
  const recentComments = getLastMoodCommentsForPrompt(props.entries, props.locale) ?? "";

  return catalog.moodPrompt({
    score: `${props.score}/10`,
    commentSection,
    wordsLimit: getWordsLimit(props.score),
    recentComments,
  });
}

function getWordsLimit(score: number): number {
  switch (score) {
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
