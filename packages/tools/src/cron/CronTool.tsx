import { useState } from "react";
import { describeCron } from "../shared/cron";

export function CronTool() {
  const [expr, setExpr] = useState("0 9 * * 1-5");
  const parts = expr.trim().split(/\s+/);
  const valid = parts.length === 5;
  const description = describeCron(expr);

  const rows: [string, string][] = valid
    ? [
        ["Minute", parts[0]],
        ["Heure", parts[1]],
        ["Jour du mois", parts[2]],
        ["Mois", parts[3]],
        ["Jour de la semaine", parts[4]],
      ]
    : [];

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Expression cron</span>
          <input className="input" value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="0 9 * * 1-5" />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: valid ? "1.25rem" : 0 }}>
        <pre className={!valid ? "is-error" : undefined}>{description}</pre>
      </div>

      {valid && (
        <div className="hash-rows">
          {rows.map(([label, value]) => (
            <div className="hash-row" key={label} style={{ gridTemplateColumns: "1fr auto" }}>
              <span className="alg">{label}</span>
              <span className="val">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
