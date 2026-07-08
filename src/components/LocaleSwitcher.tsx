"use client";

import { useI18n } from "@/i18n/context";
import { localeLabels, locales, type Locale } from "@/i18n";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="control">
      {t("toolbar.language")}
      <select
        className="select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("toolbar.language")}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeLabels[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
