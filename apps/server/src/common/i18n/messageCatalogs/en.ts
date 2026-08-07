/**
 * English UI catalog — the primary locale and the source of the catalog shape.
 * The Russian catalog must match this structure (see `ru.ts`).
 */
export const en = {
  common: {
    truncatedSuffix: "\n\n… (truncated)",
  },

  time: {
    daysAgo: (n: number) => `${n}d ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    minutesAgo: (n: number) => `${n}m ago`,
    justNow: "just now",
  },

  bot: {
    rateLimited: "Too many messages in a row. Wait a bit and try again.",
    helpHint: "Send /help to read how to use me",
    unknownMessage: "Not sure what to do with this message...",
    tooLong: (maxChars: number) => `I can't handle more than ${maxChars} characters`,
    genericError: "Something went wrong! Try again a bit later...",
    moodOutOfRange: "Please enter a number from 1 to 10",
    moodAckShort: (boring: string) => boring,
    moodAckLong: (boring: string) => `Got it, saved ${boring}`,
    help: `Just send me your mood in the format:
<code>1-10 comment</code>
and I'll remember it. For example:
<code>4 stomach ache</code>
or:
<code>8 had some dumplings</code>
or simply without a comment:
<code>7</code>

Available commands:
- /start — get started with me,
- /last — see your last 10 entries,
- /stat — get statistics on your entries,
- /forgetMe — delete everything I know about you,
- /help — show this message`,
  },

  forgetMe: {
    confirm: (phrase: string) => `This deletes everything I know about you: every mood entry, our whole conversation, and your account. There's no undo and no backup.

Send <code>${phrase}</code> to confirm — anything else cancels it.`,
    nothingToConfirm: (command: string) =>
      `There's nothing to confirm. Send ${command} first if you want me to delete everything I know about you.`,
    done: ({ moodEntries, chatMessages }: { moodEntries: number; chatMessages: number }) =>
      `Done — you're gone. Deleted ${moodEntries} mood ${moodEntries === 1 ? "entry" : "entries"} and ${chatMessages} ${chatMessages === 1 ? "message" : "messages"}. Send a mood whenever you want to start over.`,
  },

  last: {
    empty: "No entries yet. Send a mood like «7 great day» or open /help.",
  },

  stat: {
    empty:
      "No entries yet... I can't show any statistics without them. Send /help to see how to use me.",
    title: "Here are your stats",
    scores: "Scores",
    topComments: "Top interesting comments",
    avgMood: "Average mood",
    avgDeviation: "Average deviation",
    chart: {
      title: "Your mood history",
      caption: (count: number) => `Last ${count} check-ins`,
    },
  },

  debug: {
    adminOnly: "This command is for admins only.",
    on: "Debug: on",
    off: "Debug: off",
  },
};

export type TMessages = typeof en;
