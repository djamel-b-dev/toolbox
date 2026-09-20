import { Link, useOutletContext } from "react-router-dom";
import { ToolCard } from "@toolbox/ui";
import { TOOLS } from "@toolbox/tools";
import type { AppContext } from "../Layout";

export default function Favorites() {
  const { favorites, toggleFavorite, openTool } = useOutletContext<AppContext>();
  const favoriteTools = TOOLS.filter((t) => favorites.has(t.id));

  return (
    <>
      <div className="page-head">
        <h1>Favoris</h1>
        <p className="lede">Les outils que vous utilisez le plus, à portée de main.</p>
      </div>

      {favoriteTools.length === 0 ? (
        <div className="empty-state">
          Aucun favori pour l'instant — cliquez sur l'étoile d'un outil pour l'ajouter ici.
          <br />
          <Link to="/" className="back-link" style={{ marginTop: "0.75rem", justifyContent: "center" }}>
            Parcourir tous les outils →
          </Link>
        </div>
      ) : (
        <div className="grid">
          {favoriteTools.map((tool) => (
            <ToolCard
              key={tool.id}
              id={tool.id}
              name={tool.name}
              category={tool.category}
              description={tool.description}
              index={TOOLS.indexOf(tool)}
              favorite
              onToggleFavorite={toggleFavorite}
              onOpen={openTool}
            />
          ))}
        </div>
      )}
    </>
  );
}
