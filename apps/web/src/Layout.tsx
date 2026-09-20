import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CommandPalette, IconSprite, Rail, Topbar } from "@toolbox/ui";
import type { PaletteTool, RailCategory } from "@toolbox/ui";
import { useCommandPalette, useFavorites, useTheme } from "@toolbox/core";
import { CATEGORIES, TOOLS } from "@toolbox/tools";

export interface AppContext {
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  recentIds: string[];
  registerVisit: (id: string) => void;
  categoryFilter: string;
  setCategoryFilter: (id: string) => void;
  openTool: (id: string) => void;
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { open, openPalette, close } = useCommandPalette();
  const { favorites, toggleFavorite } = useFavorites();
  const [recentIds, setRecentIds] = useState<string[]>(["base64", "hash", "uuid"]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const registerVisit = useCallback((id: string) => {
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 3));
  }, []);

  function goHome() {
    setCategoryFilter("all");
    navigate("/");
  }

  const openTool = useCallback(
    (id: string) => {
      const tool = TOOLS.find((t) => t.id === id);
      if (!tool || tool.status !== "ready") return;
      registerVisit(id);
      navigate(`/tools/${id}`);
    },
    [navigate, registerVisit],
  );

  // Land on Favoris when the app is opened fresh and favorites already exist.
  // Deliberately empty deps: this should fire once, on the initial page load only —
  // not every time the user clicks back to "/", which must always show the full catalog.
  useEffect(() => {
    if (location.pathname === "/" && favorites.size > 0) {
      navigate("/favoris", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const railCategories: RailCategory[] = useMemo(() => {
    const all: RailCategory = { id: "all", label: "Tous les outils", count: TOOLS.length, tools: [] };
    const cats = CATEGORIES.map((c) => ({
      id: c,
      label: c,
      count: TOOLS.filter((t) => t.category === c).length,
      tools: TOOLS.filter((t) => t.category === c).map((t) => ({ id: t.id, name: t.name })),
    }));
    return [all, ...cats];
  }, []);

  const paletteTools: PaletteTool[] = useMemo(
    () => TOOLS.map((t) => ({ id: t.id, name: t.name, category: t.category, ready: t.status === "ready" })),
    [],
  );

  function handleRailSelect(id: string) {
    setCategoryFilter(id);
    navigate("/");
  }

  const activeToolId = location.pathname.match(/^\/tools\/(.+)$/)?.[1];
  const favoritesActive = location.pathname === "/favoris";

  const context: AppContext = {
    favorites,
    toggleFavorite,
    recentIds,
    registerVisit,
    categoryFilter,
    setCategoryFilter,
    openTool,
  };

  return (
    <div className="app">
      <IconSprite />
      <Topbar onOpenPalette={openPalette} onBrandClick={goHome} theme={theme} onToggleTheme={toggleTheme} />
      <div className="shell">
        <Rail
          categories={railCategories}
          active={categoryFilter}
          activeToolId={activeToolId}
          favoritesCount={favorites.size}
          onSelect={handleRailSelect}
          onSelectTool={openTool}
          onSelectFavorites={() => navigate("/favoris")}
          favoritesActive={favoritesActive}
        />
        <main className="content">
          <div className="content-inner">
            <Outlet context={context} />
          </div>
        </main>
      </div>
      <CommandPalette
        open={open}
        tools={paletteTools}
        onClose={close}
        onSelect={(id) => {
          close();
          openTool(id);
        }}
      />
    </div>
  );
}
