import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";

export interface PaletteTool {
  id: string;
  name: string;
  category: string;
  ready: boolean;
}

interface CommandPaletteProps {
  open: boolean;
  tools: PaletteTool[];
  onClose: () => void;
  onSelect: (id: string) => void;
  ariaLabel: string;
  inputPlaceholder: string;
  noResultsLabel: string;
  toolsGroupLabel: string;
  previewOnlySuffix: string;
}

export function CommandPalette({
  open,
  tools,
  onClose,
  onSelect,
  ariaLabel,
  inputPlaceholder,
  noResultsLabel,
  toolsGroupLabel,
  previewOnlySuffix,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [query, tools]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const t = filtered[activeIndex];
        if (t) onSelect(t.id);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, filtered, activeIndex, onClose, onSelect]);

  if (!open) return null;

  return (
    <div
      className="palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label={ariaLabel}>
        <div className="palette-input-row">
          <Icon name="search" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={inputPlaceholder}
            autoComplete="off"
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-results">
          {filtered.length === 0 ? (
            <div className="palette-empty">{noResultsLabel}</div>
          ) : (
            <>
              <div className="palette-group">{toolsGroupLabel}</div>
              {filtered.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  className={"palette-item" + (i === activeIndex ? " active" : "")}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => onSelect(t.id)}
                >
                  <span className="pi-left">
                    <span className="pi-name">{t.name}</span>
                    <span className="pi-cat">
                      {t.category}
                      {!t.ready ? previewOnlySuffix : ""}
                    </span>
                  </span>
                  {t.ready && <Icon name="arrow-right" />}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
