import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Unit = "c" | "f" | "k";

function toCelsius(value: number, unit: Unit): number {
  if (unit === "c") return value;
  if (unit === "f") return ((value - 32) * 5) / 9;
  return value - 273.15;
}

function fromCelsius(celsius: number): { c: number; f: number; k: number } {
  return { c: celsius, f: (celsius * 9) / 5 + 32, k: celsius + 273.15 };
}

export function TemperatureTool() {
  const [value, setValue] = useState("20");
  const [unit, setUnit] = useState<Unit>("c");

  const n = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(n);
  const result = valid ? fromCelsius(toCelsius(n, unit)) : null;

  const rows: [string, string][] = result
    ? [
        ["Celsius", `${result.c.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} °C`],
        ["Fahrenheit", `${result.f.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} °F`],
        ["Kelvin", `${result.k.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} K`],
      ]
    : [];

  return (
    <div>
      <div className="field-row">
        <div className="field" style={{ maxWidth: 160 }}>
          <span className="field-label">Valeur</span>
          <input className="input" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <span className="field-label">Unité de départ</span>
          <SegmentedControl<Unit>
            value={unit}
            onChange={setUnit}
            options={[
              { value: "c", label: "°C" },
              { value: "f", label: "°F" },
              { value: "k", label: "K" },
            ]}
          />
        </div>
      </div>

      {!valid && value.trim() && (
        <div className="panel">
          <pre className="is-error">Valeur numérique invalide.</pre>
        </div>
      )}

      {result && (
        <div className="hash-rows">
          {rows.map(([label, val]) => (
            <div className="hash-row" key={label}>
              <span className="alg">{label}</span>
              <span className="val">{val}</span>
              <CopyButton variant="mini" getText={() => val} ariaLabel={`Copier ${label}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
