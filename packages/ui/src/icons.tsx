export type IconName =
  | "search"
  | "star"
  | "sun"
  | "moon"
  | "copy"
  | "check"
  | "arrow-left"
  | "arrow-right"
  | "gauge"
  | "chevron";

export function IconSprite() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <symbol id="i-search" viewBox="0 0 20 20">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <line x1="13" y1="13" x2="17.5" y2="17.5" />
        </symbol>
        <symbol id="i-star" viewBox="0 0 20 20">
          <path
            className="star-fill"
            stroke="currentColor"
            d="M10 2.2 12.35 7.3 18 8 13.9 11.6 15 17 10 14.2 5 17 6.1 11.6 2 8 7.65 7.3Z"
          />
        </symbol>
        <symbol id="i-sun" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="3.6" />
          <g strokeLinecap="round">
            <line x1="10" y1="1.5" x2="10" y2="3.6" />
            <line x1="10" y1="16.4" x2="10" y2="18.5" />
            <line x1="1.5" y1="10" x2="3.6" y2="10" />
            <line x1="16.4" y1="10" x2="18.5" y2="10" />
            <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
            <line x1="14.4" y1="14.4" x2="15.8" y2="15.8" />
            <line x1="4.2" y1="15.8" x2="5.6" y2="14.4" />
            <line x1="14.4" y1="5.6" x2="15.8" y2="4.2" />
          </g>
        </symbol>
        <symbol id="i-moon" viewBox="0 0 20 20">
          <path d="M17 12.3A7.2 7.2 0 1 1 7.7 3a8 8 0 0 0 9.3 9.3Z" />
        </symbol>
        <symbol id="i-copy" viewBox="0 0 20 20">
          <rect x="7" y="7" width="9.5" height="9.5" rx="1.6" />
          <path d="M13 7V4.5A1.5 1.5 0 0 0 11.5 3h-8A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14H6" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 20 20">
          <polyline points="4 10.5 8 14.5 16.5 5" />
        </symbol>
        <symbol id="i-arrow-left" viewBox="0 0 20 20">
          <line x1="17" y1="10" x2="3.5" y2="10" />
          <polyline points="8 4.5 3.5 10 8 15.5" />
        </symbol>
        <symbol id="i-arrow-right" viewBox="0 0 20 20">
          <line x1="3" y1="10" x2="16.5" y2="10" />
          <polyline points="12 4.5 16.5 10 12 15.5" />
        </symbol>
        <symbol id="i-gauge" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7.6" />
          <line x1="10" y1="10" x2="13.6" y2="6" strokeLinecap="round" />
          <circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-chevron" viewBox="0 0 20 20">
          <polyline points="7 4.5 13 10 7 15.5" />
        </symbol>
      </defs>
    </svg>
  );
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={["icon", className].filter(Boolean).join(" ")}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
