import { useState } from "react";

const ENTRIES: [string, string, string][] = [
  ["^", "Ancres", "Début de chaîne (ou de ligne avec le flag m)"],
  ["$", "Ancres", "Fin de chaîne (ou de ligne avec le flag m)"],
  ["\\b", "Ancres", "Limite de mot"],
  ["\\B", "Ancres", "Absence de limite de mot"],
  [".", "Classes", "N'importe quel caractère, sauf saut de ligne"],
  ["\\d", "Classes", "Un chiffre — équivalent à [0-9]"],
  ["\\D", "Classes", "Un caractère qui n'est pas un chiffre"],
  ["\\w", "Classes", "Un caractère de mot — [A-Za-z0-9_]"],
  ["\\W", "Classes", "Un caractère qui n'est pas un caractère de mot"],
  ["\\s", "Classes", "Un espace blanc (espace, tabulation, saut de ligne)"],
  ["\\S", "Classes", "Un caractère qui n'est pas un espace blanc"],
  ["[abc]", "Classes", "Un des caractères listés"],
  ["[^abc]", "Classes", "Aucun des caractères listés"],
  ["[a-z]", "Classes", "Une plage de caractères"],
  ["*", "Quantificateurs", "0 fois ou plus"],
  ["+", "Quantificateurs", "1 fois ou plus"],
  ["?", "Quantificateurs", "0 ou 1 fois"],
  ["{n}", "Quantificateurs", "Exactement n fois"],
  ["{n,}", "Quantificateurs", "n fois ou plus"],
  ["{n,m}", "Quantificateurs", "Entre n et m fois"],
  ["*? +? ??", "Quantificateurs", "Version paresseuse (le moins de caractères possible)"],
  ["|", "Groupes", "Alternative — a|b"],
  ["(...)", "Groupes", "Groupe capturant"],
  ["(?:...)", "Groupes", "Groupe non capturant"],
  ["(?<nom>...)", "Groupes", "Groupe nommé, récupérable via match.groups.nom"],
  ["(?=...)", "Assertions", "Lookahead positif — suivi de"],
  ["(?!...)", "Assertions", "Lookahead négatif — non suivi de"],
  ["(?<=...)", "Assertions", "Lookbehind positif — précédé de"],
  ["(?<!...)", "Assertions", "Lookbehind négatif — non précédé de"],
];

export function RegexCheatsheetTool() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = ENTRIES.filter(([token, cat, desc]) => !q || token.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || desc.toLowerCase().includes(q));

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Rechercher</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="lookahead, quantificateur, \\d…" />
        </div>
      </div>

      <div className="hash-rows">
        {filtered.map(([token, cat, desc], i) => (
          <div className="hash-row" key={token + i} style={{ gridTemplateColumns: "minmax(74px, 140px) 1fr" }}>
            <span className="alg">{token}</span>
            <span className="val" style={{ display: "flex", flexDirection: "column", gap: ".15rem" }}>
              <span>{desc}</span>
              <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{cat}</span>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-state">Aucune entrée ne correspond.</p>}
      </div>
    </div>
  );
}
