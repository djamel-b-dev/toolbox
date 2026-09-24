import type { Locale, LocaleMeta, Translations } from "./types";
import { fr } from "./fr";
import { en } from "./en";
import { es } from "./es";
import { ar } from "./ar";
import { zh } from "./zh";
import { ja } from "./ja";

/**
 * Every supported language in one place. To add a language: create
 * `<code>.ts` implementing `Translations` (copy `en.ts` as a starting point —
 * TypeScript will flag any key you miss), then add one entry here, with a
 * `flag` that `packages/ui/src/Flag.tsx` knows how to draw.
 */
export const LOCALES: Record<Locale, { meta: LocaleMeta; translations: Translations }> = {
  fr: { meta: { code: "fr", nativeLabel: "Français", dir: "ltr", flag: "fr" }, translations: fr },
  en: { meta: { code: "en", nativeLabel: "English", dir: "ltr", flag: "gb" }, translations: en },
  es: { meta: { code: "es", nativeLabel: "Español", dir: "ltr", flag: "es" }, translations: es },
  ar: { meta: { code: "ar", nativeLabel: "العربية", dir: "rtl", flag: "ae" }, translations: ar },
  zh: { meta: { code: "zh", nativeLabel: "中文（简体）", dir: "ltr", flag: "cn" }, translations: zh },
  ja: { meta: { code: "ja", nativeLabel: "日本語", dir: "ltr", flag: "jp" }, translations: ja },
};

export const LOCALE_CODES = Object.keys(LOCALES) as Locale[];

export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return value in LOCALES;
}
