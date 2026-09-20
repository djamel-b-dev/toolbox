import { useState } from "react";

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function namedList(field: string, names: string[], offset = 0): string {
  return field
    .split(",")
    .map((part) => {
      const n = Number(part);
      return Number.isInteger(n) && names[n - offset] ? names[n - offset] : part;
    })
    .join(", ");
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Une expression cron doit contenir 5 champs séparés par des espaces : minute heure jour mois jour-de-semaine.";
  const [min, hour, dom, month, dow] = parts;

  const minIsNum = /^\d+$/.test(min);
  const hourIsNum = /^\d+$/.test(hour);

  let timePart: string;
  if (minIsNum && hourIsNum) {
    timePart = `à ${hour.padStart(2, "0")}h${min.padStart(2, "0")}`;
  } else if (/^\*\/\d+$/.test(min) && hour === "*") {
    timePart = `toutes les ${min.slice(2)} minutes`;
  } else if (min === "0" && /^\*\/\d+$/.test(hour)) {
    timePart = `toutes les ${hour.slice(2)} heures`;
  } else if (min === "*" && hour === "*") {
    timePart = "chaque minute";
  } else {
    timePart = `à la minute ${min} de l'heure ${hour}`;
  }

  let dayPart: string;
  if (dom === "*" && dow === "*") {
    dayPart = "tous les jours";
  } else if (dom !== "*" && dow === "*") {
    dayPart = `le ${dom} du mois`;
  } else if (dom === "*" && dow !== "*") {
    dayPart = `le ${namedList(dow, WEEKDAYS)}`;
  } else {
    dayPart = `le ${dom} du mois et le ${namedList(dow, WEEKDAYS)}`;
  }

  const monthPart = month === "*" ? "" : ` en ${namedList(month, MONTHS, 1)}`;

  return `${capitalize(timePart)}, ${dayPart}${monthPart}.`;
}

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
