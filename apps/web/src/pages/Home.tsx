import { Link, useOutletContext } from "react-router-dom";
import { RecentCard, ToolCard } from "@toolbox/ui";
import type { AppContext } from "../Layout";

export default function Home() {
  const { favorites, toggleFavorite, recentIds, categoryFilter, openTool, tools, strings, toolText, categoryLabel } =
    useOutletContext<AppContext>();

  const visibleTools = categoryFilter === "all" ? tools : tools.filter((t) => t.category === categoryFilter);

  return (
    <>
      <div className="page-head">
        <h1>{strings.common.appName}</h1>
        <p className="lede">{strings.home.subtitle}</p>
        {favorites.size > 0 && (
          <Link to="/favoris" className="back-link" style={{ marginTop: "0.75rem" }}>
            {strings.home.viewFavorites(favorites.size)}
          </Link>
        )}
      </div>

      <div className="row-head">
        <h2>{strings.home.recentlyUsed}</h2>
      </div>
      <div className="strip">
        {recentIds.map((id, i) => {
          const tool = tools.find((t) => t.id === id);
          if (!tool) return null;
          return <RecentCard key={id} id={id} name={toolText(tool).name} index={i} onOpen={openTool} />;
        })}
      </div>

      <div className="row-head">
        <h2>{strings.home.allToolsHeading}</h2>
        <span className="hint">{strings.home.allToolsHint}</span>
      </div>
      <div className="grid">
        {visibleTools.map((tool) => (
          <ToolCard
            key={tool.id}
            id={tool.id}
            name={toolText(tool).name}
            category={categoryLabel(tool.category)}
            description={toolText(tool).description}
            index={tools.indexOf(tool)}
            favorite={favorites.has(tool.id)}
            onToggleFavorite={toggleFavorite}
            onOpen={openTool}
            favoriteAriaLabel={strings.toolCard.favoriteAriaLabel}
          />
        ))}
      </div>
    </>
  );
}
