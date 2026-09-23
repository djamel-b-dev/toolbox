import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

interface ThemeMenuProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
}

export function ThemeMenu({ value, options, onChange, ariaLabel }: ThemeMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="theme-menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="palette" />
      </button>
      {open && (
        <div className="theme-menu-list" role="menu" aria-label={ariaLabel}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={opt.value === value}
              className={opt.value === value ? "theme-menu-item active" : "theme-menu-item"}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span className="theme-swatch" data-swatch={opt.value} aria-hidden="true" />
              <span className="theme-menu-label">{opt.label}</span>
              {opt.value === value && <Icon name="check" className="theme-menu-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
