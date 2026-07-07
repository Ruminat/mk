import { DEFAULT_LOCALE, type TLocale } from "./locale";

/**
 * Heuristic: does this text read as Russian? True when Cyrillic letters are
 * present and are at least as common as Latin letters. Cheap and dependency-free
 * — good enough to catch "the user is writing in Russian" without a language lib.
 */
export function isRussianText(text: string | undefined | null): boolean {
  if (!text) {
    return false;
  }
  const cyrillic = (text.match(/[Ѐ-ӿ]/g) ?? []).length;
  if (cyrillic === 0) {
    return false;
  }
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return cyrillic >= latin;
}

/** True for any IETF tag that denotes Russian (e.g. `ru`, `ru-RU`, `RU`). */
function isRussianLanguageCode(languageCode: string | undefined | null): boolean {
  return !!languageCode && languageCode.toLowerCase().startsWith("ru");
}

/**
 * Resolve the locale for a turn. Russian wins when EITHER the user's telegram
 * app language is Russian OR the message itself is written in Russian; otherwise
 * English.
 */
export function resolveLocale(input: {
  languageCode?: string | undefined | null;
  text?: string | undefined | null;
}): TLocale {
  if (isRussianLanguageCode(input.languageCode) || isRussianText(input.text)) {
    return "ru";
  }
  return DEFAULT_LOCALE;
}
