// import { getRandomInt } from "@shreklabs/core";
// import { getAIReply } from "../../models/AI/sagas";
// import { MoodPromptCommon } from "../../models/Mood/prompts/definitions";
// import { getMoodStatReply } from "../../models/Mood/sagas/getMoodStatReply";
// import { pickRandomPromptMode } from "../../models/Prompt/mode";
import { TTelegramCommandMethods } from "../definitions";
// import { getOrCreateTelegramUser } from "../utils";

export const telegramStatCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/stat";
  },

  getReply: async (props) => {
    return { text: "TODO: add stats" };

    // const stats = getMoodStatReply({ user: getOrCreateTelegramUser(props) });

    // if (!stats) {
    //   return {
    //     text: "Пока нет никаких записей... Не могу выдать никакой статистики без них. Напиши /help для того, чтобы посмотреть, как мной пользоваться",
    //   };
    // }

    // const prompt = `${MoodPromptCommon.promptRole}

    // Нужно прокомментировать статистику пользователя.
    // ${pickRandomPromptMode()}
    // Предоставь только ответ пользователю и больше ничего.
    // ${MoodPromptCommon.banPhrases}
    // ${MoodPromptCommon.wordsLimit(getRandomInt(300, 500))}

    // ${stats}`;

    // try {
    //   const reply = await getAIReply({ prompt });

    //   if (!reply) throw new Error("Didn't get any reply");

    //   return { text: `${stats}\n\n${reply}` };
    // } catch (error) {
    //   console.log("Oops...", error);
    // }

    // return { text: stats };
  },
} satisfies TTelegramCommandMethods;
