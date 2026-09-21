import { Link, useOutletContext } from "react-router-dom";
import { RecentCard, ToolCard } from "@toolbox/ui";
import type { AppContext } from "../Layout";

export default function Home() {
  const { favorites, toggleFavorite, recentIds, categoryFilter, openTool, tools } = useOutletContext<AppContext>();

  const visibleTools = categoryFilter === "all" ? tools : tools.filter((t) => t.category === categoryFilter);

  return (
    <>
      <div className="page-head">
        <h1>Workbench</h1>
        <p className="lede">
          Des outils pour développeurs qui tournent entièrement sur votre machine. Rien de ce que vous collez ici ne
          quitte l'onglet.
        </p>
        {favorites.size > 0 && (
          <Link to="/favoris" className="back-link" style={{ marginTop: "0.75rem" }}>
            Voir mes {favorites.size} favori{favorites.size > 1 ? "s" : ""} →
          </Link>
        )}
      </div>

      <div className="row-head">
        <h2>Récemment utilisés</h2>
      </div>
      <div className="strip">
        {recentIds.map((id, i) => {
          const tool = tools.find((t) => t.id === id);
          if (!tool) return null;
          return <RecentCard key={id} id={id} name={tool.name} index={i} onOpen={openTool} />;
        })}
      </div>

      <div className="row-head">
        <h2>Tous les outils</h2>
        <span className="hint">Tous les outils sont pleinement fonctionnels.</span>
      </div>
      <div className="grid">
        {visibleTools.map((tool) => (
          <ToolCard
            key={tool.id}
            id={tool.id}
            name={tool.name}
            category={tool.category}
            description={tool.description}
            index={tools.indexOf(tool)}
            favorite={favorites.has(tool.id)}
            onToggleFavorite={toggleFavorite}
            onOpen={openTool}
          />
        ))}
      </div>
    </>
  );
}
