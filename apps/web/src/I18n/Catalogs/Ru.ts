import type { TWebMessages } from "./En";

/**
 * Russian web catalog. Typed as `TWebMessages`, so a forgotten key is a compile
 * error. Tone follows the bot's `ru.ts`: informal «ты», warm, unhurried. The
 * abbreviated time forms ("мин.", "ч.", "дн.") sidestep Russian plural agreement
 * on purpose, exactly as the bot does.
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
    save: "Сохранить",
    saving: "Сохраняю…",
    saveError: "Не получилось сохранить. Попробуй ещё раз.",
    pickScoreFirst: "Сначала выбери, как ты.",
  },

  stats: {
    averageMood: "Среднее настроение",
    checkIns: "Записей",
    streak: "Серия",
    empty: "—",
    streakValue: (days: number) => `${days} дн.`,
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
    minutesAgo: (minutes: number) => `${minutes} мин. назад`,
    hoursAgo: (hours: number) => `${hours} ч. назад`,
    yesterday: "вчера",
    daysAgo: (days: number) => `${days} дн. назад`,
  },
};
