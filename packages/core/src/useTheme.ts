import { useCallback, useEffect, useState } from "react";

export const THEME_IDS = ["light", "dark", "paper", "retro", "web3"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

const STORAGE_KEY = "toolbox:theme";

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && (THEME_IDS as readonly string[]).includes(value);
}

function readStored(): ThemeId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : null;
  } catch {
    return null;
  }
}

function systemTheme(): ThemeId {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  // `null` means "follow the OS": no data-theme attribute, tokens.css picks light/dark itself.
  const [explicit, setExplicit] = useState<ThemeId | null>(() => (typeof document !== "undefined" ? readStored() : null));
  const [system, setSystem] = useState<ThemeId>(() => (typeof window !== "undefined" ? systemTheme() : "light"));

  useEffect(() => {
    if (explicit) document.documentElement.setAttribute("data-theme", explicit);
    else document.documentElement.removeAttribute("data-theme");
  }, [explicit]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystem(systemTheme());
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setExplicit(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable — theme still applies for this session */
    }
  }, []);

  return { theme: explicit ?? system, setTheme };
}
