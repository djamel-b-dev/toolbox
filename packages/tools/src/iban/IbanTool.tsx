import { useState } from "react";

function normalize(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

function isValidIban(iban: string): boolean {
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  try {
    return BigInt(numeric) % 97n === 1n;
  } catch {
    return false;
  }
}

function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

export function IbanTool() {
  const [input, setInput] = useState("FR76 3000 6000 0112 3456 7890 189");
  const iban = normalize(input);
  const hasFormat = /^[A-Z]{2}[0-9]{2}/.test(iban);
  const valid = iban.length > 4 && isValidIban(iban);

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">IBAN</span>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
      </div>

      {iban && (
        <div className="hash-rows">
          <div className="hash-row hash-row-2">
            <span className="alg">Statut</span>
            <span className={"val " + (valid ? "text-success" : "text-danger")}>
              {valid ? "Valide" : "Invalide"}
            </span>
          </div>
          {hasFormat && (
            <div className="hash-row hash-row-2">
              <span className="alg">Pays</span>
              <span className="val">{iban.slice(0, 2)}</span>
            </div>
          )}
          <div className="hash-row hash-row-2">
            <span className="alg">Formaté</span>
            <span className="val">{formatIban(iban)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
