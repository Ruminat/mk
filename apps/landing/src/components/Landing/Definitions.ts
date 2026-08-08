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

/**
 * Structure only — no copy. Every translatable string lives in `I18n/Catalogs`
 * and is looked up by the stable `id` on each item, so a component maps over the
 * structure here and reads its text from the active locale's catalog. Keeping
 * the two apart is what makes a missing Russian string a type error rather than
 * a blank spot on the page.
 */

/** Where the CTA buttons point. */
export const TELEGRAM_URL = "https://t.me/Moo_Duck_zae_bot";
export const GITHUB_URL = "https://github.com/Ruminat/mooduck";

/** Anchor navigation in the header. `github` is an external link. */
export type NavId = "features" | "howItWorks" | "privacy" | "github";

export interface NavLink {
  id: NavId;
  href: string;
  external?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { id: "features", href: "#features" },
  { id: "howItWorks", href: "#how-it-works" },
  { id: "privacy", href: "#privacy" },
  { id: "github", href: GITHUB_URL, external: true },
];

/** Accent palette used by feature cards and the "how it works" steps. */
export type AccentTone = "blue" | "gold" | "green" | "purple";

export type FeatureId = "gentleCheckins" | "patterns" | "privateByDesign" | "notes";

export interface Feature {
  id: FeatureId;
  Icon: ComponentType<IconProps>;
  tone: AccentTone;
}

export const FEATURES: Feature[] = [
  { id: "gentleCheckins", Icon: HeartIcon, tone: "gold" },
  { id: "patterns", Icon: TrendingUpIcon, tone: "blue" },
  { id: "privateByDesign", Icon: LockIcon, tone: "green" },
  { id: "notes", Icon: PencilSquareIcon, tone: "purple" },
];

export type StepId = "checkIn" | "addNote" | "reflect";

export interface Step {
  id: StepId;
  index: number;
  Icon: ComponentType<IconProps>;
  tone: AccentTone;
}

export const STEPS: Step[] = [
  { id: "checkIn", index: 1, Icon: SmileIcon, tone: "blue" },
  { id: "addNote", index: 2, Icon: PencilSquareIcon, tone: "gold" },
  { id: "reflect", index: 3, Icon: TrendingUpIcon, tone: "green" },
];

export type PrivacyPointId = "encrypted" | "notNamed" | "neverSold" | "yourCall";

export interface PrivacyPoint {
  id: PrivacyPointId;
  Icon: ComponentType<IconProps>;
  tone: AccentTone;
}

export const PRIVACY_POINTS: PrivacyPoint[] = [
  { id: "encrypted", Icon: LockIcon, tone: "green" },
  { id: "notNamed", Icon: UserHeartIcon, tone: "green" },
  { id: "neverSold", Icon: ShieldCheckIcon, tone: "green" },
  { id: "yourCall", Icon: FileControlIcon, tone: "green" },
];

/** Checklist next to the product preview. */
export type PreviewPointId = "rate" | "note" | "review" | "private";

export interface PreviewPoint {
  id: PreviewPointId;
  Icon: ComponentType<IconProps>;
  tone: AccentTone;
}

export const PREVIEW_POINTS: PreviewPoint[] = [
  { id: "rate", Icon: HeartIcon, tone: "gold" },
  { id: "note", Icon: PencilSquareIcon, tone: "purple" },
  { id: "review", Icon: SproutIcon, tone: "green" },
  { id: "private", Icon: BellIcon, tone: "blue" },
];

export type ChatSide = "bot" | "user";
export type ChatMessageId = "greeting" | "userScore" | "askNote" | "userNote" | "saved";

export interface ChatMessage {
  id: ChatMessageId;
  side: ChatSide;
  time: string;
}

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: "greeting", side: "bot", time: "10:29" },
  { id: "userScore", side: "user", time: "10:29" },
  { id: "askNote", side: "bot", time: "10:29" },
  { id: "userNote", side: "user", time: "10:30" },
  { id: "saved", side: "bot", time: "10:30" },
];

/** Demo data for the mood-history preview card (values only — no copy). */
export const MOOD_HISTORY_VALUES = [6, 7, 8, 6, 7, 9, 7, 5, 3, 4, 6, 8, 7, 6];

export type MoodEntryId = "first" | "second" | "third";

export interface MoodEntry {
  id: MoodEntryId;
  score: string;
}

/** Score is locale-independent; date and note come from the catalog. */
export const MOOD_ENTRIES: MoodEntry[] = [
  { id: "first", score: "7/10" },
  { id: "second", score: "5/10" },
  { id: "third", score: "8/10" },
];
