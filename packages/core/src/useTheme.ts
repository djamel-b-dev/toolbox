import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

function getEffectiveTheme(): Theme {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (typeof document !== "undefined" ? getEffectiveTheme() : "light"));

  const toggleTheme = useCallback(() => {
    const next: Theme = getEffectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      if (!document.documentElement.getAttribute("data-theme")) {
        setTheme(getEffectiveTheme());
      }
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  return { theme, toggleTheme };
}
