import { getRandomInt } from "@mooduck/core";
import he from "he";
import { messages } from "../../../common/i18n/messages";
import { prompts } from "../../../common/i18n/prompts";
import { TTelegramCommandMethods, TTelegramReplySingle } from "../definitions";
import { moodService } from "../../Mood/service";
import { aiService } from "../../AI/service";
import { getMoodStatReply } from "../../Mood/sagas/getMoodStatReply";
import {
  MOOD_CHART_MIN_POINTS,
  moodChartPointCount,
  renderMoodHistoryChart,
} from "../charts/moodHistoryChart";

export const telegramStatCommand = {
  test: ({ messageParsed }) => {
    return messageParsed === "/stat";
  },

  getReply: async (props) => {
    const { telegramUserIdHash } = props;
    const entries = await moodService.listMoodEntries({
      userId: telegramUserIdHash,
      telegramId: props.telegramId,
    });

    const stats = getMoodStatReply(entries, props.locale);

    if (!stats) {
      return { text: messages(props.locale).stat.empty };
    }

    const replies: TTelegramReplySingle[] = [];

    // Lead with the mood-history chart (skipped when there's too little to plot).
    if (entries.length >= MOOD_CHART_MIN_POINTS) {
      try {
        const { title, caption } = messages(props.locale).stat.chart;
        replies.push({
          photo: renderMoodHistoryChart(entries, props.locale),
          options: { caption: `<b>${title}</b>\n${caption(moodChartPointCount(entries))}` },
        });
      } catch (error) {
        console.log("Mood chart render failed:", error);
      }
    }

    let statsText = stats;
    const prompt = prompts(props.locale).statPrompt({ stats, wordsLimit: getRandomInt(80, 180) });
    try {
      const reply = await aiService.getDeepSeekReply({ prompt, userIdHash: telegramUserIdHash });
      if (reply) {
        statsText = `${stats}\n\n${he.escape(reply)}`;
      }
    } catch (error) {
      console.log("AI reply failed:", error);
    }

    replies.push({ text: statsText });
    return replies;
  },
} satisfies TTelegramCommandMethods;
