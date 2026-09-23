import type { Translations } from "./types";

export const en: Translations = {
  common: {
    appName: "Toolbox",
    localOnlyStatus: "Computed locally — no network request",
  },
  topbar: {
    brandAriaLabel: "Toolbox, back to home",
    searchPlaceholder: "Search for a tool…",
    themeMenuAriaLabel: "Choose a theme",
    themes: { light: "Light", dark: "Dark", paper: "Paper", retro: "Retro arcade", web3: "Web3 neon" },
    languageSwitcherAriaLabel: "Change language",
  },
  rail: {
    favorites: "Favorites",
    createTool: "Create a tool",
    myCategories: "My categories",
    categories: "Categories",
    allTools: "All tools",
    expand: (label) => `Expand ${label}`,
    collapse: (label) => `Collapse ${label}`,
  },
  palette: {
    ariaLabel: "Command palette",
    inputPlaceholder: "Search for a tool, e.g. “hash”, “json”…",
    noResults: "No tool matches.",
    toolsGroup: "Tools",
    previewOnlySuffix: " · preview only",
  },
  toolCard: {
    favoriteAriaLabel: (name) => `Add ${name} to favorites`,
  },
  home: {
    subtitle: "Developer tools that run entirely on your machine. Nothing you paste here leaves the tab.",
    viewFavorites: (count) => `View my ${count} favorite${count > 1 ? "s" : ""} →`,
    recentlyUsed: "Recently used",
    allToolsHeading: "All tools",
    allToolsHint: "Every tool is fully functional.",
  },
  favorites: {
    title: "Favorites",
    subtitle: "The tools you use most, within reach.",
    empty: "No favorites yet — click a tool's star to add it here.",
    browseAll: "Browse all tools →",
  },
  createTool: {
    titleNew: "Create a tool",
    titleEdit: "Edit tool",
    intro:
      "Write a JavaScript function that turns an input into an output. This code runs directly in your browser, with the same permissions as the page — only use code you wrote yourself or trust.",
    nameLabel: "Name",
    namePlaceholder: "My converter",
    descriptionLabel: "Description",
    descriptionPlaceholder: "What the tool does, in one sentence.",
    categoryLabel: "Category",
    categoryExisting: "Existing",
    categoryNew: "New",
    chooseLabel: "Choose",
    newCategoryLabel: "New category name",
    newCategoryPlaceholder: "My tools",
    codeLabel: "Code",
    defaultCode: `// "input" holds the text from the input field.
// Return the string to display as output.
return input.toUpperCase();`,
    livePreview: "Live preview",
    testInputLabel: "Test input",
    testInputDefault: "Hello, Toolbox 👋",
    outputLabel: "Output",
    saveNew: "Create tool",
    saveEdit: "Save changes",
    errorNameRequired: "Name is required.",
    errorCategoryRequired: "Choose or name a category.",
    errorCodeRequired: "Code can't be empty.",
    errorCategoryExists:
      "This category name already exists among the built-in categories — pick another one, or select “Existing” above.",
    runtimeErrorFallback: "This code threw an error.",
  },
  toolPage: {
    notFound: "This tool doesn't exist.",
    notReady: "This tool isn't part of this prototype yet.",
    loading: "Loading tool…",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: (name) => `Permanently delete the tool “${name}”?`,
  },
};
