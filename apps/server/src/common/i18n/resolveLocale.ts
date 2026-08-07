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
 * Resolve the locale for a turn. Russian wins when ANY of the signals says so:
 * the user's telegram app language, the message itself, or anything they said
 * earlier (`previousTexts`) — otherwise English.
 *
 * The last one is what keeps a conversation in one language: a bare "7" carries
 * no language of its own, but "5 как-то грустно" a moment earlier does.
 */
export function resolveLocale(input: {
  languageCode?: string | undefined | null;
  text?: string | undefined | null;
  /** What the user said before, in any order — the conversation's memory. */
  previousTexts?: readonly (string | undefined | null)[];
}): TLocale {
  if (
    isRussianLanguageCode(input.languageCode) ||
    isRussianText(input.text) ||
    input.previousTexts?.some((previous) => isRussianText(previous))
  ) {
    return "ru";
  }
  return DEFAULT_LOCALE;
}
