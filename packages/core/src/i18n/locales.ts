import type { Locale, LocaleMeta, Translations } from "./types";
import { fr } from "./fr";
import { en } from "./en";
import { ar } from "./ar";

/**
 * Every supported language in one place. To add a language: create
 * `<code>.ts` implementing `Translations` (copy `en.ts` as a starting point —
 * TypeScript will flag any key you miss), then add one entry here.
 */
export const LOCALES: Record<Locale, { meta: LocaleMeta; translations: Translations }> = {
  fr: { meta: { code: "fr", nativeLabel: "Français", dir: "ltr" }, translations: fr },
  en: { meta: { code: "en", nativeLabel: "English", dir: "ltr" }, translations: en },
  ar: { meta: { code: "ar", nativeLabel: "العربية", dir: "rtl" }, translations: ar },
};

export const LOCALE_CODES = Object.keys(LOCALES) as Locale[];

export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return value in LOCALES;
}
