import { RU_PLURALS, countRu } from "@mooduck/core";
import type { TWebMessages } from "./En";

/**
 * Russian web catalog. Typed as `TWebMessages`, so a forgotten key is a compile
 * error. Tone follows the bot's `ru.ts`: informal «ты», warm, unhurried.
 *
 * Counts are spelled out ("3 дня", not "3 дн.") and go through `countRu`, which
 * handles the agreement — a bare `${n} дней` would print "1 дней" and "22 дней".
 */
export const ru: TWebMessages = {
  app: {
    wordmark: "MooDuck",
  },

  login: {
    heading: "MooDuck",
    tagline: "Тихое место, чтобы услышать себя.",
    prompt: "Войди через Telegram, чтобы увидеть свои записи.",
    widgetUnavailable:
      "Кнопка входа через Telegram не загрузилась. Обнови страницу или открой MooDuck из бота.",
    failed: "Войти не получилось. Попробуй ещё раз.",
  },

  header: {
    logout: "Выйти",
    localeSwitcherLabel: "Язык",
    avatarAlt: "Твоя аватарка из Telegram",
  },

  checkIn: {
    question: "Как ты сейчас?",
    accent: "бережно ♥",
    scoreLabel: (score: number) => `Настроение ${score} из 10`,
    noteLabel: "Заметка (по желанию)",
    notePlaceholder: "Добавь заметку (по желанию)",
    send: "Отправить",
    sending: "Отправляю…",
    sendError: "Не получилось отправить. Попробуй ещё раз.",
    pickScoreFirst: "Сначала выбери, как ты.",
  },

  stats: {
    averageMood: "Среднее настроение",
    checkIns: "Записей",
    streak: "Серия",
    empty: "—",
    streakValue: (days: number) => countRu(days, RU_PLURALS.day),
  },

  chart: {
    title: "Твоё настроение",
    subtitle: "Последние 30 записей",
    empty: "Пока мало записей, чтобы построить график",
  },

  recent: {
    title: "Последнее",
    empty: "Пока нет записей. Первая появится здесь.",
  },

  states: {
    loading: "Загружаю…",
    loadError: "Не получилось загрузить записи.",
    retry: "Попробовать снова",
  },

  time: {
    justNow: "только что",
    minutesAgo: (minutes: number) => `${countRu(minutes, RU_PLURALS.minute)} назад`,
    hoursAgo: (hours: number) => `${countRu(hours, RU_PLURALS.hour)} назад`,
    yesterday: "вчера",
    daysAgo: (days: number) => `${countRu(days, RU_PLURALS.day)} назад`,
  },
};
