import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function toHex2(n: number) {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
}

function parseColor(input: string): Rgb | null {
  const s = input.trim();
  let m = s.match(/^#?([0-9a-f]{3})$/i);
  if (m) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  m = s.match(/^#?([0-9a-f]{6})$/i);
  if (m) {
    const hex = m[1];
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  }
  m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  m = s.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/i);
  if (m) return hslToRgb(+m[1], +m[2], +m[3]);
  return null;
}

export function ColorTool() {
  const [input, setInput] = useState("#BD5A0C");
  const rgb = parseColor(input);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  const rows: [string, string][] = rgb
    ? [
        ["HEX", `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`],
        ["RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
        ["HSL", `hsl(${hsl!.h}, ${hsl!.s}%, ${hsl!.l}%)`],
      ]
    : [];

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Couleur (hex, rgb() ou hsl())</span>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <span className="color-swatch" style={{ background: rgb ? `rgb(${rgb.r},${rgb.g},${rgb.b})` : "transparent" }} />
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="#BD5A0C" />
          </div>
        </div>
      </div>

      {!rgb && input.trim() && <div className="panel"><pre className="is-error">Couleur non reconnue.</pre></div>}

      {rgb && (
        <div className="hash-rows">
          {rows.map(([label, value]) => (
            <div className="hash-row" key={label}>
              <span className="alg">{label}</span>
              <span className="val">{value}</span>
              <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${label}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
