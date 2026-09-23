import { useEffect, useRef, useState, type PointerEvent } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Pixel = string | null;
type Tool = "pen" | "eraser" | "fill" | "picker";

const STORAGE_KEY = "toolbox:pixel-art";
const SIZES = [8, 16, 24, 32] as const;
const EXPORT_SCALES = [1, 4, 8, 16, 32];
const UNDO_LIMIT = 50;

// PICO-8's 16-colour palette: small, balanced, and made for sprites.
const PALETTE = [
  "#000000", "#1d2b53", "#7e2553", "#008751",
  "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
  "#ff004d", "#ffa300", "#ffec27", "#00e436",
  "#29adff", "#83769c", "#ff77a8", "#ffccaa",
];

interface Stored {
  size: number;
  pixels: Pixel[];
}

function blank(size: number): Pixel[] {
  return Array<Pixel>(size * size).fill(null);
}

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (SIZES.includes(parsed.size as (typeof SIZES)[number]) && parsed.pixels?.length === parsed.size * parsed.size) return parsed;
    }
  } catch {
    /* corrupted or unavailable storage — start from an empty canvas */
  }
  return { size: 16, pixels: blank(16) };
}

function resize(pixels: Pixel[], from: number, to: number): Pixel[] {
  const next = blank(to);
  const n = Math.min(from, to);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) next[y * to + x] = pixels[y * from + x];
  return next;
}

function floodFill(pixels: Pixel[], size: number, start: number, color: Pixel): Pixel[] {
  const target = pixels[start];
  if (target === color) return pixels;
  const next = pixels.slice();
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    if (next[i] !== target) continue;
    next[i] = color;
    const x = i % size;
    const y = Math.floor(i / size);
    if (x > 0) stack.push(i - 1);
    if (x < size - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - size);
    if (y < size - 1) stack.push(i + size);
  }
  return next;
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/**
 * Classic "space invader" generator: random half mask biased toward the
 * centre, mirrored, then shaded and outlined so it reads as a sprite.
 */
function generateSprite(size: number): Pixel[] {
  const pixels = blank(size);
  const inner = size - 2;
  const half = Math.ceil(inner / 2);
  const bodyColors = PALETTE.slice(1).filter((c) => c !== "#5f574f" && c !== "#1d2b53");
  const base = bodyColors[Math.floor(Math.random() * bodyColors.length)];
  const accent = PALETTE[8 + Math.floor(Math.random() * 8)];
  const filled = new Set<number>();

  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < half; x++) {
      const distX = (half - x) / half;
      const distY = Math.abs(y - inner / 2) / (inner / 2);
      const p = 0.72 - distX * 0.35 - distY * 0.35;
      if (Math.random() < p) {
        const py = y + 1;
        filled.add(py * size + x + 1);
        filled.add(py * size + (size - 2 - x));
      }
    }
  }
  if (filled.size < inner) return generateSprite(size);

  for (const i of filled) {
    const y = Math.floor(i / size);
    const r = Math.random();
    pixels[i] = y < size * 0.4 && r < 0.25 ? shade(base, 0.35) : r < 0.08 ? accent : base;
  }
  // Eyes: a symmetric pair in the upper third, only where the body is.
  const eyeY = 1 + Math.floor(inner * (0.25 + Math.random() * 0.15));
  const eyeX = 1 + Math.floor(half * (0.35 + Math.random() * 0.4));
  for (const x of [eyeX, size - 1 - eyeX]) {
    const i = eyeY * size + x;
    if (filled.has(i)) pixels[i] = "#fff1e8";
  }
  const outline = shade(base, -0.75);
  for (let i = 0; i < pixels.length; i++) {
    if (filled.has(i)) continue;
    const x = i % size;
    const y = Math.floor(i / size);
    const near = [
      x > 0 && i - 1,
      x < size - 1 && i + 1,
      y > 0 && i - size,
      y < size - 1 && i + size,
    ].some((n) => n !== false && filled.has(n));
    if (near) pixels[i] = outline;
  }
  return pixels;
}

function toSvg(pixels: Pixel[], size: number): string {
  const rects = pixels
    .map((c, i) => (c ? `<rect x="${i % size}" y="${Math.floor(i / size)}" width="1" height="1" fill="${c}"/>` : ""))
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${rects}</svg>`;
}

function toBoxShadow(pixels: Pixel[], size: number, unit: number): string {
  const parts = pixels
    .map((c, i) => (c ? `${(i % size) * unit + unit}px ${Math.floor(i / size) * unit + unit}px ${c}` : ""))
    .filter(Boolean);
  return `width: ${unit}px;\nheight: ${unit}px;\nbox-shadow:\n  ${parts.join(",\n  ")};`;
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

export function PixelArtTool() {
  const [initial] = useState(readStored);
  const [size, setSize] = useState(initial.size);
  const [pixels, setPixels] = useState<Pixel[]>(initial.pixels);
  const [color, setColor] = useState(PALETTE[8]);
  const [tool, setTool] = useState<Tool>("pen");
  const [mirror, setMirror] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [exportScale, setExportScale] = useState(16);
  const [history, setHistory] = useState<Pixel[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ size, pixels }));
    } catch {
      /* storage full or unavailable — drawing still works for this session */
    }
  }, [size, pixels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const px = canvas.width / size;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Checkerboard shows transparency.
    for (let y = 0; y < size * 2; y++) {
      for (let x = 0; x < size * 2; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#d9dbe0" : "#f4f5f7";
        ctx.fillRect((x * px) / 2, (y * px) / 2, px / 2, px / 2);
      }
    }
    pixels.forEach((c, i) => {
      if (!c) return;
      ctx.fillStyle = c;
      ctx.fillRect((i % size) * px, Math.floor(i / size) * px, px, px);
    });
    if (showGrid) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 1; k < size; k++) {
        const p = Math.round(k * px) + 0.5;
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
      }
      ctx.stroke();
    }
  }, [pixels, size, showGrid]);

  function commit(next: Pixel[]) {
    if (next === pixels) return;
    setHistory((h) => [...h.slice(-UNDO_LIMIT + 1), pixels]);
    setPixels(next);
  }

  function cellAt(e: PointerEvent<HTMLCanvasElement>): number | null {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * size);
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return y * size + x;
  }

  function paint(i: number, value: Pixel, base: Pixel[]): Pixel[] {
    const targets = [i];
    if (mirror) targets.push(Math.floor(i / size) * size + (size - 1 - (i % size)));
    if (targets.every((t) => base[t] === value)) return base;
    const next = base.slice();
    for (const t of targets) next[t] = value;
    return next;
  }

  function handleDown(e: PointerEvent<HTMLCanvasElement>) {
    const i = cellAt(e);
    if (i === null) return;
    if (tool === "picker") {
      const c = pixels[i];
      if (c) {
        setColor(c);
        setTool("pen");
      }
      return;
    }
    if (tool === "fill") {
      commit(floodFill(pixels, size, i, color));
      return;
    }
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    // One undo step per stroke: snapshot once on pointer-down, then paint without history.
    setHistory((h) => [...h.slice(-UNDO_LIMIT + 1), pixels]);
    setPixels((prev) => paint(i, tool === "eraser" ? null : color, prev));
  }

  function handleMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const i = cellAt(e);
    if (i === null) return;
    setPixels((prev) => paint(i, tool === "eraser" ? null : color, prev));
  }

  function handleUp() {
    drawing.current = false;
  }

  function undo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setPixels(prev);
    setSize(Math.sqrt(prev.length));
  }

  function changeSize(next: number) {
    if (next === size) return;
    commit(resize(pixels, size, next));
    setSize(next);
  }

  function exportPng() {
    const c = document.createElement("canvas");
    c.width = c.height = size * exportScale;
    const ctx = c.getContext("2d")!;
    pixels.forEach((p, i) => {
      if (!p) return;
      ctx.fillStyle = p;
      ctx.fillRect((i % size) * exportScale, Math.floor(i / size) * exportScale, exportScale, exportScale);
    });
    download(c.toDataURL("image/png"), `pixel-art-${size}x${size}@${exportScale}x.png`);
  }

  function exportSvg() {
    const url = URL.createObjectURL(new Blob([toSvg(pixels, size)], { type: "image/svg+xml" }));
    download(url, `pixel-art-${size}x${size}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const used = Array.from(new Set(pixels.filter((p): p is string => !!p)));
  const isEmpty = used.length === 0;

  return (
    <div className="pixel-layout">
      <div className="panel pixel-stage">
        <div className="panel-head">
          <span className="label">
            Toile {size}×{size}
          </span>
          <span className="meta">{pixels.filter(Boolean).length} px</span>
        </div>
        <canvas
          ref={canvasRef}
          className={"pixel-canvas tool-" + tool}
          width={512}
          height={512}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          aria-label="Toile de dessin pixel art"
          role="img"
        />
        <div className="panel-tools">
          <button type="button" className="btn" onClick={() => commit(generateSprite(size))}>
            Générer un sprite
          </button>
          <button type="button" className="btn" onClick={undo} disabled={!history.length}>
            Annuler
          </button>
          <button type="button" className="btn" onClick={() => commit(blank(size))} disabled={isEmpty}>
            Effacer
          </button>
        </div>
      </div>

      <div className="pixel-side">
        <div className="field mb-lg">
          <span className="field-label">Outil</span>
          <SegmentedControl<Tool>
            value={tool}
            onChange={setTool}
            options={[
              { value: "pen", label: "Crayon" },
              { value: "eraser", label: "Gomme" },
              { value: "fill", label: "Remplir" },
              { value: "picker", label: "Pipette" },
            ]}
          />
        </div>

        <div className="field mb-lg">
          <span className="field-label">Couleur</span>
          <div className="pixel-palette">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={"pixel-swatch" + (c === color ? " active" : "")}
                style={{ background: c }}
                onClick={() => {
                  setColor(c);
                  if (tool === "eraser" || tool === "picker") setTool("pen");
                }}
                aria-label={c}
                aria-pressed={c === color}
              />
            ))}
          </div>
          <div className="color-input-row">
            <input type="color" className="pixel-color-input" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Couleur personnalisée" />
            <input className="input" value={color} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && setColor(e.target.value.toLowerCase())} />
          </div>
        </div>

        <div className="field mb-lg">
          <span className="field-label">Taille</span>
          <SegmentedControl value={String(size)} onChange={(v) => changeSize(Number(v))} options={SIZES.map((s) => ({ value: String(s), label: `${s}` }))} />
        </div>

        <div className="field mb-lg" style={{ gap: ".5rem" }}>
          <label className="check-row">
            <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} />
            Miroir horizontal
          </label>
          <label className="check-row">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            Afficher la grille
          </label>
        </div>

        <div className="field mb-lg">
          <span className="field-label">Export</span>
          <SegmentedControl
            value={String(exportScale)}
            onChange={(v) => setExportScale(Number(v))}
            options={EXPORT_SCALES.map((s) => ({ value: String(s), label: `${s}×` }))}
          />
          <div className="panel-tools" style={{ marginTop: ".5rem" }}>
            <button type="button" className="btn" onClick={exportPng} disabled={isEmpty}>
              PNG {size * exportScale}px
            </button>
            <button type="button" className="btn" onClick={exportSvg} disabled={isEmpty}>
              SVG
            </button>
            <CopyButton getText={() => (isEmpty ? "" : toSvg(pixels, size))} label="Copier SVG" />
            <CopyButton getText={() => (isEmpty ? "" : toBoxShadow(pixels, size, 4))} label="Copier CSS" />
          </div>
        </div>

        {used.length > 0 && (
          <div className="field">
            <span className="field-label">Couleurs utilisées ({used.length})</span>
            <div className="pixel-palette">
              {used.map((c) => (
                <button key={c} type="button" className="pixel-swatch" style={{ background: c }} onClick={() => setColor(c)} aria-label={c} title={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
