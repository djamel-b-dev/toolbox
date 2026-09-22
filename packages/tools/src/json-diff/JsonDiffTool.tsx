import { useState } from "react";
import { diffLines } from "../shared/diffLines";

function normalize(input: string): { text: string; error: string } {
  if (!input.trim()) return { text: "", error: "" };
  try {
    return { text: JSON.stringify(JSON.parse(input), null, 2), error: "" };
  } catch (e) {
    return { text: "", error: e instanceof Error ? e.message : "JSON invalide." };
  }
}

export function JsonDiffTool() {
  const [before, setBefore] = useState('{\n  "name": "toolbox",\n  "version": "1.0.0",\n  "tools": 27\n}');
  const [after, setAfter] = useState('{\n  "name": "toolbox",\n  "version": "1.1.0",\n  "tools": 43,\n  "private": true\n}');

  const a = normalize(before);
  const b = normalize(after);
  const lines = !a.error && !b.error ? diffLines(a.text.split("\n"), b.text.split("\n")) : [];
  const added = lines.filter((l) => l.type === "add").length;
  const removed = lines.filter((l) => l.type === "remove").length;

  return (
    <div>
      <div className="bench bench-2 mb-lg">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Avant</span>
          </div>
          <textarea value={before} onChange={(e) => setBefore(e.target.value)} spellCheck={false} style={{ minHeight: 180 }} />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Après</span>
          </div>
          <textarea value={after} onChange={(e) => setAfter(e.target.value)} spellCheck={false} style={{ minHeight: 180 }} />
        </div>
      </div>

      {(a.error || b.error) && (
        <div className="panel">
          <pre className="is-error">{a.error || b.error}</pre>
        </div>
      )}

      {!a.error && !b.error && (before.trim() || after.trim()) && (
        <>
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
        </>
      )}
    </div>
  );
}
