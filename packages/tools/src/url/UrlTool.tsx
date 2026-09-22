import { useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

type Mode = "encode" | "decode";

export function UrlTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  let output = "";
  let error = false;
  if (input) {
    try {
      output = mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
    } catch {
      output = "Séquence encodée invalide.";
      error = true;
    }
  }

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "encode", label: "Encoder" },
            { value: "decode", label: "Décoder" },
          ]}
        />
        <button
          type="button"
          className="btn"
          onClick={() => setInput(mode === "encode" ? "https://toolbox.dev/search?q=hello world" : "https%3A%2F%2Ftoolbox.dev%2Fsearch%3Fq%3Dhello%20world")}
        >
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
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tapez ou collez du texte…" spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Sortie</span>
            <span className="meta">{output.length} car.</span>
          </div>
          <pre className={error ? "is-error" : undefined}>{output}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
