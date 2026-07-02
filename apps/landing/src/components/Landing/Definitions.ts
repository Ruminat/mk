import type { ComponentType } from "react";
import type { IconProps } from "./Icons";
import {
  FileControlIcon,
  HeartSolidIcon,
  LockIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  SmileIcon,
  SproutIcon,
} from "./Icons";

/** Where the CTA buttons point. */
export const TELEGRAM_URL = "https://t.me/MooDuckBot";
export const GITHUB_URL = "https://github.com/";

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
    Icon: SproutIcon,
    tone: "blue",
    title: "Gentle daily check-ins",
    body: "A friendly nudge to pause and notice how you feel, no pressure.",
  },
  {
    Icon: PencilSquareIcon,
    tone: "gold",
    title: "Short notes & reflections",
    body: "Write a few words when you need to. Keep it light, or let it out.",
  },
  {
    Icon: LockIcon,
    tone: "green",
    title: "Private by design",
    body: "Your thoughts are yours alone. No judgment, no public feed.",
  },
  {
    Icon: HeartSolidIcon,
    tone: "purple",
    title: "Low pressure, simple routine",
    body: "Small moments, big impact. Build a habit that feels natural and kind.",
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
    body: "Open MooDuck in Telegram and tell us how you feel.",
  },
  {
    index: 2,
    Icon: PencilSquareIcon,
    tone: "gold",
    title: "Add a note",
    body: "Share a few words if you want to. It's your space, your pace.",
  },
  {
    index: 3,
    Icon: SproutIcon,
    tone: "green",
    title: "Reflect over time",
    body: "Come back anytime to look back, be kind to yourself, and grow.",
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
    tone: "blue",
    title: "Private by design",
    body: "Your data stays between you and MooDuck.",
  },
  {
    Icon: HeartSolidIcon,
    tone: "gold",
    title: "No judgment",
    body: "Always gentle, supportive, and non-judgmental.",
  },
  {
    Icon: FileControlIcon,
    tone: "blue",
    title: "You're in control",
    body: "You decide what to share and when.",
  },
  {
    Icon: ShieldCheckIcon,
    tone: "blue",
    title: "Secure & safe",
    body: "Built with simple, careful privacy practices.",
  },
];

export type ChatSide = "bot" | "user";

export interface ChatMessage {
  side: ChatSide;
  text: string;
  time: string;
}

export const CHAT_MESSAGES: ChatMessage[] = [
  { side: "bot", text: "Hi there 👋 How are you feeling right now?", time: "10:30" },
  { side: "user", text: "I'd say a 6", time: "10:30" },
  {
    side: "bot",
    text: "Thanks for sharing. Want to add a short note about your day? You can skip this.",
    time: "10:30",
  },
  {
    side: "user",
    text: "It was a bit overwhelming, but I took a walk and that helped.",
    time: "10:31",
  },
  {
    side: "bot",
    text: "You showed up for yourself today. That matters. 💛 I'm here whenever you want to check in.",
    time: "10:31",
  },
];
