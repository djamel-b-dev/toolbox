import { useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

type Mode = "encode" | "decode";

const EXAMPLES: Record<Mode, string> = {
  encode: "Hello, Workbench 👋",
  decode: "SGVsbG8sIFdvcmtiZW5jaCDwn5GL",
};

export function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  let output = "";
  let error = false;
  if (input) {
    try {
      output =
        mode === "encode" ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input)));
    } catch {
      output = "Base64 non valide.";
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
        <button type="button" className="btn" onClick={() => setInput(EXAMPLES[mode])}>
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
            placeholder="Tapez ou collez du texte…"
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
          <pre className={error ? "is-error" : undefined}>{output}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
