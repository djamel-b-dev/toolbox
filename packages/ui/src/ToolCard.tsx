import { Icon } from "./icons";

interface ToolCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  index: number;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  favoriteAriaLabel: (name: string) => string;
}

export function ToolCard({
  id,
  name,
  category,
  description,
  index,
  favorite,
  onToggleFavorite,
  onOpen,
  favoriteAriaLabel,
}: ToolCardProps) {
  const idx = String(index + 1).padStart(2, "0");
  return (
    <div
      className="card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(id);
      }}
    >
      <div className="card-top">
        <span className="card-idx">MOD.{idx}</span>
        <button
          type="button"
          className={"fav-btn" + (favorite ? " is-fav" : "")}
          aria-label={favoriteAriaLabel(name)}
          aria-pressed={favorite}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(id);
          }}
        >
          <Icon name="star" />
        </button>
      </div>
      <span className="card-name">{name}</span>
      <span className="card-desc">{description}</span>
      <span className="card-cat">{category}</span>
    </div>
  );
}

interface RecentCardProps {
  id: string;
  name: string;
  index: number;
  onOpen: (id: string) => void;
}

export function RecentCard({ id, name, index, onOpen }: RecentCardProps) {
  const idx = String(index + 1).padStart(2, "0");
  return (
    <button type="button" className="strip-card" onClick={() => onOpen(id)}>
      <span className="idx">MOD.{idx}</span>
      <span className="name">{name}</span>
    </button>
  );
}
