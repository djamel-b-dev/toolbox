import { Icon } from "./icons";
import { SegmentedControl } from "./SegmentedControl";

interface TopbarProps {
  onOpenPalette: () => void;
  onBrandClick: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  brandAriaLabel: string;
  searchPlaceholder: string;
  themeToggleAriaLabel: string;
  languageSwitcherAriaLabel: string;
  locale: string;
  locales: { code: string; label: string }[];
  onChangeLocale: (code: string) => void;
}

export function Topbar({
  onOpenPalette,
  onBrandClick,
  theme,
  onToggleTheme,
  brandAriaLabel,
  searchPlaceholder,
  themeToggleAriaLabel,
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
        <div role="group" aria-label={languageSwitcherAriaLabel}>
          <SegmentedControl value={locale} onChange={onChangeLocale} options={locales.map((l) => ({ value: l.code, label: l.label }))} />
        </div>
        <button type="button" className="icon-btn" onClick={onToggleTheme} aria-label={themeToggleAriaLabel}>
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </div>
    </header>
  );
}
