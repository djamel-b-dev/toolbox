import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CommandPalette, IconSprite, Rail, Topbar } from "@toolbox/ui";
import type { PaletteTool, RailCategory } from "@toolbox/ui";
import { LOCALES, useCommandPalette, useFavorites, useLocale, useTheme } from "@toolbox/core";
import type { CustomTool, CustomToolInput, Locale, Translations } from "@toolbox/core";
import { CATEGORIES, getCategoryLabel, getToolText } from "@toolbox/tools";
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
  locale: Locale;
  strings: Translations;
  toolText: (tool: Pick<ToolDefinition, "id" | "name" | "description">) => { name: string; description: string };
  categoryLabel: (category: string) => string;
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t: strings } = useLocale();
  const { open, openPalette, close } = useCommandPalette();
  const { favorites, toggleFavorite } = useFavorites();
  const { tools, customTools, addTool, updateTool, removeTool } = useAllTools();
  const [recentIds, setRecentIds] = useState<string[]>(["base64", "hash", "uuid"]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const toolText = useCallback((tool: Pick<ToolDefinition, "id" | "name" | "description">) => getToolText(tool, locale), [locale]);
  const categoryLabel = useCallback((category: string) => getCategoryLabel(category, locale), [locale]);

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
    const all: RailCategory = { id: "all", label: strings.rail.allTools, count: tools.length, tools: [] };
    const cats = CATEGORIES.map((c) => ({
      id: c,
      label: categoryLabel(c),
      count: tools.filter((t) => t.category === c).length,
      tools: tools.filter((t) => t.category === c).map((t) => ({ id: t.id, name: toolText(t).name })),
    }));
    return [all, ...cats];
  }, [tools, strings, categoryLabel, toolText]);

  const customRailCategories: RailCategory[] = useMemo(() => {
    const names = Array.from(
      new Set(customTools.filter((t) => t.isNewCategory && !CATEGORIES.includes(t.category)).map((t) => t.category)),
    );
    return names.map((c) => ({
      id: c,
      label: c,
      count: tools.filter((t) => t.category === c).length,
      tools: tools.filter((t) => t.category === c).map((t) => ({ id: t.id, name: toolText(t).name })),
    }));
  }, [customTools, tools, toolText]);

  const paletteTools: PaletteTool[] = useMemo(
    () =>
      tools.map((t) => ({ id: t.id, name: toolText(t).name, category: categoryLabel(t.category), ready: t.status === "ready" })),
    [tools, toolText, categoryLabel],
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
    locale,
    strings,
    toolText,
    categoryLabel,
  };

  return (
    <div className="app">
      <IconSprite />
      <Topbar
        onOpenPalette={openPalette}
        onBrandClick={goHome}
        theme={theme}
        onToggleTheme={toggleTheme}
        brandAriaLabel={strings.topbar.brandAriaLabel}
        searchPlaceholder={strings.topbar.searchPlaceholder}
        themeToggleAriaLabel={strings.topbar.themeToggleAriaLabel}
        languageSwitcherAriaLabel={strings.topbar.languageSwitcherAriaLabel}
        locale={locale}
        locales={Object.values(LOCALES).map((l) => ({ code: l.meta.code, label: l.meta.code.toUpperCase() }))}
        onChangeLocale={(code) => setLocale(code as Locale)}
      />
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
          favoritesLabel={strings.rail.favorites}
          createToolLabel={strings.rail.createTool}
          myCategoriesLabel={strings.rail.myCategories}
          categoriesLabel={strings.rail.categories}
          expandLabel={strings.rail.expand}
          collapseLabel={strings.rail.collapse}
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
        ariaLabel={strings.palette.ariaLabel}
        inputPlaceholder={strings.palette.inputPlaceholder}
        noResultsLabel={strings.palette.noResults}
        toolsGroupLabel={strings.palette.toolsGroup}
        previewOnlySuffix={strings.palette.previewOnlySuffix}
      />
    </div>
  );
}
