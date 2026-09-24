import { Icon } from "./icons";
import { LanguageMenu } from "./LanguageMenu";
import { ThemeMenu } from "./ThemeMenu";

interface TopbarProps {
  onOpenPalette: () => void;
  onBrandClick: () => void;
  theme: string;
  themes: { value: string; label: string }[];
  onChangeTheme: (value: string) => void;
  brandAriaLabel: string;
  searchPlaceholder: string;
  themeMenuAriaLabel: string;
  languageSwitcherAriaLabel: string;
  locale: string;
  locales: { code: string; label: string; flag: string }[];
  onChangeLocale: (code: string) => void;
}

export function Topbar({
  onOpenPalette,
  onBrandClick,
  theme,
  themes,
  onChangeTheme,
  brandAriaLabel,
  searchPlaceholder,
  themeMenuAriaLabel,
  languageSwitcherAriaLabel,
  locale,
  locales,
  onChangeLocale,
}: TopbarProps) {
  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={onBrandClick} aria-label={brandAriaLabel}>
        <Icon name="gauge" className="brand-mark" />
        <span className="brand-name">Toolbox</span>
      </button>
      <button type="button" className="search-trigger" onClick={onOpenPalette}>
        <Icon name="search" />
        <span>{searchPlaceholder}</span>
        <kbd>⌘K</kbd>
      </button>
      <div className="topbar-actions">
        <LanguageMenu value={locale} options={locales} onChange={onChangeLocale} ariaLabel={languageSwitcherAriaLabel} />
        <ThemeMenu value={theme} options={themes} onChange={onChangeTheme} ariaLabel={themeMenuAriaLabel} />
      </div>
    </header>
  );
}
