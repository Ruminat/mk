/**
 * The three Russian plural forms a count can take, in the order the rule below
 * selects them: 1 день / 2 дня / 5 дней.
 */
export type TRussianPluralForms = {
  one: string;
  few: string;
  many: string;
};

/**
 * Picks the Russian plural form for `count`.
 *
 * Written out rather than delegated to `Intl.PluralRules`: the bot can run on a
 * small-icu Node build, where locale data is trimmed and `Intl` quietly falls
 * back to English rules — which would give "2 день". The rule itself is fixed
 * and tiny, so spelling it out costs less than depending on the runtime's ICU.
 *
 * @example
 * pluralizeRu(1, { one: "день", few: "дня", many: "дней" }) → "день"
 * pluralizeRu(3, ...) → "дня"
 * pluralizeRu(11, ...) → "дней"   // the teens are the exception to `% 10`
 */
export function pluralizeRu(count: number, forms: TRussianPluralForms): string {
  const lastTwo = Math.abs(count) % 100;
  const last = lastTwo % 10;

  // 11–14 look like 1–4 by their last digit but take the "many" form.
  if (lastTwo >= 11 && lastTwo <= 14) return forms.many;
  if (last === 1) return forms.one;
  if (last >= 2 && last <= 4) return forms.few;
  return forms.many;
}

/** `pluralizeRu` with the count in front: `countRu(5, …)` → "5 дней". */
export function countRu(count: number, forms: TRussianPluralForms): string {
  return `${count} ${pluralizeRu(count, forms)}`;
}

/** Shared noun tables, so the bot and the web decline the same words. */
export const RU_PLURALS = {
  day: { one: "день", few: "дня", many: "дней" },
  hour: { one: "час", few: "часа", many: "часов" },
  minute: { one: "минута", few: "минуты", many: "минут" },
} as const satisfies Record<string, TRussianPluralForms>;
