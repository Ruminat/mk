import type {
  ChatMessageId,
  FeatureId,
  MoodEntryId,
  NavId,
  PreviewPointId,
  PrivacyPointId,
  StepId,
} from "../../components/Landing/Definitions";

/**
 * English catalog. This object's shape *is* the contract: `TLandingMessages`
 * is `typeof en`, and `Ru.ts` must satisfy it, so every string here has to
 * have a Russian counterpart or the build fails.
 */
export const en = {
  meta: {
    title: "MooDuck — A calm place to listen to yourself",
    description:
      "MooDuck is your private Telegram mood journal. Check in, add short notes, and reflect gently — all in a safe, judgment-free space.",
  },

  cta: {
    openInTelegram: "Open in Telegram",
    openInTelegramShort: "Telegram",
    viewOnGithub: "View on GitHub",
  },

  header: {
    backToTop: "MooDuck — back to top",
    localeSwitcherLabel: "Language",
  },

  nav: {
    features: "Features",
    howItWorks: "How it works",
    privacy: "Privacy",
    github: "GitHub",
  } satisfies Record<NavId, string>,

  hero: {
    titleLead: "A calm place to",
    titleTail: "listen to yourself.",
    subtitle:
      "MooDuck is a private Telegram mood journal that helps you check in, add short notes, and notice patterns over time — gently and without pressure.",
    privacyNote: "Private by design. Your check-ins are yours.",
    mascotAlt: "MooDuck mascot — a scholarly duck holding a journal",
  },

  features: {
    gentleCheckins: {
      title: "Gentle daily check-ins",
      body: "A simple 1–10 mood scale helps you pause and tune in, without pressure.",
    },
    patterns: {
      title: "Understand patterns",
      body: "See your mood history and spot patterns that matter to you.",
    },
    privateByDesign: {
      title: "Private by design",
      body: "Your notes are encrypted, never sold, and never tied to your name.",
    },
    notes: {
      title: "Notes & reflection",
      body: "Add short notes to capture context, thoughts, and small wins.",
    },
  } satisfies Record<FeatureId, { title: string; body: string }>,

  preview: {
    eyebrow: "Product preview",
    title: "Check in. Reflect. Grow with kindness.",
    body: "MooDuck meets you where you are — with simple conversations and meaningful insights.",
    points: {
      rate: "Rate how you feel on a 1–10 scale",
      note: "Add a short note (optional)",
      review: "Review your mood history anytime",
      private: "Private, low pressure, always",
    } satisfies Record<PreviewPointId, string>,
    chatName: "MooDuck",
    chatStatus: "bot",
    chat: {
      greeting: "Hey there 👋 How are you feeling right now? On a scale from 1 (really tough) to 10 (feeling great).",
      userScore: "7",
      askNote: "Got it. Want to add a short note about what's on your mind?",
      userNote: "Had a productive morning and took a good walk. Feeling grateful.",
      saved: "Thanks for checking in 💛 I've saved your entry.",
    } satisfies Record<ChatMessageId, string>,
    historyTitle: "Your mood history",
    historyCaption: "Past 14 days",
    chartAriaLabel: "Line chart of mood scores over the past 14 days",
    chartLabels: ["May 5", "May 10", "May 15", "May 20"],
    entriesTitle: "Recent entries",
    entries: {
      first: { date: "May 20", note: "Had a productive morning…" },
      second: { date: "May 18", note: "Felt a bit overwhelmed." },
      third: { date: "May 16", note: "Good day with friends." },
    } satisfies Record<MoodEntryId, { date: string; note: string }>,
    viewAll: "View all history",
  },

  howItWorks: {
    title: "How it works",
    steps: {
      checkIn: {
        title: "Check in",
        body: "Open MooDuck in Telegram and rate how you feel on a 1–10 scale.",
      },
      addNote: {
        title: "Add a note",
        body: "Share a few words about what's on your mind (optional, always yours).",
      },
      reflect: {
        title: "Reflect on patterns",
        body: "Review your mood history to understand your ups, downs, and everything in between.",
      },
    } satisfies Record<StepId, { title: string; body: string }>,
  },

  privacy: {
    title: "Your check-ins are private and yours.",
    intro: "Built for honesty, not pressure.",
    points: {
      encrypted: {
        title: "Encrypted and locked",
        body: "Every note and message is encrypted before it's stored — kept under lock, safe from prying eyes.",
      },
      notNamed: {
        title: "Not tied to your name",
        body: "We don't keep your name or profile. Your moods aren't linked to who you are.",
      },
      neverSold: {
        title: "Never sold or shared",
        body: "We don't sell or share your data. Ever.",
      },
      yourCall: {
        title: "Always your call",
        body: "Delete your history whenever you like — it's yours to keep or clear.",
      },
    } satisfies Record<PrivacyPointId, { title: string; body: string }>,
  },

  finalCta: {
    title: "You deserve a space that's just for you.",
    body: "Start your gentle mood journey with MooDuck.",
    signoff: "Private. Low pressure. Always here for you.",
  },

  footer: {
    text: "Made with care by a solo builder · Open source · Built with kindness",
  },
};

export type TLandingMessages = typeof en;
