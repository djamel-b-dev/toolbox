import { useState } from "react";
import { Icon } from "./icons";

export interface RailTool {
  id: string;
  name: string;
}

export interface RailCategory {
  id: string;
  label: string;
  count: number;
  tools: RailTool[];
}

interface RailProps {
  categories: RailCategory[];
  customCategories: RailCategory[];
  active: string;
  activeToolId?: string;
  favoritesCount: number;
  onSelect: (id: string) => void;
  onSelectTool: (id: string) => void;
  onSelectFavorites: () => void;
  onCreateTool: () => void;
  favoritesActive: boolean;
  createActive: boolean;
}

export function Rail({
  categories,
  customCategories,
  active,
  activeToolId,
  favoritesCount,
  onSelect,
  onSelectTool,
  onSelectFavorites,
  onCreateTool,
  favoritesActive,
  createActive,
}: RailProps) {
  // Collapsed by default; the category holding the tool open on first load starts expanded.
  // Only one category can be open at a time — opening another closes the previous one.
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const initial = [...customCategories, ...categories].find((c) => c.tools.some((t) => t.id === activeToolId));
    return initial ? initial.id : null;
  });

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function selectCategory(cat: RailCategory) {
    onSelect(cat.id);
    if (cat.tools.length > 0) setExpandedId(cat.id);
  }

  function renderCategory(cat: RailCategory) {
    const isOpen = expandedId === cat.id;
    return (
      <div key={cat.id} className="rail-group">
        <div className="rail-category-row">
          <button
            type="button"
            className={"rail-item" + (cat.id === active && !favoritesActive && !createActive ? " active" : "")}
            onClick={() => selectCategory(cat)}
          >
            {cat.label} <span className="count">{cat.count}</span>
          </button>
          {cat.tools.length > 0 && (
            <button
              type="button"
              className="rail-chevron"
              aria-expanded={isOpen}
              aria-label={isOpen ? `Réduire ${cat.label}` : `Développer ${cat.label}`}
              onClick={() => toggle(cat.id)}
            >
              <Icon name="chevron" className={isOpen ? "is-open" : undefined} />
            </button>
          )}
        </div>
        {isOpen && cat.tools.length > 0 && (
          <div className="rail-tools">
            {cat.tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={"rail-tool-link" + (tool.id === activeToolId ? " active" : "")}
                onClick={() => onSelectTool(tool.id)}
              >
                {tool.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <nav className="rail">
      <button type="button" className={"rail-item rail-favorites" + (favoritesActive ? " active" : "")} onClick={onSelectFavorites}>
        <span style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <Icon name="star" className="rail-favorites-icon" />
          Favoris
        </span>
        <span className="count">{favoritesCount}</span>
      </button>

      <button type="button" className={"rail-item rail-create" + (createActive ? " active" : "")} onClick={onCreateTool}>
        <span style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <Icon name="plus" />
          Créer un outil
        </span>
      </button>

      {customCategories.length > 0 && (
        <>
          <div className="rail-label">Mes catégories</div>
          {customCategories.map(renderCategory)}
        </>
      )}

      <div className="rail-label">Catégories</div>
      {categories.map(renderCategory)}
    </nav>
  );
}
