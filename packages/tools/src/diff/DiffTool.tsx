import { useState } from "react";
import { diffLines } from "../shared/diffLines";

export function DiffTool() {
  const [before, setBefore] = useState("const greet = (name) => {\n  return \"Hello \" + name;\n};");
  const [after, setAfter] = useState("const greet = (name) => {\n  return `Hello, ${name}!`;\n};");

  const lines = diffLines(before.split("\n"), after.split("\n"));
  const added = lines.filter((l) => l.type === "add").length;
  const removed = lines.filter((l) => l.type === "remove").length;

  return (
    <div>
      <div className="bench bench-2 mb-lg">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Avant</span>
          </div>
          <textarea value={before} onChange={(e) => setBefore(e.target.value)} spellCheck={false} style={{ minHeight: 160 }} />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Après</span>
          </div>
          <textarea value={after} onChange={(e) => setAfter(e.target.value)} spellCheck={false} style={{ minHeight: 160 }} />
        </div>
      </div>

      <div className="row-head">
        <h2>Différences</h2>
        <span className="hint">
          +{added} / -{removed}
        </span>
      </div>
      <div className="diff-pane">
        {lines.map((l, i) => (
          <div key={i} className={"diff-line" + (l.type === "add" ? " diff-add" : l.type === "remove" ? " diff-remove" : "")}>
            <span className="ln">{l.type === "add" ? "+" : l.type === "remove" ? "−" : ""}</span>
            <span>{l.text || " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
