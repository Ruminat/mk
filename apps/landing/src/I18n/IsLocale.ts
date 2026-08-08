import { LOCALES, type TLocale } from "@mooduck/core";

/** Narrow a route param to a supported locale. */
export function isLocale(value: string): value is TLocale {
  return (LOCALES as readonly string[]).includes(value);
}
