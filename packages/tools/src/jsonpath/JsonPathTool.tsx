import { useMemo, useState } from "react";
import { JSONPath } from "jsonpath-plus";
import { CopyButton, Icon } from "@toolbox/ui";
import { JsonTree } from "../shared/JsonTree";
import { StructuredOutput } from "../shared/CodeView";

const EXAMPLE = JSON.stringify(
  {
    store: {
      name: "Toolbox Shop",
      books: [
        { id: 1, title: "Clean Code", author: "Robert C. Martin", price: 32.5, tags: ["dev", "craft"], inStock: true },
        { id: 2, title: "The Pragmatic Programmer", author: "Hunt & Thomas", price: 41, tags: ["dev"], inStock: false },
        { id: 3, title: "Site Reliability Engineering", author: "Google", price: 55, tags: ["ops", "sre"], inStock: true },
        { id: 4, title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", price: 48.9, tags: ["data", "architecture"], inStock: true },
      ],
      owner: { name: "Djamel", email: "dj@example.com" },
    },
  },
  null,
  2,
);

const EXAMPLES: [string, string][] = [
  ["$.store.books[*].title", "Tous les titres"],
  ["$..author", "Tous les auteurs (descente récursive)"],
  ["$.store.books[?(@.price < 45)]", "Livres à moins de 45"],
  ["$.store.books[?(@.inStock && @.tags.includes('dev'))].title", "En stock et tagués « dev »"],
  ["$.store.books[-1:]", "Dernier élément"],
  ["$.store.books[0,2].id", "Plusieurs indices"],
  ["$.store.books.length", "Taille du tableau"],
  ["$..*~", "Tous les noms de clés"],
];

export function JsonPathTool() {
  const [input, setInput] = useState(EXAMPLE);
  const [path, setPath] = useState("$.store.books[?(@.price < 45)]");
  const [withPaths, setWithPaths] = useState(false);

  const result = useMemo(() => {
    let data: unknown;
    try {
      data = JSON.parse(input);
    } catch (e) {
      return { error: "JSON invalide : " + (e instanceof Error ? e.message : ""), value: undefined as unknown };
    }
    if (!path.trim()) return { error: "", value: undefined };
    try {
      // eval: "safe" uses jsonpath-plus's own sandboxed expression evaluator, never the JS eval().
      const value = withPaths
        ? JSONPath({ path, json: data as object, resultType: "all", eval: "safe" }).map((r: { path: string; value: unknown }) => ({ path: r.path, value: r.value }))
        : JSONPath({ path, json: data as object, eval: "safe" });
      return { error: "", value };
    } catch (e) {
      return { error: "Expression invalide : " + (e instanceof Error ? e.message : ""), value: undefined };
    }
  }, [input, path, withPaths]);

  const text = result.value !== undefined ? JSON.stringify(result.value, null, 2) : "";
  const count = Array.isArray(result.value) ? result.value.length : 0;

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Expression JSONPath</span>
          <input className="input" value={path} onChange={(e) => setPath(e.target.value)} spellCheck={false} placeholder="$.store.books[*].title" />
        </div>
        <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
          <label className="check-row" style={{ height: 36 }}>
            <input type="checkbox" checked={withPaths} onChange={(e) => setWithPaths(e.target.checked)} />
            Inclure les chemins
          </label>
        </div>
      </div>
      <div className="emoji-groups mb-md">
        {EXAMPLES.map(([p, label]) => (
          <button key={p} type="button" className={"btn" + (p === path ? " is-active" : "")} onClick={() => setPath(p)} title={p}>
            {label}
          </button>
        ))}
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">JSON</span>
            <span className="meta">{input.length} car.</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Résultat</span>
            <span className="meta">
              {count} correspondance{count > 1 ? "s" : ""}
            </span>
          </div>
          <StructuredOutput text={text} language="json" error={result.error} tree={result.value !== undefined ? <JsonTree data={result.value} defaultDepth={3} /> : undefined} />
          <div className="panel-tools">
            <CopyButton getText={() => text} />
          </div>
        </div>
      </div>

      <details className="help-box">
        <summary>Aide-mémoire JSONPath</summary>
        <div className="hash-rows">
          {(
            [
              ["$", "racine"],
              [".clé / ['clé']", "enfant"],
              ["..clé", "descente récursive (à toute profondeur)"],
              ["*", "tous les enfants"],
              ["[0] / [-1] / [0,2] / [1:3]", "indices, négatifs, liste, tranche"],
              ["[?(@.prix > 10)]", "filtre (@ = élément courant ; &&, ||, ==, !=, <, >)"],
              ["~", "renvoie le nom de la clé plutôt que la valeur"],
            ] as const
          ).map(([syntax, desc]) => (
            <div className="hash-row hash-row-2" key={syntax}>
              <span className="val">{syntax}</span>
              <span style={{ color: "var(--text-secondary)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
