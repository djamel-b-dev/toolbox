import { Link, useOutletContext } from "react-router-dom";
import { ToolCard } from "@toolbox/ui";
import type { AppContext } from "../Layout";

export default function Favorites() {
  const { favorites, toggleFavorite, openTool, tools, strings, toolText, categoryLabel } = useOutletContext<AppContext>();
  const favoriteTools = tools.filter((t) => favorites.has(t.id));

  return (
    <>
      <div className="page-head">
        <h1>{strings.favorites.title}</h1>
        <p className="lede">{strings.favorites.subtitle}</p>
      </div>

      {favoriteTools.length === 0 ? (
        <div className="empty-state">
          {strings.favorites.empty}
          <br />
          <Link to="/" className="back-link" style={{ marginTop: "0.75rem", justifyContent: "center" }}>
            {strings.favorites.browseAll}
          </Link>
        </div>
      ) : (
        <div className="grid">
          {favoriteTools.map((tool) => (
            <ToolCard
              key={tool.id}
              id={tool.id}
              name={toolText(tool).name}
              category={categoryLabel(tool.category)}
              description={toolText(tool).description}
              index={tools.indexOf(tool)}
              favorite
              onToggleFavorite={toggleFavorite}
              onOpen={openTool}
              favoriteAriaLabel={strings.toolCard.favoriteAriaLabel}
            />
          ))}
        </div>
      )}
    </>
  );
}
