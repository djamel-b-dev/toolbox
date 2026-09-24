import type { ThemeId } from "../useTheme";

export type Locale = "fr" | "en" | "es" | "ar" | "zh" | "ja";

export interface LocaleMeta {
  code: Locale;
  /** Name shown in the language switcher, written in that language itself. */
  nativeLabel: string;
  dir: "ltr" | "rtl";
  /** ISO 3166 country code of the flag shown next to the language in the switcher. */
  flag: string;
}

/**
 * Shape every locale file must implement. Adding a language means creating one
 * new file that satisfies this interface — TypeScript will flag any missing key.
 */
export interface Translations {
  common: {
    appName: string;
    localOnlyStatus: string;
  };
  topbar: {
    brandAriaLabel: string;
    searchPlaceholder: string;
    themeMenuAriaLabel: string;
    themes: Record<ThemeId, string>;
    languageSwitcherAriaLabel: string;
  };
  rail: {
    favorites: string;
    createTool: string;
    myCategories: string;
    categories: string;
    allTools: string;
    expand: (label: string) => string;
    collapse: (label: string) => string;
  };
  palette: {
    ariaLabel: string;
    inputPlaceholder: string;
    noResults: string;
    toolsGroup: string;
    previewOnlySuffix: string;
  };
  toolCard: {
    favoriteAriaLabel: (name: string) => string;
  };
  home: {
    subtitle: string;
    viewFavorites: (count: number) => string;
    recentlyUsed: string;
    allToolsHeading: string;
    allToolsHint: string;
  };
  favorites: {
    title: string;
    subtitle: string;
    empty: string;
    browseAll: string;
  };
  createTool: {
    titleNew: string;
    titleEdit: string;
    intro: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    categoryLabel: string;
    categoryExisting: string;
    categoryNew: string;
    chooseLabel: string;
    newCategoryLabel: string;
    newCategoryPlaceholder: string;
    codeLabel: string;
    defaultCode: string;
    livePreview: string;
    testInputLabel: string;
    testInputDefault: string;
    outputLabel: string;
    saveNew: string;
    saveEdit: string;
    errorNameRequired: string;
    errorCategoryRequired: string;
    errorCodeRequired: string;
    errorCategoryExists: string;
    runtimeErrorFallback: string;
  };
  toolPage: {
    notFound: string;
    notReady: string;
    loading: string;
    edit: string;
    delete: string;
    deleteConfirm: (name: string) => string;
  };
}
