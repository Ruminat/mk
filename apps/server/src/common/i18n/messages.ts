import type { TLocale } from "./locale";
import { en, type TMessages } from "./messageCatalogs/en";
import { ru } from "./messageCatalogs/ru";

const catalogs: Record<TLocale, TMessages> = { en, ru };

/** UI string catalog for a locale. Usage: `messages(locale).bot.help`. */
export function messages(locale: TLocale): TMessages {
  return catalogs[locale];
}
