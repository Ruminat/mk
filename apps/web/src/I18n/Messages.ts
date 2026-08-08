import type { TLocale } from "@mooduck/core";
import { en, type TWebMessages } from "./Catalogs/En";
import { ru } from "./Catalogs/Ru";

const catalogs: Record<TLocale, TWebMessages> = { en, ru };

/** Web copy for a locale. Usage: `webMessages(locale).checkIn.save`. */
export function webMessages(locale: TLocale): TWebMessages {
  return catalogs[locale];
}
