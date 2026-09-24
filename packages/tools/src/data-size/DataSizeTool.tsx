import { useMemo, useState } from "react";
import { CopyButton } from "@toolbox/ui";

interface Unit {
  id: string;
  label: string;
  bytes: number;
}

const DECIMAL: Unit[] = [
  { id: "B", label: "octets (o)", bytes: 1 },
  { id: "kB", label: "kilooctets (ko)", bytes: 1e3 },
  { id: "MB", label: "mégaoctets (Mo)", bytes: 1e6 },
  { id: "GB", label: "gigaoctets (Go)", bytes: 1e9 },
  { id: "TB", label: "téraoctets (To)", bytes: 1e12 },
  { id: "PB", label: "pétaoctets (Po)", bytes: 1e15 },
];
const BINARY: Unit[] = [
  { id: "KiB", label: "kibioctets (Kio)", bytes: 2 ** 10 },
  { id: "MiB", label: "mébioctets (Mio)", bytes: 2 ** 20 },
  { id: "GiB", label: "gibioctets (Gio)", bytes: 2 ** 30 },
  { id: "TiB", label: "tébioctets (Tio)", bytes: 2 ** 40 },
  { id: "PiB", label: "pébioctets (Pio)", bytes: 2 ** 50 },
];
const BITS: Unit[] = [
  { id: "bit", label: "bits", bytes: 1 / 8 },
  { id: "kbit", label: "kilobits", bytes: 1e3 / 8 },
  { id: "Mbit", label: "mégabits", bytes: 1e6 / 8 },
  { id: "Gbit", label: "gigabits", bytes: 1e9 / 8 },
];
const ALL = [...DECIMAL, ...BINARY, ...BITS];

const SPEEDS = [
  { label: "ADSL 8 Mbit/s", bps: 8e6 },
  { label: "4G 50 Mbit/s", bps: 50e6 },
  { label: "Fibre 1 Gbit/s", bps: 1e9 },
  { label: "LAN 10 Gbit/s", bps: 10e9 },
  { label: "Disque SATA 550 Mo/s", bps: 550e6 * 8 },
  { label: "NVMe 3,5 Go/s", bps: 3.5e9 * 8 },
];

function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  if (n === 0) return "0";
  if (Math.abs(n) >= 1e15 || Math.abs(n) < 1e-6) return n.toExponential(4);
  return n.toLocaleString("fr-FR", { maximumFractionDigits: n < 1 ? 8 : 4 });
}

function duration(seconds: number): string {
  if (!isFinite(seconds)) return "—";
  if (seconds < 1) return `${(seconds * 1000).toFixed(seconds < 0.01 ? 2 : 0)} ms`;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return [d && `${d} j`, h && `${h} h`, m && `${m} min`, (s || (!d && !h && !m)) && `${s} s`].filter(Boolean).join(" ");
}

export function DataSizeTool() {
  const [value, setValue] = useState("1.5");
  const [unit, setUnit] = useState("GB");
  const [speed, setSpeed] = useState("100");
  const [speedUnit, setSpeedUnit] = useState("Mbit");

  const bytes = useMemo(() => {
    const n = Number(value.replace(",", ".").replace(/\s/g, ""));
    const u = ALL.find((x) => x.id === unit)!;
    return isFinite(n) ? n * u.bytes : NaN;
  }, [value, unit]);

  const customBps = Number(speed.replace(",", ".")) * (speedUnit === "Mbit" ? 1e6 : speedUnit === "Gbit" ? 1e9 : speedUnit === "MB" ? 8e6 : 8e9);

  function Rows({ units, title }: { units: Unit[]; title: string }) {
    return (
      <div className="panel" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">{title}</span>
        </div>
        <div className="hash-rows">
          {units.map((u) => {
            const v = fmt(bytes / u.bytes);
            return (
              <div className={"hash-row" + (u.id === unit ? " is-current" : "")} key={u.id}>
                <span className="alg">{u.label}</span>
                <span className="val">{v}</span>
                <CopyButton variant="mini" getText={() => (bytes / u.bytes).toString()} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Valeur</span>
          <input className="input" value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
        </div>
        <div className="field">
          <span className="field-label">Unité</span>
          <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {ALL.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id} — {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isFinite(bytes) && bytes > 0 && unit === "GB" && (
        <p className="row-head hint" style={{ margin: "-0.25rem 0 1rem" }}>
          Pourquoi un disque de {value} Go affiche {fmt(bytes / 2 ** 30)} Gio dans l'OS : les fabricants comptent en puissances de 10, les systèmes en puissances de 2.
        </p>
      )}

      <div className="grid mb-lg" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <Rows units={DECIMAL} title="Décimal (SI, base 1000)" />
        <Rows units={BINARY} title="Binaire (IEC, base 1024)" />
        <Rows units={BITS} title="Bits" />
      </div>

      <div className="panel" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Temps de transfert</span>
        </div>
        <div className="field-row" style={{ marginBottom: 0 }}>
          <div className="field">
            <span className="field-label">Débit personnalisé</span>
            <input className="input" value={speed} onChange={(e) => setSpeed(e.target.value)} inputMode="decimal" />
          </div>
          <div className="field">
            <span className="field-label">Unité de débit</span>
            <select className="input" value={speedUnit} onChange={(e) => setSpeedUnit(e.target.value)}>
              <option value="Mbit">Mbit/s</option>
              <option value="Gbit">Gbit/s</option>
              <option value="MB">Mo/s</option>
              <option value="GB">Go/s</option>
            </select>
          </div>
        </div>
        <div className="hash-rows">
          <div className="hash-row hash-row-2 is-current">
            <span className="alg">
              {speed} {speedUnit === "Mbit" || speedUnit === "Gbit" ? `${speedUnit}/s` : `${speedUnit === "MB" ? "Mo" : "Go"}/s`}
            </span>
            <span className="val">{duration((bytes * 8) / customBps)}</span>
          </div>
          {SPEEDS.map((s) => (
            <div className="hash-row hash-row-2" key={s.label}>
              <span className="alg">{s.label}</span>
              <span className="val">{duration((bytes * 8) / s.bps)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
