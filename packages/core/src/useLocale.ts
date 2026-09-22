import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "./i18n/locales";
import type { Locale } from "./i18n/types";

const STORAGE_KEY = "toolbox:locale";

function readStored(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isLocale(raw)) return raw;
  } catch {
    /* localStorage unavailable (private mode) — fall through to browser detection */
  }
  const browserLang = navigator.language?.slice(0, 2);
  if (browserLang && isLocale(browserLang)) return browserLang;
  return DEFAULT_LOCALE;
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(() => (typeof document !== "undefined" ? readStored() : DEFAULT_LOCALE));

  // Keep <html lang>/[dir] in sync so RTL layout and screen readers pick up the
  // current language without a reload.
  useEffect(() => {
    const { dir } = LOCALES[locale].meta;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* localStorage may be unavailable — selection just won't persist */
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  return { locale, setLocale, t: LOCALES[locale].translations, dir: LOCALES[locale].meta.dir };
}
