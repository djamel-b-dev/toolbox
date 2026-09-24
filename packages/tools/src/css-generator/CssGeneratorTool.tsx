import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";
import { CodeView } from "../shared/CodeView";

type Tab = "gradient" | "shadow" | "radius";
type GradType = "linear" | "radial" | "conic";
interface Stop {
  color: string;
  pos: number;
}
interface Shadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  alpha: number;
  inset: boolean;
}

const GRADIENT_PRESETS: { name: string; type: GradType; angle: number; stops: Stop[] }[] = [
  { name: "Aurore", type: "linear", angle: 135, stops: [{ color: "#7c5cff", pos: 0 }, { color: "#00d4ff", pos: 50 }, { color: "#ff4ecd", pos: 100 }] },
  { name: "Coucher de soleil", type: "linear", angle: 180, stops: [{ color: "#fede5d", pos: 0 }, { color: "#ff8b39", pos: 45 }, { color: "#ff7edb", pos: 100 }] },
  { name: "Océan", type: "linear", angle: 160, stops: [{ color: "#0f2027", pos: 0 }, { color: "#203a43", pos: 50 }, { color: "#2c5364", pos: 100 }] },
  { name: "Menthe", type: "radial", angle: 0, stops: [{ color: "#d4fc79", pos: 0 }, { color: "#96e6a1", pos: 100 }] },
  { name: "Arc-en-ciel", type: "conic", angle: 0, stops: [{ color: "#ff0000", pos: 0 }, { color: "#ffff00", pos: 17 }, { color: "#00ff00", pos: 33 }, { color: "#00ffff", pos: 50 }, { color: "#0000ff", pos: 67 }, { color: "#ff00ff", pos: 83 }, { color: "#ff0000", pos: 100 }] },
];

const SHADOW_PRESETS: { name: string; layers: Shadow[] }[] = [
  { name: "Douce", layers: [{ x: 0, y: 1, blur: 3, spread: 0, color: "#000000", alpha: 0.1, inset: false }, { x: 0, y: 1, blur: 2, spread: -1, color: "#000000", alpha: 0.1, inset: false }] },
  { name: "Élevée", layers: [{ x: 0, y: 20, blur: 25, spread: -5, color: "#000000", alpha: 0.1, inset: false }, { x: 0, y: 8, blur: 10, spread: -6, color: "#000000", alpha: 0.1, inset: false }] },
  { name: "Néon", layers: [{ x: 0, y: 0, blur: 8, spread: 0, color: "#ff4ecd", alpha: 0.8, inset: false }, { x: 0, y: 0, blur: 24, spread: 4, color: "#7c5cff", alpha: 0.5, inset: false }] },
  { name: "Pixel", layers: [{ x: 6, y: 6, blur: 0, spread: 0, color: "#000000", alpha: 1, inset: false }] },
  { name: "Creusée", layers: [{ x: 0, y: 2, blur: 6, spread: 0, color: "#000000", alpha: 0.25, inset: true }] },
];

function hexToRgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return a >= 1 ? hex : `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Number(a.toFixed(2))})`;
}

function Range({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="css-range">
      <span>
        {label} <strong>{value}{unit}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function CssGeneratorTool() {
  const [tab, setTab] = useState<Tab>("gradient");
  const [gType, setGType] = useState<GradType>("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<Stop[]>(GRADIENT_PRESETS[0].stops);
  const [shadows, setShadows] = useState<Shadow[]>(SHADOW_PRESETS[1].layers);
  const [radius, setRadius] = useState({ tl: 24, tr: 24, br: 24, bl: 24 });
  const [linked, setLinked] = useState(true);

  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const stopList = sorted.map((s) => `${s.color} ${s.pos}%`).join(", ");
  const gradient = gType === "linear" ? `linear-gradient(${angle}deg, ${stopList})` : gType === "radial" ? `radial-gradient(circle at center, ${stopList})` : `conic-gradient(from ${angle}deg at center, ${stopList})`;
  const shadow = shadows.map((s) => `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${hexToRgba(s.color, s.alpha)}`).join(",\n    ");
  const r = radius;
  const radiusCss = r.tl === r.tr && r.tr === r.br && r.br === r.bl ? `${r.tl}px` : `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;

  const css =
    tab === "gradient"
      ? `background: ${sorted[0]?.color ?? "#000"}; /* repli */\nbackground: ${gradient};\n`
      : tab === "shadow"
        ? `box-shadow:\n    ${shadow};\n`
        : `border-radius: ${radiusCss};\n`;

  const previewStyle =
    tab === "gradient" ? { background: gradient } : tab === "shadow" ? { boxShadow: shadows.map((s) => `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${hexToRgba(s.color, s.alpha)}`).join(", "), background: "var(--surface)" } : { borderRadius: radiusCss, background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 40%, #000))" };

  const setStop = (i: number, patch: Partial<Stop>) => setStops((ss) => ss.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const setShadow = (i: number, patch: Partial<Shadow>) => setShadows((ss) => ss.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const setCorner = (k: keyof typeof radius, v: number) => setRadius((rr) => (linked ? { tl: v, tr: v, br: v, bl: v } : { ...rr, [k]: v }));

  return (
    <div>
      <div className="panel-tools mb-lg">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "gradient", label: "Dégradé" },
            { value: "shadow", label: "Ombre (box-shadow)" },
            { value: "radius", label: "Arrondis (border-radius)" },
          ]}
        />
      </div>

      <div className="css-layout">
        <div className="panel css-controls" style={{ minHeight: 0 }}>
          {tab === "gradient" && (
            <>
              <div className="emoji-groups">
                {GRADIENT_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="btn"
                    onClick={() => {
                      setGType(p.type);
                      setAngle(p.angle);
                      setStops(p.stops);
                    }}
                  >
                    <span className="css-swatch" style={{ background: p.type === "linear" ? `linear-gradient(${p.angle}deg, ${p.stops.map((s) => `${s.color} ${s.pos}%`).join(", ")})` : p.type === "radial" ? `radial-gradient(${p.stops.map((s) => s.color).join(", ")})` : `conic-gradient(${p.stops.map((s) => s.color).join(", ")})` }} />
                    {p.name}
                  </button>
                ))}
              </div>
              <SegmentedControl<GradType>
                value={gType}
                onChange={setGType}
                options={[
                  { value: "linear", label: "Linéaire" },
                  { value: "radial", label: "Radial" },
                  { value: "conic", label: "Conique" },
                ]}
              />
              {gType !== "radial" && <Range label="Angle" value={angle} min={0} max={360} unit="°" onChange={setAngle} />}
              <div className="css-stopbar" style={{ background: `linear-gradient(90deg, ${stopList})` }} aria-hidden="true" />
              {stops.map((s, i) => (
                <div className="css-stop" key={i}>
                  <input type="color" className="pixel-color-input" value={s.color} onChange={(e) => setStop(i, { color: e.target.value })} aria-label={`Couleur ${i + 1}`} />
                  <Range label="Position" value={s.pos} min={0} max={100} unit="%" onChange={(v) => setStop(i, { pos: v })} />
                  <button type="button" className="icon-btn" aria-label="Retirer cet arrêt" disabled={stops.length <= 2} onClick={() => setStops((ss) => ss.filter((_, k) => k !== i))}>
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="btn" onClick={() => setStops((ss) => [...ss, { color: "#ffffff", pos: 50 }])}>
                + Ajouter une couleur
              </button>
            </>
          )}

          {tab === "shadow" && (
            <>
              <div className="emoji-groups">
                {SHADOW_PRESETS.map((p) => (
                  <button key={p.name} type="button" className="btn" onClick={() => setShadows(p.layers)}>
                    {p.name}
                  </button>
                ))}
              </div>
              {shadows.map((s, i) => (
                <div className="css-layer" key={i}>
                  <div className="css-layer-head">
                    <strong>Couche {i + 1}</strong>
                    <label className="check-row">
                      <input type="checkbox" checked={s.inset} onChange={(e) => setShadow(i, { inset: e.target.checked })} />
                      inset
                    </label>
                    <input type="color" className="pixel-color-input" value={s.color} onChange={(e) => setShadow(i, { color: e.target.value })} aria-label="Couleur" />
                    <button type="button" className="icon-btn" aria-label="Retirer la couche" disabled={shadows.length <= 1} onClick={() => setShadows((ss) => ss.filter((_, k) => k !== i))}>
                      ×
                    </button>
                  </div>
                  <Range label="Décalage X" value={s.x} min={-50} max={50} unit="px" onChange={(v) => setShadow(i, { x: v })} />
                  <Range label="Décalage Y" value={s.y} min={-50} max={50} unit="px" onChange={(v) => setShadow(i, { y: v })} />
                  <Range label="Flou" value={s.blur} min={0} max={100} unit="px" onChange={(v) => setShadow(i, { blur: v })} />
                  <Range label="Étendue" value={s.spread} min={-50} max={50} unit="px" onChange={(v) => setShadow(i, { spread: v })} />
                  <Range label="Opacité" value={s.alpha} min={0} max={1} step={0.01} onChange={(v) => setShadow(i, { alpha: v })} />
                </div>
              ))}
              <button type="button" className="btn" onClick={() => setShadows((ss) => [...ss, { x: 0, y: 4, blur: 12, spread: 0, color: "#000000", alpha: 0.15, inset: false }])}>
                + Ajouter une couche
              </button>
            </>
          )}

          {tab === "radius" && (
            <>
              <label className="check-row">
                <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} />
                Tous les coins identiques
              </label>
              <Range label="Haut gauche" value={r.tl} min={0} max={150} unit="px" onChange={(v) => setCorner("tl", v)} />
              {!linked && (
                <>
                  <Range label="Haut droit" value={r.tr} min={0} max={150} unit="px" onChange={(v) => setCorner("tr", v)} />
                  <Range label="Bas droit" value={r.br} min={0} max={150} unit="px" onChange={(v) => setCorner("br", v)} />
                  <Range label="Bas gauche" value={r.bl} min={0} max={150} unit="px" onChange={(v) => setCorner("bl", v)} />
                </>
              )}
            </>
          )}
        </div>

        <div className="css-preview-wrap">
          <div className="css-preview-stage">
            <div className="css-preview" style={previewStyle} />
          </div>
          <div className="panel" style={{ minHeight: 0 }}>
            <div className="panel-head">
              <span className="label">CSS</span>
            </div>
            <CodeView code={css} language="css" />
            <div className="panel-tools">
              <CopyButton getText={() => css} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
