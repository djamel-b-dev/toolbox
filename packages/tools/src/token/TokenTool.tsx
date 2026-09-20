import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "@toolbox/ui";

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}<>?",
};

const LABELS: Record<keyof typeof SETS, string> = {
  upper: "Majuscules",
  lower: "Minuscules",
  digits: "Chiffres",
  symbols: "Symboles",
};

function generate(length: number, opts: Record<keyof typeof SETS, boolean>) {
  const keys = (Object.keys(SETS) as (keyof typeof SETS)[]).filter((k) => opts[k]);
  const pool = keys.map((k) => SETS[k]).join("");
  if (!pool) return "";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += pool[bytes[i] % pool.length];
  return out;
}

export function TokenTool() {
  const [length, setLength] = useState(32);
  const [opts, setOpts] = useState<Record<keyof typeof SETS, boolean>>({
    upper: true,
    lower: true,
    digits: true,
    symbols: false,
  });
  const [value, setValue] = useState("");

  const regenerate = useCallback(() => setValue(generate(length, opts)), [length, opts]);
  useEffect(() => regenerate(), [regenerate]);

  return (
    <div>
      <div className="field-row">
        <div className="field" style={{ maxWidth: 160 }}>
          <span className="field-label">Longueur</span>
          <input
            className="input"
            type="number"
            min={4}
            max={128}
            value={length}
            onChange={(e) => setLength(Math.min(128, Math.max(4, Number(e.target.value) || 4)))}
          />
        </div>
      </div>

      <div className="panel-tools mb-lg">
        {(Object.keys(SETS) as (keyof typeof SETS)[]).map((k) => (
          <label key={k} className="check-row">
            <input
              type="checkbox"
              checked={opts[k]}
              onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))}
            />
            {LABELS[k]}
          </label>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Jeton généré</span>
          <span className="meta">{value.length} car.</span>
        </div>
        <pre>{value || "Sélectionnez au moins un jeu de caractères."}</pre>
        <div className="panel-tools">
          <button type="button" className="btn" onClick={regenerate}>
            Régénérer
          </button>
          <CopyButton getText={() => value} />
        </div>
      </div>
    </div>
  );
}
