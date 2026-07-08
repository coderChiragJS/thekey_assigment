export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

export function selectPlural(
  locale: string,
  n: number,
  forms: PluralForms,
): string {
  const category = new Intl.PluralRules(locale).select(n);
  return forms[category] ?? forms.other;
}

export function formatPlural(
  locale: string,
  n: number,
  forms: PluralForms,
): string {
  const localizedCount = new Intl.NumberFormat(locale).format(n);
  return selectPlural(locale, n, forms).replace(/\{count\}/g, localizedCount);
}
