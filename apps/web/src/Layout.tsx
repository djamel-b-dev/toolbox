import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CommandPalette, IconSprite, Rail, Topbar } from "@toolbox/ui";
import type { PaletteTool, RailCategory } from "@toolbox/ui";
import { useCommandPalette, useFavorites, useTheme } from "@toolbox/core";
import type { CustomTool, CustomToolInput } from "@toolbox/core";
import { CATEGORIES } from "@toolbox/tools";
import type { ToolDefinition } from "@toolbox/tools";
import { useAllTools } from "./useAllTools";

export interface AppContext {
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  recentIds: string[];
  registerVisit: (id: string) => void;
  categoryFilter: string;
  setCategoryFilter: (id: string) => void;
  openTool: (id: string) => void;
  tools: ToolDefinition[];
  customTools: CustomTool[];
  addCustomTool: (input: CustomToolInput) => string;
  updateCustomTool: (id: string, patch: CustomToolInput) => void;
  removeCustomTool: (id: string) => void;
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { open, openPalette, close } = useCommandPalette();
  const { favorites, toggleFavorite } = useFavorites();
  const { tools, customTools, addTool, updateTool, removeTool } = useAllTools();
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
      const tool = tools.find((t) => t.id === id);
      if (!tool || tool.status !== "ready") return;
      registerVisit(id);
      navigate(`/tools/${id}`);
    },
    [tools, navigate, registerVisit],
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
    const all: RailCategory = { id: "all", label: "Tous les outils", count: tools.length, tools: [] };
    const cats = CATEGORIES.map((c) => ({
      id: c,
      label: c,
      count: tools.filter((t) => t.category === c).length,
      tools: tools.filter((t) => t.category === c).map((t) => ({ id: t.id, name: t.name })),
    }));
    return [all, ...cats];
  }, [tools]);

  const customRailCategories: RailCategory[] = useMemo(() => {
    const names = Array.from(
      new Set(customTools.filter((t) => t.isNewCategory && !CATEGORIES.includes(t.category)).map((t) => t.category)),
    );
    return names.map((c) => ({
      id: c,
      label: c,
      count: tools.filter((t) => t.category === c).length,
      tools: tools.filter((t) => t.category === c).map((t) => ({ id: t.id, name: t.name })),
    }));
  }, [customTools, tools]);

  const paletteTools: PaletteTool[] = useMemo(
    () => tools.map((t) => ({ id: t.id, name: t.name, category: t.category, ready: t.status === "ready" })),
    [tools],
  );

  function handleRailSelect(id: string) {
    setCategoryFilter(id);
    navigate("/");
  }

  const activeToolId = location.pathname.match(/^\/tools\/(.+)$/)?.[1];
  const favoritesActive = location.pathname === "/favoris";
  const createActive = location.pathname.startsWith("/creer-outil");
  // On a tool page, the rail must highlight that tool's real category — not whatever
  // category filter was last clicked, which could belong to a different section entirely.
  const activeCategory = activeToolId ? tools.find((t) => t.id === activeToolId)?.category ?? categoryFilter : categoryFilter;

  const context: AppContext = {
    favorites,
    toggleFavorite,
    recentIds,
    registerVisit,
    categoryFilter,
    setCategoryFilter,
    openTool,
    tools,
    customTools,
    addCustomTool: addTool,
    updateCustomTool: updateTool,
    removeCustomTool: removeTool,
  };

  return (
    <div className="app">
      <IconSprite />
      <Topbar onOpenPalette={openPalette} onBrandClick={goHome} theme={theme} onToggleTheme={toggleTheme} />
      <div className="shell">
        <Rail
          categories={railCategories}
          customCategories={customRailCategories}
          active={activeCategory}
          activeToolId={activeToolId}
          favoritesCount={favorites.size}
          onSelect={handleRailSelect}
          onSelectTool={openTool}
          onSelectFavorites={() => navigate("/favoris")}
          onCreateTool={() => navigate("/creer-outil")}
          favoritesActive={favoritesActive}
          createActive={createActive}
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
