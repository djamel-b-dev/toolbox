import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

function normalizeEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at === -1) return trimmed;
  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);
  const plusIndex = local.indexOf("+");
  if (plusIndex !== -1) local = local.slice(0, plusIndex);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
    domain = "gmail.com";
  }
  return `${local}@${domain}`;
}

export function EmailNormalizerTool() {
  const [input, setInput] = useState("John.Doe+newsletter@Gmail.com\ncontact@Workbench.DEV");

  const lines = input.split(/\r?\n/).filter((l) => l.trim());
  const rows = lines.map((l) => [l.trim(), normalizeEmail(l)] as const);

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Emails (un par ligne)</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 100 }} />
      </div>

      {rows.length > 0 && (
        <div className="hash-rows">
          {rows.map(([original, normalized], i) => (
            <div className="hash-row" key={i}>
              <span className="alg" style={{ textDecoration: original !== normalized ? "line-through" : undefined, opacity: original !== normalized ? 0.6 : 1 }}>
                {original}
              </span>
              <span className="val">{normalized}</span>
              <CopyButton variant="mini" getText={() => normalized} ariaLabel="Copier l'email normalisé" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
