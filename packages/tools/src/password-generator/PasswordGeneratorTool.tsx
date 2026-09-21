import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { CopyButton } from "@toolbox/ui";
import { analyzeStrength, STRENGTH_COLORS, STRENGTH_LABELS } from "../shared/passwordStrength";

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}<>?",
};
const AMBIGUOUS = /[0O1lI|]/g;

const LABELS: Record<keyof typeof SETS, string> = {
  upper: "Majuscules",
  lower: "Minuscules",
  digits: "Chiffres",
  symbols: "Symboles",
};

function generate(length: number, opts: Record<keyof typeof SETS, boolean>, excludeAmbiguous: boolean): string {
  const keys = (Object.keys(SETS) as (keyof typeof SETS)[]).filter((k) => opts[k]);
  let pool = keys.map((k) => SETS[k]).join("");
  if (excludeAmbiguous) pool = pool.replace(AMBIGUOUS, "");
  if (!pool) return "";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += pool[bytes[i] % pool.length];
  return out;
}

export function PasswordGeneratorTool() {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState<Record<keyof typeof SETS, boolean>>({
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
  });
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [value, setValue] = useState("");

  const regenerate = useCallback(() => setValue(generate(length, opts, excludeAmbiguous)), [length, opts, excludeAmbiguous]);
  useEffect(() => regenerate(), [regenerate]);

  const result = value ? analyzeStrength(value) : null;

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
            <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.checked }))} />
            {LABELS[k]}
          </label>
        ))}
        <label className="check-row">
          <input type="checkbox" checked={excludeAmbiguous} onChange={(e) => setExcludeAmbiguous(e.target.checked)} />
          Exclure les caractères ambigus (0, O, 1, l, I)
        </label>
      </div>

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Mot de passe généré</span>
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

      {result && (
        <>
          <div className="strength-bar">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={i <= result.level ? "filled" : undefined}
                style={i <= result.level ? ({ "--bar-color": STRENGTH_COLORS[result.level] } as CSSProperties) : undefined}
              />
            ))}
          </div>
          <p style={{ fontWeight: 600, color: STRENGTH_COLORS[result.level] }}>
            {STRENGTH_LABELS[result.level]} — {result.entropy.toFixed(1)} bits d'entropie
          </p>
        </>
      )}
    </div>
  );
}
