/** Supported locales. English is primary; Russian is the secondary locale. */
export type TLocale = "en" | "ru";

export const LOCALES: readonly TLocale[] = ["en", "ru"];

/** Default when no signal (browser, message text, telegram language) says Russian. */
export const DEFAULT_LOCALE: TLocale = "en";
