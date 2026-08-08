/**
 * English web catalog. This object's shape is the contract (`TWebMessages`);
 * `Ru.ts` must satisfy it, so a missing translation is a compile error.
 * Interpolation is a function on the catalog — no i18n library, no `{{}}`.
 */
export const en = {
  app: {
    wordmark: "MooDuck",
  },

  login: {
    heading: "MooDuck",
    tagline: "A calm place to listen to yourself.",
    prompt: "Sign in with Telegram to see your check-ins.",
    widgetUnavailable:
      "The Telegram login button couldn't load. Refresh the page, or open MooDuck from the bot.",
    failed: "That sign-in didn't go through. Try again.",
  },

  header: {
    logout: "Log out",
    localeSwitcherLabel: "Language",
    avatarAlt: "Your Telegram avatar",
  },

  checkIn: {
    question: "How are you feeling?",
    accent: "gently ♥",
    scoreLabel: (score: number) => `Mood ${score} of 10`,
    noteLabel: "Note (optional)",
    notePlaceholder: "Add a note (optional)",
    save: "Save check-in",
    saving: "Saving…",
    saveError: "Couldn't save your check-in. Try again.",
    pickScoreFirst: "Pick how you feel first.",
  },

  stats: {
    averageMood: "Average mood",
    checkIns: "Check-ins",
    streak: "Streak",
    empty: "—",
    streakValue: (days: number) => (days === 1 ? "1 day" : `${days} days`),
  },

  chart: {
    title: "Your mood",
    subtitle: "Last 30 check-ins",
    empty: "Not enough check-ins to plot yet",
  },

  recent: {
    title: "Recent",
    empty: "No check-ins yet. Your first one will show up here.",
  },

  states: {
    loading: "Loading…",
    loadError: "Couldn't load your check-ins.",
    retry: "Try again",
  },

  time: {
    justNow: "just now",
    minutesAgo: (minutes: number) => `${minutes} min ago`,
    hoursAgo: (hours: number) => `${hours}h ago`,
    yesterday: "yesterday",
    daysAgo: (days: number) => `${days}d ago`,
  },
};

export type TWebMessages = typeof en;
