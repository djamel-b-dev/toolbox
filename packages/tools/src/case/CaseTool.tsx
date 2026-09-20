import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

function words(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function toCamel(w: string[]) {
  return w.map((word, i) => (i === 0 ? word : word[0].toUpperCase() + word.slice(1))).join("");
}
function toPascal(w: string[]) {
  return w.map((word) => word[0].toUpperCase() + word.slice(1)).join("");
}
function toSnake(w: string[]) {
  return w.join("_");
}
function toConstant(w: string[]) {
  return w.join("_").toUpperCase();
}
function toKebab(w: string[]) {
  return w.join("-");
}
function toTitle(w: string[]) {
  return w.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}
function toSentence(w: string[]) {
  const s = w.join(" ");
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function toDot(w: string[]) {
  return w.join(".");
}

export function CaseTool() {
  const [input, setInput] = useState("");
  const w = words(input);

  const rows: [string, string][] = [
    ["camelCase", toCamel(w)],
    ["PascalCase", toPascal(w)],
    ["snake_case", toSnake(w)],
    ["CONSTANT_CASE", toConstant(w)],
    ["kebab-case", toKebab(w)],
    ["Title Case", toTitle(w)],
    ["Sentence case", toSentence(w)],
    ["dot.case", toDot(w)],
  ];

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Entrée</span>
          <span className="meta">{input.length} car.</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tapez du texte, en n'importe quelle casse…"
          spellCheck={false}
          style={{ minHeight: 80 }}
        />
        <div className="panel-tools">
          <button type="button" className="btn" onClick={() => setInput("workbench design system")}>
            Utiliser un exemple
          </button>
          <button type="button" className="btn" onClick={() => setInput("")}>
            Effacer
          </button>
        </div>
      </div>

      <div className="hash-rows">
        {rows.map(([label, value]) => (
          <div className="hash-row" key={label}>
            <span className="alg">{label}</span>
            <span className="val">{value || "—"}</span>
            <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier en ${label}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
