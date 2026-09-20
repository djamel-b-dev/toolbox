import { useState, type CSSProperties } from "react";

const COMMON = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "111111",
  "123123", "admin", "letmein", "welcome", "iloveyou", "azerty",
]);

const LEVEL_LABELS = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"];
const LEVEL_COLORS = ["var(--danger)", "var(--danger)", "#c8963e", "var(--success)", "var(--success)"];

function analyze(pw: string) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;
  const entropy = pw.length * Math.log2(pool || 1);
  const isCommon = COMMON.has(pw.toLowerCase());
  const hasSequential = /(abc|bcd|cde|def|123|234|345|456|567|678|789|890)/i.test(pw);
  const hasRepeat = /(.)\1{2,}/.test(pw);
  let score = entropy;
  if (isCommon) score -= 40;
  if (hasSequential) score -= 10;
  if (hasRepeat) score -= 10;
  score = Math.max(0, score);

  let level: number;
  if (score < 28) level = 0;
  else if (score < 36) level = 1;
  else if (score < 60) level = 2;
  else if (score < 80) level = 3;
  else level = 4;

  return { entropy, level, isCommon, hasSequential, hasRepeat, pool };
}

export function PasswordStrengthTool() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const result = pw ? analyze(pw) : null;

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
                style={i <= result.level ? ({ "--bar-color": LEVEL_COLORS[result.level] } as CSSProperties) : undefined}
              />
            ))}
          </div>
          <p style={{ fontWeight: 600, marginBottom: "1rem", color: LEVEL_COLORS[result.level] }}>{LEVEL_LABELS[result.level]}</p>

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
