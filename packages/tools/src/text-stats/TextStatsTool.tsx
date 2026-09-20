import { useState } from "react";

export function TextStatsTool() {
  const [input, setInput] = useState("");

  const chars = input.length;
  const charsNoSpaces = input.replace(/\s/g, "").length;
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const lines = input ? input.split("\n").length : 0;
  const sentences = input.trim() ? (input.match(/[.!?]+(\s|$)/g) ?? []).length || (input.trim() ? 1 : 0) : 0;
  const readingMinutes = words / 200;
  const readingLabel =
    readingMinutes < 1 ? `${Math.max(1, Math.round(readingMinutes * 60))} s` : `${Math.ceil(readingMinutes)} min`;

  const rows: [string, string][] = [
    ["Mots", String(words)],
    ["Caractères", String(chars)],
    ["Caractères (sans espaces)", String(charsNoSpaces)],
    ["Lignes", String(lines)],
    ["Phrases (approx.)", String(sentences)],
    ["Temps de lecture estimé", words ? readingLabel : "—"],
  ];

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Texte</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Collez ou tapez un texte…"
          spellCheck={false}
          style={{ minHeight: 160 }}
        />
      </div>

      <div className="hash-rows">
        {rows.map(([label, value]) => (
          <div className="hash-row" key={label} style={{ gridTemplateColumns: "1fr auto" }}>
            <span className="alg">{label}</span>
            <span className="val" style={{ textAlign: "right" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
