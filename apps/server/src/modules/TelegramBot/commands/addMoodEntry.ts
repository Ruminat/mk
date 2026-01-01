// import { isEmpty, notEmpty, stringToNumberOrUndefined } from "@shreklabs/core";
import TelegramBot from "node-telegram-bot-api";
// import { callRandomParameter } from "../../common/random/utils";
// import { getAIReply } from "../../models/AI/sagas";
// import { getPromptByMood } from "../../models/Mood/prompts/getPromptByMood";
// import { createMoodEntry, newMood } from "../../models/Mood/storage";
// import { sentence } from "../../models/SentenceBuilder";
// import { getInterjectionsByMood } from "../../models/SentenceBuilder/interjections";
// import { TUser } from "../../models/User/definitions";
// import { createUserEntryIfNotPresent } from "../../models/User/storage";
import { TelegramInputError, TTelegramCommandMethods, TTelegramReply } from "../definitions";
import { notEmpty, stringToNumberOrUndefined } from "@mooduck/core";

export const telegramMoodEntry = {
  test: ({ messageParsed }) => {
    if (!messageParsed) return false;

    if (!/^([1-9]|10)( .+)?$/.test(messageParsed)) {
      return false;
    }

    const matched = messageParsed.match(/^\d{1,2}/);
    if (!matched || matched.length !== 1) {
      throw new Error("invalid start number");
    }

    const [scoreString] = matched;

    const score = getValidMoodScoreOrUndefined(scoreString);
    if (notEmpty(score)) {
      return true;
    } else {
      throw new TelegramInputError("Нужно число от 1 до 10");
    }
  },

  getReply: async (props) => {
    return { text: "TODO: add mood reply" };

    // const message = props.message.text;

    // if (!message) throw new Error("Empty message");

    // const [scoreString, ...rest] = message.split(" ");
    // const comment = rest && rest.length > 0 ? rest.join(" ") : undefined;
    // const score = getValidMoodScoreOrUndefined(scoreString);

    // if (isEmpty(score)) {
    //   throw new TelegramInputError("Нужно число от 1 до 10");
    // }

    // const user = createUserEntryIfNotPresent(props.chatId, getUserPropsFromMessage(props.message));
    // createMoodEntry(user, newMood({ score, comment }));

    // const interjection = getInterjectionsByMood(score);
    // const boring = `(${score}${comment ? ` + "${comment}"` : ""})`;
    // const defaultResult = callRandomParameter(
    //   (): TTelegramReply => {
    //     return { text: sentence`${interjection} ${boring}` };
    //   },
    //   (): TTelegramReply => {
    //     return { text: `Понял, принял, обработал ${boring}` };
    //   }
    // ) as TTelegramReply;

    // let result = defaultResult;
    // try {
    //   const reply = await getAIReply({ score, prompt: getPromptByMood({ user, score, comment }) });

    //   if (!reply) throw new Error("Didn't get any reply");

    //   result = { text: reply };
    // } catch (error) {
    //   console.log("Oops...", error);
    // }

    // return result as TTelegramReply;
  },
} satisfies TTelegramCommandMethods;

function getValidMoodScoreOrUndefined(scoreString: string | undefined) {
  if (!scoreString) return undefined;

  const score = stringToNumberOrUndefined(scoreString);

  return notEmpty(score) && score >= 1 && score <= 10 ? score : undefined;
}

// function getUserPropsFromMessage(message: TelegramBot.Message) {
//   return { login: message.from?.username } satisfies Partial<TUser>;
// }
