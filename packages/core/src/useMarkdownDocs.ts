import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "workbench:markdown-docs";

export interface MarkdownDoc {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

function readStored(): MarkdownDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function makeId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useMarkdownDocs() {
  const [docs, setDocs] = useState<MarkdownDoc[]>(() => readStored());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch {
      /* localStorage may be unavailable (private mode, quota) — documents just won't persist */
    }
  }, [docs]);

  const createDoc = useCallback((title: string, content: string): string => {
    const id = makeId();
    const now = Date.now();
    setDocs((prev) => [...prev, { id, title, content, createdAt: now, updatedAt: now }]);
    return id;
  }, []);

  const updateDoc = useCallback((id: string, patch: Partial<Pick<MarkdownDoc, "title" | "content">>) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)));
  }, []);

  const removeDoc = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return { docs, createDoc, updateDoc, removeDoc };
}
