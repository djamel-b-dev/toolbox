import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { Flag } from "./Flag";

interface LanguageMenuProps {
  value: string;
  options: { code: string; label: string; flag: string }[];
  onChange: (code: string) => void;
  ariaLabel: string;
}

export function LanguageMenu({ value, options, onChange, ariaLabel }: LanguageMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.code === value) ?? options[0];

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
    <div className="lang-menu" ref={rootRef}>
      <button
        type="button"
        className="lang-trigger"
        aria-label={`${ariaLabel} (${current.label})`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Flag code={current.flag} />
        <span className="lang-code">{current.code.toUpperCase()}</span>
        <Icon name="chevron" className={"lang-chevron" + (open ? " open" : "")} />
      </button>
      {open && (
        <div className="theme-menu-list lang-menu-list" role="menu" aria-label={ariaLabel}>
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              role="menuitemradio"
              aria-checked={opt.code === value}
              lang={opt.code}
              className={opt.code === value ? "theme-menu-item active" : "theme-menu-item"}
              onClick={() => {
                onChange(opt.code);
                setOpen(false);
              }}
            >
              <Flag code={opt.flag} />
              <span className="theme-menu-label">{opt.label}</span>
              {opt.code === value && <Icon name="check" className="theme-menu-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
