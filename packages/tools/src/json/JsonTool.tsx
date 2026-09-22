import { useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

type Mode = "format" | "minify";

export function JsonTool() {
  const [mode, setMode] = useState<Mode>("format");
  const [input, setInput] = useState("");

  let output = "";
  let error = "";
  if (input.trim()) {
    try {
      const parsed = JSON.parse(input);
      output = mode === "format" ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
    } catch (e) {
      error = e instanceof Error ? e.message : "JSON invalide.";
    }
  }

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
        <button type="button" className="btn" onClick={() => setInput('{"name":"Toolbox","ready":true,"tools":12}')}>
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
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Collez du JSON…"
            spellCheck={false}
          />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Sortie</span>
            <span className="meta">{output.length} car.</span>
          </div>
          <pre className={error ? "is-error" : undefined}>{error || output}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
