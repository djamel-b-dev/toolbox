import { useEffect, useRef, useState, type ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  bold: <path d="M6 4h5a3 3 0 0 1 0 6H6Zm0 6h6a3 3 0 0 1 0 6H6Z" />,
  italic: (
    <>
      <line x1="12" y1="4" x2="8" y2="16" />
      <line x1="8.5" y1="4" x2="15" y2="4" />
      <line x1="5" y1="16" x2="11.5" y2="16" />
    </>
  ),
  strike: (
    <>
      <line x1="3.5" y1="10" x2="16.5" y2="10" />
      <path d="M13.5 5.5C13 4.3 11.8 3.6 10 3.6c-2.2 0-3.6 1.1-3.6 2.7 0 1 .5 1.7 1.6 2.2M6.3 14c.5 1.4 1.8 2.3 3.8 2.3 2.3 0 3.8-1.1 3.8-2.8 0-.7-.2-1.2-.6-1.6" />
    </>
  ),
  code: <path d="M7 6 3 10l4 4M13 6l4 4-4 4" />,
  link: (
    <>
      <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L10 5" />
      <path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <circle cx="7.5" cy="8" r="1.3" />
      <polyline points="3.5 15 8.5 10.5 12 13.5 14 11.5 16.5 14" />
    </>
  ),
  ul: (
    <>
      <circle cx="4.5" cy="5.5" r=".9" fill="currentColor" />
      <circle cx="4.5" cy="10" r=".9" fill="currentColor" />
      <circle cx="4.5" cy="14.5" r=".9" fill="currentColor" />
      <line x1="8" y1="5.5" x2="16.5" y2="5.5" />
      <line x1="8" y1="10" x2="16.5" y2="10" />
      <line x1="8" y1="14.5" x2="16.5" y2="14.5" />
    </>
  ),
  ol: (
    <>
      <path d="M3.5 4.2 4.7 3.5v4M3.4 7.5h2.6M3.4 12.3c.2-.7.8-1 1.4-1 .7 0 1.2.4 1.2 1 0 .9-1.3 1.3-2.6 2.9H6" />
      <line x1="8.5" y1="5.5" x2="16.5" y2="5.5" />
      <line x1="8.5" y1="10" x2="16.5" y2="10" />
      <line x1="8.5" y1="14.5" x2="16.5" y2="14.5" />
    </>
  ),
  task: (
    <>
      <rect x="3" y="3.5" width="5" height="5" rx="1" />
      <polyline points="4 6 5.2 7.2 7.2 4.8" />
      <rect x="3" y="11.5" width="5" height="5" rx="1" />
      <line x1="10.5" y1="6" x2="17" y2="6" />
      <line x1="10.5" y1="14" x2="17" y2="14" />
    </>
  ),
  quote: <path d="M4 14.5c0-4 1.5-6.5 4-8M4 11h3v3.5H4ZM11 14.5c0-4 1.5-6.5 4-8M11 11h3v3.5h-3Z" />,
  codeblock: (
    <>
      <rect x="2.5" y="3.5" width="15" height="13" rx="1.5" />
      <path d="M7.5 8l-2 2 2 2M12.5 8l2 2-2 2" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="14" height="12" rx="1.2" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="3" y1="12" x2="17" y2="12" />
      <line x1="8" y1="4" x2="8" y2="16" />
      <line x1="12.5" y1="4" x2="12.5" y2="16" />
    </>
  ),
  hr: (
    <>
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="6" y1="5.5" x2="14" y2="5.5" opacity=".45" />
      <line x1="6" y1="14.5" x2="14" y2="14.5" opacity=".45" />
    </>
  ),
  footnote: (
    <>
      <path d="M3.5 14V7M3.5 7h4M3.5 10.5h3" />
      <path d="M11 4.5h1.5v4M11 8.5h3" />
      <line x1="9.5" y1="14.5" x2="16.5" y2="14.5" />
    </>
  ),
  math: <path d="M15 5H5.5l5 5-5 5H15" />,
  diagram: (
    <>
      <rect x="2.5" y="3" width="6" height="4.5" rx="1" />
      <rect x="11.5" y="12.5" width="6" height="4.5" rx="1" />
      <path d="M5.5 7.5v3.5a1.5 1.5 0 0 0 1.5 1.5h4.5" />
      <polyline points="9.8 10.8 11.5 12.5 9.8 14.2" />
    </>
  ),
  alert: (
    <>
      <path d="M10 3 2.5 16.5h15Z" />
      <line x1="10" y1="8" x2="10" y2="11.5" />
      <circle cx="10" cy="14" r=".6" fill="currentColor" />
    </>
  ),
  undo: <path d="M7 5 3.5 8.5 7 12M3.5 8.5h8a4.5 4.5 0 0 1 0 9H9" />,
  redo: <path d="M13 5l3.5 3.5L13 12M16.5 8.5h-8a4.5 4.5 0 0 0 0 9H11" />,
  search: (
    <>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="13" y1="13" x2="17.5" y2="17.5" />
    </>
  ),
  toc: (
    <>
      <line x1="3" y1="5" x2="17" y2="5" />
      <line x1="6" y1="10" x2="17" y2="10" />
      <line x1="9" y1="15" x2="17" y2="15" />
    </>
  ),
  expand: <path d="M3.5 8V3.5H8M12 3.5h4.5V8M16.5 12v4.5H12M8 16.5H3.5V12" />,
  collapse: <path d="M8 3.5V8H3.5M16.5 8H12V3.5M12 16.5V12h4.5M3.5 12H8v4.5" />,
  file: (
    <>
      <path d="M5 2.5h6.5L15.5 6.5v11H5Z" />
      <polyline points="11 2.5 11 7 15.5 7" />
    </>
  ),
  download: (
    <>
      <line x1="10" y1="3" x2="10" y2="13" />
      <polyline points="6 9.5 10 13.5 14 9.5" />
      <line x1="4" y1="17" x2="16" y2="17" />
    </>
  ),
  upload: (
    <>
      <line x1="10" y1="14" x2="10" y2="3.5" />
      <polyline points="6 7.5 10 3.5 14 7.5" />
      <line x1="4" y1="17" x2="16" y2="17" />
    </>
  ),
  plus: (
    <>
      <line x1="10" y1="4" x2="10" y2="16" />
      <line x1="4" y1="10" x2="16" y2="10" />
    </>
  ),
  copy: (
    <>
      <rect x="7" y="7" width="9.5" height="9.5" rx="1.6" />
      <path d="M13 7V4.5A1.5 1.5 0 0 0 11.5 3h-8A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14H6" />
    </>
  ),
  trash: (
    <>
      <path d="M4 6h12" />
      <path d="M8 6V4.5A1 1 0 0 1 9 3.5h2A1 1 0 0 1 12 4.5V6" />
      <path d="M5.5 6l.6 9.5A1.5 1.5 0 0 0 7.6 17h4.8a1.5 1.5 0 0 0 1.5-1.5L14.5 6" />
    </>
  ),
  chevron: <polyline points="6 8 10 12 14 8" />,
  help: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M7.8 7.8a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 1.9-2.2 3.3" />
      <circle cx="10" cy="14.4" r=".6" fill="currentColor" />
    </>
  ),
  duplicate: (
    <>
      <rect x="6.5" y="6.5" width="10" height="10" rx="1.5" />
      <path d="M13.5 6.5V4.5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
      <line x1="11.5" y1="9.5" x2="11.5" y2="13.5" />
      <line x1="9.5" y1="11.5" x2="13.5" y2="11.5" />
    </>
  ),
  print: (
    <>
      <path d="M5.5 7.5V3h9v4.5" />
      <rect x="2.5" y="7.5" width="15" height="7" rx="1.5" />
      <rect x="5.5" y="12" width="9" height="5" />
    </>
  ),
};

export type MdIconName = keyof typeof PATHS;

export function MdIcon({ name }: { name: MdIconName }) {
  return (
    <svg className="md-icon" viewBox="0 0 20 20" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

interface PopoverProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function Popover({ trigger, children, align = "start", className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div className="md-popover-wrap" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={"md-popover" + (align === "end" ? " align-end" : "") + (className ? " " + className : "")} role="dialog">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** 8×6 hover grid to pick a table size, like word processors do. */
export function TablePicker({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState({ rows: 2, cols: 3 });
  const ROWS = 8;
  const COLS = 8;
  return (
    <div>
      <div className="md-table-picker" onPointerLeave={() => setHover({ rows: 2, cols: 3 })}>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS) + 1;
          const c = (i % COLS) + 1;
          const on = r <= hover.rows && c <= hover.cols;
          return (
            <button
              key={i}
              type="button"
              className={"md-table-cell" + (on ? " on" : "")}
              onPointerEnter={() => setHover({ rows: r, cols: c })}
              onFocus={() => setHover({ rows: r, cols: c })}
              onClick={() => onPick(r, c)}
              aria-label={`${r} lignes × ${c} colonnes`}
            />
          );
        })}
      </div>
      <div className="md-popover-hint">
        {hover.rows} × {hover.cols}
      </div>
    </div>
  );
}
