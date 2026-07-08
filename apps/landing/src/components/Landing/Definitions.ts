import type { ComponentType } from "react";
import type { IconProps } from "./Icons";
import {
  BellIcon,
  FileControlIcon,
  HeartIcon,
  LockIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  SmileIcon,
  SproutIcon,
  TrendingUpIcon,
  UserHeartIcon,
} from "./Icons";

/** Where the CTA buttons point. */
export const TELEGRAM_URL = "https://t.me/Moo_Duck_zae_bot";
export const GITHUB_URL = "https://github.com/Ruminat/mooduck";

/** Anchor navigation in the header. */
export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Privacy", href: "#privacy" },
  { label: "GitHub", href: GITHUB_URL, external: true },
];

/** Accent palette used by feature cards and the "how it works" steps. */
export type AccentTone = "blue" | "gold" | "green" | "purple";

export interface Feature {
  Icon: ComponentType<IconProps>;
  tone: AccentTone;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    Icon: HeartIcon,
    tone: "gold",
    title: "Gentle daily check-ins",
    body: "A simple 1–10 mood scale helps you pause and tune in, without pressure.",
  },
  {
    Icon: TrendingUpIcon,
    tone: "blue",
    title: "Understand patterns",
    body: "See your mood history and spot patterns that matter to you.",
  },
  {
    Icon: LockIcon,
    tone: "green",
    title: "Private by design",
    body: "Your notes are encrypted, never sold, and never tied to your name.",
  },
  {
    Icon: PencilSquareIcon,
    tone: "purple",
    title: "Notes & reflection",
    body: "Add short notes to capture context, thoughts, and small wins.",
  },
];

export interface Step {
  index: number;
  Icon: ComponentType<IconProps>;
  tone: AccentTone;
  title: string;
  body: string;
}

export const STEPS: Step[] = [
  {
    index: 1,
    Icon: SmileIcon,
    tone: "blue",
    title: "Check in",
    body: "Open MooDuck in Telegram and rate how you feel on a 1–10 scale.",
  },
  {
    index: 2,
    Icon: PencilSquareIcon,
    tone: "gold",
    title: "Add a note",
    body: "Share a few words about what's on your mind (optional, always yours).",
  },
  {
    index: 3,
    Icon: TrendingUpIcon,
    tone: "green",
    title: "Reflect on patterns",
    body: "Review your mood history to understand your ups, downs, and everything in between.",
  },
];

export interface PrivacyPoint {
  Icon: ComponentType<IconProps>;
  tone: AccentTone;
  title: string;
  body: string;
}

export const PRIVACY_POINTS: PrivacyPoint[] = [
  {
    Icon: LockIcon,
    tone: "green",
    title: "Encrypted and locked",
    body: "Every note and message is encrypted before it's stored — kept under lock, safe from prying eyes.",
  },
  {
    Icon: UserHeartIcon,
    tone: "green",
    title: "Not tied to your name",
    body: "We don't keep your name or profile. Your moods aren't linked to who you are.",
  },
  {
    Icon: ShieldCheckIcon,
    tone: "green",
    title: "Never sold or shared",
    body: "We don't sell or share your data. Ever.",
  },
  {
    Icon: FileControlIcon,
    tone: "green",
    title: "Always your call",
    body: "Delete your history whenever you like — it's yours to keep or clear.",
  },
];

/** Checklist next to the product preview. */
export interface PreviewPoint {
  Icon: ComponentType<IconProps>;
  tone: AccentTone;
  text: string;
}

export const PREVIEW_POINTS: PreviewPoint[] = [
  { Icon: HeartIcon, tone: "gold", text: "Rate how you feel on a 1–10 scale" },
  { Icon: PencilSquareIcon, tone: "purple", text: "Add a short note (optional)" },
  { Icon: SproutIcon, tone: "green", text: "Review your mood history anytime" },
  { Icon: BellIcon, tone: "blue", text: "Private, low pressure, always" },
];

export type ChatSide = "bot" | "user";

export interface ChatMessage {
  side: ChatSide;
  text: string;
  time: string;
}

export const CHAT_MESSAGES: ChatMessage[] = [
  {
    side: "bot",
    text: "Hey there 👋 How are you feeling right now? On a scale from 1 (really tough) to 10 (feeling great).",
    time: "10:29",
  },
  { side: "user", text: "7", time: "10:29" },
  {
    side: "bot",
    text: "Got it. Want to add a short note about what's on your mind?",
    time: "10:29",
  },
  {
    side: "user",
    text: "Had a productive morning and took a good walk. Feeling grateful.",
    time: "10:30",
  },
  {
    side: "bot",
    text: "Thanks for checking in 💛 I've saved your entry.",
    time: "10:30",
  },
];

/** Demo data for the mood-history preview card. */
export const MOOD_HISTORY_VALUES = [6, 7, 8, 6, 7, 9, 7, 5, 3, 4, 6, 8, 7, 6];

export interface MoodEntry {
  date: string;
  score: string;
  note: string;
}

export const MOOD_ENTRIES: MoodEntry[] = [
  { date: "May 20", score: "7/10", note: "Had a productive morning…" },
  { date: "May 18", score: "5/10", note: "Felt a bit overwhelmed." },
  { date: "May 16", score: "8/10", note: "Good day with friends." },
];
