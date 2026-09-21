import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "workbench:custom-tools";

export interface CustomTool {
  id: string;
  name: string;
  description: string;
  category: string;
  /** True when this tool introduced its category — used to pin that category under Favoris. */
  isNewCategory: boolean;
  /** Body of a function `(input) => output`, run with `new Function("input", code)`. */
  code: string;
  createdAt: number;
  updatedAt: number;
}

export type CustomToolInput = Pick<CustomTool, "name" | "description" | "category" | "isNewCategory" | "code">;

function readStored(): CustomTool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "outil"
  );
}

export function useCustomTools() {
  const [tools, setTools] = useState<CustomTool[]>(() => readStored());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
    } catch {
      /* localStorage may be unavailable (private mode, quota) — custom tools just won't persist */
    }
  }, [tools]);

  const addTool = useCallback(
    (input: CustomToolInput): string => {
      const base = slugify(input.name);
      let id = base;
      let n = 2;
      while (tools.some((t) => t.id === id)) {
        id = `${base}-${n}`;
        n++;
      }
      const now = Date.now();
      setTools((prev) => [...prev, { ...input, id, createdAt: now, updatedAt: now }]);
      return id;
    },
    [tools],
  );

  const updateTool = useCallback((id: string, patch: CustomToolInput) => {
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)));
  }, []);

  const removeTool = useCallback((id: string) => {
    setTools((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tools, addTool, updateTool, removeTool };
}
