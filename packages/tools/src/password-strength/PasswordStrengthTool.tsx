import { useState, type CSSProperties } from "react";
import { analyzeStrength, STRENGTH_COLORS, STRENGTH_LABELS } from "../shared/passwordStrength";

export function PasswordStrengthTool() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const result = pw ? analyzeStrength(pw) : null;

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Mot de passe</span>
          <input className="input" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <button type="button" className="btn" style={{ alignSelf: "flex-end" }} onClick={() => setShow((s) => !s)}>
          {show ? "Masquer" : "Afficher"}
        </button>
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
          <p style={{ fontWeight: 600, marginBottom: "1rem", color: STRENGTH_COLORS[result.level] }}>{STRENGTH_LABELS[result.level]}</p>

          <div className="hash-rows">
            <div className="hash-row hash-row-2">
              <span className="alg">Entropie estimée</span>
              <span className="val">{result.entropy.toFixed(1)} bits</span>
            </div>
            <div className="hash-row hash-row-2">
              <span className="alg">Longueur</span>
              <span className="val">{pw.length} caractères</span>
            </div>
            <div className="hash-row hash-row-2">
              <span className="alg">Mot de passe courant</span>
              <span className={"val " + (result.isCommon ? "text-danger" : "text-success")}>
                {result.isCommon ? "Oui" : "Non"}
              </span>
            </div>
            <div className="hash-row hash-row-2">
              <span className="alg">Séquence évidente</span>
              <span className={"val " + (result.hasSequential ? "text-danger" : "text-success")}>
                {result.hasSequential ? "Détectée" : "Aucune"}
              </span>
            </div>
            <div className="hash-row hash-row-2">
              <span className="alg">Caractères répétés</span>
              <span className={"val " + (result.hasRepeat ? "text-danger" : "text-success")}>
                {result.hasRepeat ? "Détectés" : "Aucun"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
