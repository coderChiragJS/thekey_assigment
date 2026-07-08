import { formatPlural } from "@/domain/plural";
import { enMessages, enPlurals } from "./en";
import { esMessages, esPlurals } from "./es";

export const catalogs = {
  en: { messages: enMessages, plurals: enPlurals },
  es: { messages: esMessages, plurals: esPlurals },
} as const;

export type Locale = keyof typeof catalogs;
export type MessageKey = keyof typeof enMessages;

export const locales = Object.keys(catalogs) as Locale[];
export const defaultLocale: Locale = "en";
export const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Vars,
): string {
  const template = catalogs[locale].messages[key] ?? enMessages[key] ?? key;
  return interpolate(template, vars);
}

export function translateCount(
  locale: Locale,
  key: string,
  count: number,
): string {
  const forms = catalogs[locale].plurals[key] ?? enPlurals[key];
  if (!forms) return String(count);
  return formatPlural(locale, count, forms);
}

export function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
