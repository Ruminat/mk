import type { TLocale } from "./locale";
import { enPrompts } from "./promptCatalogs/en";
import type { TPromptCatalog } from "./promptCatalogs/promptCatalog";
import { ruPrompts } from "./promptCatalogs/ru";

const catalogs: Record<TLocale, TPromptCatalog> = { en: enPrompts, ru: ruPrompts };

/** Localized AI prompt catalog for a locale. Usage: `prompts(locale).moodPrompt(...)`. */
export function prompts(locale: TLocale): TPromptCatalog {
  return catalogs[locale];
}
