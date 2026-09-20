import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function safeColor(s: string): string {
  return /^#[0-9a-f]{3,8}$/i.test(s.trim()) ? s.trim() : "#cccccc";
}

function buildSvg(width: number, height: number, bg: string, fg: string, text: string): string {
  const fontSize = Math.max(10, Math.round(Math.min(width, height) / 6));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${safeColor(bg)}" /><text x="50%" y="50%" fill="${safeColor(fg)}" font-family="sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text></svg>`;
}

export function SvgPlaceholderTool() {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [bg, setBg] = useState("#e3e6eb");
  const [fg, setFg] = useState("#565c68");
  const [label, setLabel] = useState("");

  const text = label || `${width} × ${height}`;
  const svg = buildSvg(width, height, bg, fg, text);
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return (
    <div>
      <div className="field-row">
        <div className="field" style={{ maxWidth: 120 }}>
          <span className="field-label">Largeur</span>
          <input className="input" type="number" min={16} max={2000} value={width} onChange={(e) => setWidth(Math.max(16, Number(e.target.value) || 16))} />
        </div>
        <div className="field" style={{ maxWidth: 120 }}>
          <span className="field-label">Hauteur</span>
          <input className="input" type="number" min={16} max={2000} value={height} onChange={(e) => setHeight(Math.max(16, Number(e.target.value) || 16))} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <span className="field-label">Fond</span>
          <input className="input" value={bg} onChange={(e) => setBg(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <span className="field-label">Texte</span>
          <input className="input" value={fg} onChange={(e) => setFg(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Étiquette (optionnel)</span>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={`${width} × ${height}`} />
        </div>
      </div>

      <div className="panel" style={{ alignItems: "center", marginBottom: "1.25rem" }}>
        <img src={dataUrl} alt="Aperçu du placeholder" style={{ maxWidth: "100%", borderRadius: 8 }} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Code SVG</span>
        </div>
        <pre className="pre-compact">{svg}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => svg} />
          <a className="btn" href={dataUrl} download={`placeholder-${width}x${height}.svg`}>
            Télécharger
          </a>
        </div>
      </div>
    </div>
  );
}
