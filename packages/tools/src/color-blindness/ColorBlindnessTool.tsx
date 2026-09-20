import { useState } from "react";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseHex(hex: string): Rgb | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const v = m[1];
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}

function toHex({ r, g, b }: Rgb): string {
  const c = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

const SIMULATIONS: { id: string; label: string; transform: (c: Rgb) => Rgb }[] = [
  {
    id: "protanopia",
    label: "Protanopie (rouge)",
    transform: ({ r, g, b }) => ({ r: 0.567 * r + 0.433 * g, g: 0.558 * r + 0.442 * g, b: 0.242 * g + 0.758 * b }),
  },
  {
    id: "deuteranopia",
    label: "Deutéranopie (vert)",
    transform: ({ r, g, b }) => ({ r: 0.625 * r + 0.375 * g, g: 0.7 * r + 0.3 * g, b: 0.3 * g + 0.7 * b }),
  },
  {
    id: "tritanopia",
    label: "Tritanopie (bleu)",
    transform: ({ r, g, b }) => ({ r: 0.95 * r + 0.05 * g, g: 0.433 * g + 0.567 * b, b: 0.475 * g + 0.525 * b }),
  },
  {
    id: "achromatopsia",
    label: "Achromatopsie (aucune couleur)",
    transform: ({ r, g, b }) => {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return { r: gray, g: gray, b: gray };
    },
  },
];

export function ColorBlindnessTool() {
  const [input, setInput] = useState("#BD5A0C");
  const rgb = parseHex(input);

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Couleur</span>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <span className="color-swatch" style={{ background: rgb ? toHex(rgb) : "transparent", width: 34, height: 34 }} />
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="#BD5A0C" />
          </div>
        </div>
      </div>

      {!rgb && input.trim() && (
        <div className="panel">
          <pre className="is-error">Couleur hexadécimale non reconnue.</pre>
        </div>
      )}

      {rgb && (
        <div className="grid">
          <div className="card" style={{ cursor: "default" }}>
            <div className="card-top">
              <span className="card-idx">Original</span>
            </div>
            <span className="color-swatch" style={{ background: toHex(rgb), width: "100%", height: 64, borderRadius: 8 }} />
            <span className="card-cat">{toHex(rgb)}</span>
          </div>
          {SIMULATIONS.map((sim) => {
            const simulated = toHex(sim.transform(rgb));
            return (
              <div className="card" key={sim.id} style={{ cursor: "default" }}>
                <div className="card-top">
                  <span className="card-idx">{sim.label}</span>
                </div>
                <span className="color-swatch" style={{ background: simulated, width: "100%", height: 64, borderRadius: 8 }} />
                <span className="card-cat">{simulated}</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="row-head hint" style={{ margin: "1rem 0 0" }}>
        Approximation par matrices standard — utile pour un premier repérage, pas un diagnostic clinique.
      </p>
    </div>
  );
}
