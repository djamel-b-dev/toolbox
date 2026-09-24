import { useMemo, useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";
import { JsonTree } from "../shared/JsonTree";
import { StructuredOutput } from "../shared/CodeView";

type Mode = "format" | "minify";
type Indent = "2" | "4" | "tab";

const EXAMPLE = '{"name":"Toolbox","ready":true,"tools":84,"owner":{"name":"Djamel","roles":["admin","dev"]},"themes":["clair","sombre","rétro"],"license":null}';

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export function JsonTool() {
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState<Indent>("2");
  const [sorted, setSorted] = useState(false);
  const [input, setInput] = useState("");

  const { parsed, output, error } = useMemo(() => {
    if (!input.trim()) return { parsed: undefined, output: "", error: "" };
    try {
      const value = JSON.parse(input);
      const data = sorted ? sortKeys(value) : value;
      const space = indent === "tab" ? "\t" : Number(indent);
      return { parsed: data, output: mode === "format" ? JSON.stringify(data, null, space) : JSON.stringify(data), error: "" };
    } catch (e) {
      return { parsed: undefined, output: "", error: e instanceof Error ? e.message : "JSON invalide." };
    }
  }, [input, mode, indent, sorted]);

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "format", label: "Formater" },
            { value: "minify", label: "Minifier" },
          ]}
        />
        {mode === "format" && (
          <SegmentedControl<Indent>
            value={indent}
            onChange={setIndent}
            options={[
              { value: "2", label: "2 espaces" },
              { value: "4", label: "4 espaces" },
              { value: "tab", label: "Tab" },
            ]}
          />
        )}
        <label className="check-row">
          <input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} />
          Trier les clés
        </label>
        <button type="button" className="btn" onClick={() => setInput(EXAMPLE)}>
          Utiliser un exemple
        </button>
        <button type="button" className="btn" onClick={() => setInput("")}>
          Effacer
        </button>
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Entrée</span>
            <span className="meta">{input.length} car.</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Collez du JSON…" spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Sortie</span>
            <span className="meta">{output.length} car.</span>
          </div>
          <StructuredOutput
            text={output}
            language="json"
            error={error}
            tree={mode === "format" && parsed !== undefined ? <JsonTree data={parsed} /> : undefined}
          />
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
