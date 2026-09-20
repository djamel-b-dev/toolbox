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
  active: string;
  activeToolId?: string;
  favoritesCount: number;
  onSelect: (id: string) => void;
  onSelectTool: (id: string) => void;
  onSelectFavorites: () => void;
  favoritesActive: boolean;
}

export function Rail({
  categories,
  active,
  activeToolId,
  favoritesCount,
  onSelect,
  onSelectTool,
  onSelectFavorites,
  favoritesActive,
}: RailProps) {
  return (
    <nav className="rail">
      <button type="button" className={"rail-item rail-favorites" + (favoritesActive ? " active" : "")} onClick={onSelectFavorites}>
        <span style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <Icon name="star" className="rail-favorites-icon" />
          Favoris
        </span>
        <span className="count">{favoritesCount}</span>
      </button>

      <div className="rail-label">Catégories</div>
      {categories.map((cat) => (
        <div key={cat.id} className="rail-group">
          <button
            type="button"
            className={"rail-item" + (cat.id === active && !favoritesActive ? " active" : "")}
            onClick={() => onSelect(cat.id)}
          >
            {cat.label} <span className="count">{cat.count}</span>
          </button>
          {cat.tools.length > 0 && (
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
      ))}
    </nav>
  );
}
