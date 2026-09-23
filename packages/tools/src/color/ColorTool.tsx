import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from "react";
import { CopyButton } from "@toolbox/ui";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsv {
  h: number;
  s: number;
  v: number;
}

function hsvToRgb(h: number, s: number, v: number): Rgb {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
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

function rgbToHsv(r: number, g: number, b: number): Hsv {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(max === 0 ? 0 : (d / max) * 100), v: Math.round(max * 100) };
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

function toHex(rgb: Rgb) {
  return `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(0xbd, 0x5a, 0x0c));
  const [input, setInput] = useState("#BD5A0C");
  const [dragging, setDragging] = useState<"sv" | "hue" | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pickerOpen]);

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hex = toHex(rgb);
  const inputInvalid = input.trim() !== "" && !parseColor(input);

  function applyHsv(next: Hsv) {
    const clamped: Hsv = { h: ((next.h % 360) + 360) % 360, s: clamp(next.s, 0, 100), v: clamp(next.v, 0, 100) };
    setHsv(clamped);
    setInput(toHex(hsvToRgb(clamped.h, clamped.s, clamped.v)));
  }

  function updateFromSvPointer(clientX: number, clientY: number) {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.round((clamp(clientX - rect.left, 0, rect.width) / rect.width) * 100);
    const v = Math.round(100 - (clamp(clientY - rect.top, 0, rect.height) / rect.height) * 100);
    applyHsv({ ...hsv, s, v });
  }

  function updateFromHuePointer(clientX: number) {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = Math.round((clamp(clientX - rect.left, 0, rect.width) / rect.width) * 360);
    applyHsv({ ...hsv, h: h >= 360 ? 359 : h });
  }

  function handleSvPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging("sv");
    updateFromSvPointer(e.clientX, e.clientY);
  }
  function handleSvPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragging !== "sv") return;
    updateFromSvPointer(e.clientX, e.clientY);
  }
  function handleSvKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowLeft") applyHsv({ ...hsv, s: hsv.s - step });
    else if (e.key === "ArrowRight") applyHsv({ ...hsv, s: hsv.s + step });
    else if (e.key === "ArrowUp") applyHsv({ ...hsv, v: hsv.v + step });
    else if (e.key === "ArrowDown") applyHsv({ ...hsv, v: hsv.v - step });
    else return;
    e.preventDefault();
  }

  function handleHuePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging("hue");
    updateFromHuePointer(e.clientX);
  }
  function handleHuePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragging !== "hue") return;
    updateFromHuePointer(e.clientX);
  }
  function handleHueKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowLeft") applyHsv({ ...hsv, h: hsv.h - step });
    else if (e.key === "ArrowRight") applyHsv({ ...hsv, h: hsv.h + step });
    else return;
    e.preventDefault();
  }

  function handleInputChange(value: string) {
    setInput(value);
    const parsed = parseColor(value);
    if (parsed) setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b));
  }

  const rows: [string, string][] = [
    ["HEX", hex],
    ["RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
    ["HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
  ];

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Couleur (hex, rgb() ou hsl())</span>
          <div className="color-input-row" ref={wrapRef}>
            <button
              type="button"
              className="color-swatch color-swatch-btn"
              style={{ background: hex }}
              aria-label="Choisir une couleur"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((o) => !o)}
            />
            <input className="input" value={input} onChange={(e) => handleInputChange(e.target.value)} placeholder="#BD5A0C" />

            {pickerOpen && (
              <div className="color-popover">
                <div className="color-picker">
                  <div
                    ref={svRef}
                    className="color-sv"
                    style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                    role="slider"
                    tabIndex={0}
                    aria-label="Saturation et luminosité"
                    aria-valuetext={`Saturation ${hsv.s}%, luminosité ${hsv.v}%`}
                    onPointerDown={handleSvPointerDown}
                    onPointerMove={handleSvPointerMove}
                    onPointerUp={() => setDragging(null)}
                    onKeyDown={handleSvKeyDown}
                  >
                    <div className="color-sv-cursor" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, background: hex }} />
                  </div>
                  <div
                    ref={hueRef}
                    className="color-hue"
                    role="slider"
                    tabIndex={0}
                    aria-label="Teinte"
                    aria-valuemin={0}
                    aria-valuemax={359}
                    aria-valuenow={hsv.h}
                    onPointerDown={handleHuePointerDown}
                    onPointerMove={handleHuePointerMove}
                    onPointerUp={() => setDragging(null)}
                    onKeyDown={handleHueKeyDown}
                  >
                    <div
                      className="color-hue-cursor"
                      style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h}, 100%, 50%)` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {inputInvalid && (
        <div className="panel mb-lg">
          <pre className="is-error">Couleur non reconnue — la pastille et le sélecteur gardent la dernière couleur valide.</pre>
        </div>
      )}

      <div className="hash-rows">
        {rows.map(([label, value]) => (
          <div className="hash-row" key={label}>
            <span className="alg">{label}</span>
            <span className="val">{value}</span>
            <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${label}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
