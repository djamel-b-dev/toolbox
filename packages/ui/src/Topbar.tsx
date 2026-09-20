import { Icon } from "./icons";

interface TopbarProps {
  onOpenPalette: () => void;
  onBrandClick: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function Topbar({ onOpenPalette, onBrandClick, theme, onToggleTheme }: TopbarProps) {
  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={onBrandClick} aria-label="Workbench, retour à l'accueil">
        <Icon name="gauge" className="brand-mark" />
        <span className="brand-name">Workbench</span>
      </button>
      <button type="button" className="search-trigger" onClick={onOpenPalette}>
        <Icon name="search" />
        <span>Rechercher un outil…</span>
        <kbd>⌘K</kbd>
      </button>
      <div className="topbar-actions">
        <button type="button" className="icon-btn" onClick={onToggleTheme} aria-label="Changer de thème">
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </div>
    </header>
  );
}
