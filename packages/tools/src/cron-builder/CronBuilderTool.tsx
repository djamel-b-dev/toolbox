import { useMemo, useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";
import { describeCron } from "../shared/cron";

type Mode = "every" | "step" | "list" | "range";
interface FieldState {
  mode: Mode;
  step: number;
  list: number[];
  from: number;
  to: number;
}
interface FieldDef {
  id: string;
  label: string;
  min: number;
  max: number;
  names?: string[];
}

const FIELDS: FieldDef[] = [
  { id: "min", label: "Minute", min: 0, max: 59 },
  { id: "hour", label: "Heure", min: 0, max: 23 },
  { id: "dom", label: "Jour du mois", min: 1, max: 31 },
  { id: "month", label: "Mois", min: 1, max: 12, names: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."] },
  { id: "dow", label: "Jour de la semaine", min: 0, max: 6, names: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."] },
];

const PRESETS: [string, string][] = [
  ["*/5 * * * *", "Toutes les 5 minutes"],
  ["0 * * * *", "Toutes les heures"],
  ["0 2 * * *", "Chaque nuit à 2 h"],
  ["30 8 * * 1-5", "Jours ouvrés à 8 h 30"],
  ["0 9 * * 1", "Chaque lundi à 9 h"],
  ["0 0 1 * *", "Le 1er de chaque mois"],
  ["0 3 * * 0", "Dimanche à 3 h (sauvegarde)"],
  ["0 0 1 1 *", "Le 1er janvier"],
];

const init = (): Record<string, FieldState> =>
  Object.fromEntries(FIELDS.map((f) => [f.id, { mode: "every", step: f.id === "min" ? 15 : 2, list: [], from: f.min, to: f.max }]));

function fieldToExpr(s: FieldState, f: FieldDef): string {
  if (s.mode === "step") return `*/${Math.max(1, s.step)}`;
  if (s.mode === "range") return `${s.from}-${s.to}`;
  if (s.mode === "list") return s.list.length ? [...s.list].sort((a, b) => a - b).join(",") : String(f.min);
  return "*";
}

/** Expands one cron field ("*", "a-b", "*\/n", "a,b", "a-b/n") into the set of allowed values. */
function expand(field: string, min: number, max: number): Set<number> | null {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    const m = part.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
    if (!m) return null;
    const step = m[2] ? Number(m[2]) : 1;
    let [a, b] = m[1] === "*" ? [min, max] : m[1].split("-").map(Number);
    if (b === undefined) b = m[2] ? max : a;
    if (a < min || b > max || a > b || step < 1) return null;
    for (let v = a; v <= b; v += step) out.add(v === 7 && max === 6 ? 0 : v);
  }
  return out;
}

function nextRuns(expr: string, count: number): Date[] | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const dowField = parts[4].replace(/\b7\b/g, "0");
  const sets = [expand(parts[0], 0, 59), expand(parts[1], 0, 23), expand(parts[2], 1, 31), expand(parts[3], 1, 12), expand(dowField, 0, 6)];
  if (sets.some((s) => !s)) return null;
  const [mins, hours, doms, months, dows] = sets as Set<number>[];
  const domAny = parts[2] === "*";
  const dowAny = parts[4] === "*";
  const runs: Date[] = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  // Walk minute by minute, but skip whole days/hours that can't match: at most ~1 year of checks.
  for (let guard = 0; guard < 600000 && runs.length < count; guard++) {
    if (!months.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0);
      continue;
    }
    // Standard cron: when both day fields are restricted, a match on either one is enough.
    const dayOk = domAny && dowAny ? true : domAny ? dows.has(d.getDay()) : dowAny ? doms.has(d.getDate()) : doms.has(d.getDate()) || dows.has(d.getDay());
    if (!dayOk) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0);
      continue;
    }
    if (!hours.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0);
      continue;
    }
    if (mins.has(d.getMinutes())) runs.push(new Date(d));
    d.setMinutes(d.getMinutes() + 1);
  }
  return runs;
}

export function CronBuilderTool() {
  const [state, setState] = useState(init);
  const [override, setOverride] = useState<string | null>(null);

  const built = FIELDS.map((f) => fieldToExpr(state[f.id], f)).join(" ");
  const expr = override ?? built;
  const runs = useMemo(() => nextRuns(expr, 5), [expr]);
  const valid = runs !== null;

  const set = (id: string, patch: Partial<FieldState>) => {
    setOverride(null);
    setState((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  };

  function applyPreset(p: string) {
    const parts = p.split(" ");
    const next = init();
    FIELDS.forEach((f, i) => {
      const v = parts[i];
      if (v === "*") next[f.id].mode = "every";
      else if (/^\*\/\d+$/.test(v)) Object.assign(next[f.id], { mode: "step", step: Number(v.slice(2)) });
      else if (/^\d+-\d+$/.test(v)) Object.assign(next[f.id], { mode: "range", from: Number(v.split("-")[0]), to: Number(v.split("-")[1]) });
      else Object.assign(next[f.id], { mode: "list", list: v.split(",").map(Number) });
    });
    setState(next);
    setOverride(null);
  }

  return (
    <div>
      <div className="cron-expr mb-md">
        <input className="input" value={expr} onChange={(e) => setOverride(e.target.value)} spellCheck={false} aria-label="Expression cron" />
        <CopyButton getText={() => expr} />
      </div>
      <p className={"row-head hint mb-md " + (valid ? "" : "text-danger")} style={{ margin: "0 0 1rem", fontSize: ".9rem" }}>
        {valid ? describeCron(expr) : "Expression invalide."}
      </p>
      <div className="emoji-groups mb-lg">
        {PRESETS.map(([p, label]) => (
          <button key={p} type="button" className={"btn" + (p === expr ? " is-active" : "")} onClick={() => applyPreset(p)}>
            {label}
          </button>
        ))}
      </div>

      <div className="cron-fields">
        {FIELDS.map((f) => {
          const s = state[f.id];
          const values = Array.from({ length: f.max - f.min + 1 }, (_, i) => f.min + i);
          return (
            <div className="panel cron-field" key={f.id}>
              <div className="panel-head">
                <span className="label">{f.label}</span>
                <span className="meta">{fieldToExpr(s, f)}</span>
              </div>
              <SegmentedControl<Mode>
                value={s.mode}
                onChange={(mode) => set(f.id, { mode })}
                options={[
                  { value: "every", label: "Tous" },
                  { value: "step", label: "Tous les N" },
                  { value: "list", label: "Choix" },
                  { value: "range", label: "Plage" },
                ]}
              />
              {s.mode === "step" && (
                <label className="check-row">
                  Tous les
                  <input className="input" type="number" min={1} max={f.max} value={s.step} onChange={(e) => set(f.id, { step: Number(e.target.value) })} style={{ width: 80 }} />
                </label>
              )}
              {s.mode === "range" && (
                <div className="check-row">
                  de
                  <select className="input" value={s.from} onChange={(e) => set(f.id, { from: Number(e.target.value) })} style={{ width: "auto" }}>
                    {values.map((v) => (
                      <option key={v} value={v}>
                        {f.names?.[v - f.min] ?? v}
                      </option>
                    ))}
                  </select>
                  à
                  <select className="input" value={s.to} onChange={(e) => set(f.id, { to: Number(e.target.value) })} style={{ width: "auto" }}>
                    {values.map((v) => (
                      <option key={v} value={v}>
                        {f.names?.[v - f.min] ?? v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {s.mode === "list" && (
                <div className={"cron-grid" + (f.names ? " named" : "")}>
                  {values.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={"cron-cell" + (s.list.includes(v) ? " on" : "")}
                      aria-pressed={s.list.includes(v)}
                      onClick={() => set(f.id, { list: s.list.includes(v) ? s.list.filter((x) => x !== v) : [...s.list, v] })}
                    >
                      {f.names?.[v - f.min] ?? v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {valid && runs.length > 0 && (
        <div className="panel mt-lg" style={{ minHeight: 0 }}>
          <div className="panel-head">
            <span className="label">Prochaines exécutions (heure locale)</span>
          </div>
          <div className="hash-rows">
            {runs.map((r, i) => (
              <div className="hash-row hash-row-2" key={i}>
                <span className="val">{r.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span style={{ color: "var(--text-tertiary)", fontSize: ".78rem" }}>{i === 0 ? `dans ${Math.max(1, Math.round((r.getTime() - Date.now()) / 60000))} min` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
