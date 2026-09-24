import type { Translations } from "./types";

export const fr: Translations = {
  common: {
    appName: "Toolbox",
    localOnlyStatus: "Calculé en local — aucune requête réseau",
  },
  topbar: {
    brandAriaLabel: "Toolbox, retour à l'accueil",
    searchPlaceholder: "Rechercher un outil…",
    themeMenuAriaLabel: "Choisir un thème",
    themes: {
      light: "Clair",
      dark: "Sombre",
      paper: "Papier",
      sakura: "Sakura",
      arctic: "Arctique",
      terminal: "Terminal",
      synthwave: "Synthwave",
      retro: "Rétro arcade",
      web3: "Web3 néon",
    },
    languageSwitcherAriaLabel: "Changer de langue",
  },
  rail: {
    favorites: "Favoris",
    createTool: "Créer un outil",
    myCategories: "Mes catégories",
    categories: "Catégories",
    allTools: "Tous les outils",
    expand: (label) => `Développer ${label}`,
    collapse: (label) => `Réduire ${label}`,
  },
  palette: {
    ariaLabel: "Palette de commandes",
    inputPlaceholder: "Rechercher un outil, ex. « hash », « json »…",
    noResults: "Aucun outil ne correspond.",
    toolsGroup: "Outils",
    previewOnlySuffix: " · aperçu uniquement",
  },
  toolCard: {
    favoriteAriaLabel: (name) => `Ajouter ${name} aux favoris`,
  },
  home: {
    subtitle:
      "Des outils pour développeurs qui tournent entièrement sur votre machine. Rien de ce que vous collez ici ne quitte l'onglet.",
    viewFavorites: (count) => `Voir mes ${count} favori${count > 1 ? "s" : ""} →`,
    recentlyUsed: "Récemment utilisés",
    allToolsHeading: "Tous les outils",
    allToolsHint: "Tous les outils sont pleinement fonctionnels.",
  },
  favorites: {
    title: "Favoris",
    subtitle: "Les outils que vous utilisez le plus, à portée de main.",
    empty: "Aucun favori pour l'instant — cliquez sur l'étoile d'un outil pour l'ajouter ici.",
    browseAll: "Parcourir tous les outils →",
  },
  createTool: {
    titleNew: "Créer un outil",
    titleEdit: "Modifier l'outil",
    intro:
      "Écrivez une fonction JavaScript qui transforme une entrée en sortie. Ce code s'exécute directement dans votre navigateur, avec les mêmes permissions que la page — n'utilisez que du code que vous avez écrit vous-même ou en qui vous avez confiance.",
    nameLabel: "Nom",
    namePlaceholder: "Mon convertisseur",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Ce que fait l'outil, en une phrase.",
    categoryLabel: "Catégorie",
    categoryExisting: "Existante",
    categoryNew: "Nouvelle",
    chooseLabel: "Choisir",
    newCategoryLabel: "Nom de la nouvelle catégorie",
    newCategoryPlaceholder: "Mes outils",
    codeLabel: "Code",
    defaultCode: `// "input" contient le texte de la zone d'entrée.
// Renvoyez la chaîne à afficher en sortie.
return input.toUpperCase();`,
    livePreview: "Aperçu en direct",
    testInputLabel: "Entrée de test",
    testInputDefault: "Bonjour, Toolbox 👋",
    outputLabel: "Sortie",
    saveNew: "Créer l'outil",
    saveEdit: "Enregistrer les modifications",
    errorNameRequired: "Le nom est obligatoire.",
    errorCategoryRequired: "Choisissez ou nommez une catégorie.",
    errorCodeRequired: "Le code ne peut pas être vide.",
    errorCategoryExists:
      "Ce nom de catégorie existe déjà parmi les catégories intégrées — choisissez-en un autre, ou sélectionnez « Existante » ci-dessus.",
    runtimeErrorFallback: "Ce code a levé une erreur.",
  },
  toolPage: {
    notFound: "Cet outil n'existe pas.",
    notReady: "Cet outil ne fait pas encore partie de ce prototype.",
    loading: "Chargement de l'outil…",
    edit: "Modifier",
    delete: "Supprimer",
    deleteConfirm: (name) => `Supprimer définitivement l'outil « ${name} » ?`,
  },
};
