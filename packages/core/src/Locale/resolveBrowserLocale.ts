import { DEFAULT_LOCALE, LOCALES, type TLocale } from "./locale";

/**
 * Pick a supported locale from the browser's ordered language tags
 * (`navigator.languages`). Each tag is reduced to its primary subtag
 * (`ru-RU` → `ru`, `EN` → `en`); the first tag that matches a supported
 * locale wins. An unsupported tag is skipped rather than treated as the
 * default, so `["de", "ru"]` resolves to `ru`, not `en`.
 */
export function resolveBrowserLocale(languageTags: readonly string[]): TLocale {
  for (const tag of languageTags) {
    const primary = tag.toLowerCase().split("-")[0];
    const match = LOCALES.find((locale) => locale === primary);
    if (match) {
      return match;
    }
  }
  return DEFAULT_LOCALE;
}
