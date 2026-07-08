/**
 * Pure, locale-aware pluralization. No I18n catalog coupling, no I/O — just
 * CLDR plural-category selection via Intl.PluralRules, so it's trivially
 * unit-testable and correct across locales (e.g. "1 save" / "12 saves").
 */

/** A set of plural forms; `other` is mandatory (the CLDR fallback category). */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

/** Pick the correct plural form for `n` in `locale`, falling back to `other`. */
export function selectPlural(
  locale: string,
  n: number,
  forms: PluralForms,
): string {
  const category = new Intl.PluralRules(locale).select(n);
  return forms[category] ?? forms.other;
}

/**
 * Select the plural form and interpolate the count.
 * `{count}` in the chosen form is replaced with the localized number.
 */
export function formatPlural(
  locale: string,
  n: number,
  forms: PluralForms,
): string {
  const localizedCount = new Intl.NumberFormat(locale).format(n);
  return selectPlural(locale, n, forms).replace(/\{count\}/g, localizedCount);
}
