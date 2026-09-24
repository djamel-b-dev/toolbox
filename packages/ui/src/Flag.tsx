import { useId, type ReactNode } from "react";

function star(cx: number, cy: number, r: number, rotation = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.382;
    const a = (Math.PI / 5) * i - Math.PI / 2 + rotation;
    pts.push(`${(cx + radius * Math.cos(a)).toFixed(3)},${(cy + radius * Math.sin(a)).toFixed(3)}`);
  }
  return pts.join(" ");
}

function UnionJack() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none">
      <clipPath id={`${id}t`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}t)`} stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

const FLAGS: Record<string, () => ReactNode> = {
  fr: () => (
    <svg viewBox="0 0 3 2" preserveAspectRatio="none">
      <rect width="1" height="2" fill="#0055A4" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#EF4135" />
    </svg>
  ),
  gb: () => <UnionJack />,
  es: () => (
    <svg viewBox="0 0 4 4" preserveAspectRatio="none">
      <rect width="4" height="4" fill="#AA151B" />
      <rect y="1" width="4" height="2" fill="#F1BF00" />
    </svg>
  ),
  ae: () => (
    <svg viewBox="0 0 12 6" preserveAspectRatio="none">
      <rect width="12" height="2" fill="#00732F" />
      <rect y="2" width="12" height="2" fill="#fff" />
      <rect y="4" width="12" height="2" fill="#000" />
      <rect width="3" height="6" fill="#FF0000" />
    </svg>
  ),
  cn: () => (
    <svg viewBox="0 0 30 20" preserveAspectRatio="none">
      <rect width="30" height="20" fill="#EE1C25" />
      <polygon points={star(5, 5, 3)} fill="#FFFF00" />
      <polygon points={star(10, 2, 1, 0.4)} fill="#FFFF00" />
      <polygon points={star(12, 4, 1, 0.9)} fill="#FFFF00" />
      <polygon points={star(12, 7, 1, 0)} fill="#FFFF00" />
      <polygon points={star(10, 9, 1, 0.4)} fill="#FFFF00" />
    </svg>
  ),
  jp: () => (
    <svg viewBox="0 0 30 20" preserveAspectRatio="none">
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  ),
};

/** Small rectangular flag by ISO 3166 country code; renders a neutral placeholder for unknown codes. */
export function Flag({ code }: { code: string }) {
  const draw = FLAGS[code];
  return (
    <span className="flag" aria-hidden="true">
      {draw ? draw() : null}
    </span>
  );
}
