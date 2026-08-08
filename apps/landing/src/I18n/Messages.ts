import type { TLocale } from "@mooduck/core";
import { en, type TLandingMessages } from "./Catalogs/En";
import { ru } from "./Catalogs/Ru";

const catalogs: Record<TLocale, TLandingMessages> = { en, ru };

/** Landing copy for a locale. Usage: `landingMessages(locale).hero.subtitle`. */
export function landingMessages(locale: TLocale): TLandingMessages {
  return catalogs[locale];
}
