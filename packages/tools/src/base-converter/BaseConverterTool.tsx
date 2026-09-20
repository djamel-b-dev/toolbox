import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

const BASES = [
  { value: "2", label: "Binaire" },
  { value: "8", label: "Octal" },
  { value: "10", label: "Décimal" },
  { value: "16", label: "Hexadécimal" },
] as const;

type Base = (typeof BASES)[number]["value"];

export function BaseConverterTool() {
  const [base, setBase] = useState<Base>("10");
  const [input, setInput] = useState("42");

  const value = input.trim() ? parseInt(input.trim(), Number(base)) : NaN;
  const valid = !Number.isNaN(value) && value >= 0;

  const rows: [string, string][] = valid
    ? [
        ["Binaire", value.toString(2)],
        ["Octal", value.toString(8)],
        ["Décimal", value.toString(10)],
        ["Hexadécimal", value.toString(16).toUpperCase()],
      ]
    : [];

  return (
    <div>
      <div className="field-row">
        <div className="field" style={{ maxWidth: 320 }}>
          <span className="field-label">Base d'entrée</span>
          <SegmentedControl<Base> value={base} onChange={setBase} options={[...BASES]} />
        </div>
        <div className="field">
          <span className="field-label">Nombre</span>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
      </div>

      {!valid && input.trim() && (
        <div className="panel">
          <pre className="is-error">Nombre invalide pour cette base.</pre>
        </div>
      )}

      {valid && (
        <div className="hash-rows">
          {rows.map(([label, val]) => (
            <div className="hash-row" key={label}>
              <span className="alg">{label}</span>
              <span className="val">{val}</span>
              <CopyButton variant="mini" getText={() => val} ariaLabel={`Copier en ${label}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
