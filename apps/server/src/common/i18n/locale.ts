/** Supported locales. English is primary; Russian is the secondary locale. */
export type TLocale = "en" | "ru";

export const LOCALES: readonly TLocale[] = ["en", "ru"];

/** Default when neither the telegram language nor the message text is Russian. */
export const DEFAULT_LOCALE: TLocale = "en";
