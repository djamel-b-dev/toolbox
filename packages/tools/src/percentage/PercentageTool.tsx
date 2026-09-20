import { useState } from "react";

function num(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function PercentageTool() {
  const [p1a, setP1a] = useState("15");
  const [p1b, setP1b] = useState("200");

  const [p2a, setP2a] = useState("30");
  const [p2b, setP2b] = useState("120");

  const [p3a, setP3a] = useState("80");
  const [p3b, setP3b] = useState("100");

  const r1 = num(p1a) !== null && num(p1b) !== null ? ((num(p1a)! / 100) * num(p1b)!).toLocaleString("fr-FR", { maximumFractionDigits: 4 }) : null;
  const r2 = num(p2a) !== null && num(p2b) !== null && num(p2b) !== 0 ? ((num(p2a)! / num(p2b)!) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 4 }) : null;
  const r3 =
    num(p3a) !== null && num(p3b) !== null && num(p3a) !== 0
      ? (((num(p3b)! - num(p3a)!) / num(p3a)!) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 4 })
      : null;

  return (
    <div>
      <div className="panel mb-md">
        <div className="panel-head">
          <span className="label">X % de Y</span>
        </div>
        <div className="field-row" style={{ marginBottom: 0, alignItems: "center" }}>
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">X (%)</span>
            <input className="input" value={p1a} onChange={(e) => setP1a(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">Y</span>
            <input className="input" value={p1b} onChange={(e) => setP1b(e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Résultat</span>
            <div className="input" style={{ background: "transparent", border: "none", fontWeight: 600 }}>
              {r1 ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="panel mb-md">
        <div className="panel-head">
          <span className="label">X est quel % de Y ?</span>
        </div>
        <div className="field-row" style={{ marginBottom: 0, alignItems: "center" }}>
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">X</span>
            <input className="input" value={p2a} onChange={(e) => setP2a(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">Y</span>
            <input className="input" value={p2b} onChange={(e) => setP2b(e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Résultat</span>
            <div className="input" style={{ background: "transparent", border: "none", fontWeight: 600 }}>
              {r2 !== null ? `${r2} %` : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Variation de X à Y</span>
        </div>
        <div className="field-row" style={{ marginBottom: 0, alignItems: "center" }}>
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">De (X)</span>
            <input className="input" value={p3a} onChange={(e) => setP3a(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">À (Y)</span>
            <input className="input" value={p3b} onChange={(e) => setP3b(e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Résultat</span>
            <div
              className="input"
              style={{
                background: "transparent",
                border: "none",
                fontWeight: 600,
                color: r3 && r3.startsWith("-") ? "var(--danger)" : "var(--success)",
              }}
            >
              {r3 !== null ? `${r3.startsWith("-") ? "" : "+"}${r3} %` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
