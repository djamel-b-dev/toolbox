import { useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

type Mode = "encode" | "decode";

function encode(text: string): string {
  return Array.from(text)
    .map((ch) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`)
    .join(" ");
}

function decode(input: string): string {
  const matches = input.match(/U\+([0-9A-Fa-f]+)|\\u([0-9A-Fa-f]{4})/g) ?? [];
  return matches
    .map((token) => {
      const hex = token.replace(/^U\+|^\\u/, "");
      return String.fromCodePoint(parseInt(hex, 16));
    })
    .join("");
}

export function UnicodeTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("Café ☕");

  const output = input ? (mode === "encode" ? encode(input) : decode(input)) : "";

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "encode", label: "Texte → Unicode" },
            { value: "decode", label: "Unicode → Texte" },
          ]}
        />
        <button
          type="button"
          className="btn"
          onClick={() => setInput(mode === "encode" ? "Café ☕" : "U+0043 U+0061 U+0066 U+00E9")}
        >
          Utiliser un exemple
        </button>
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Entrée</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Sortie</span>
          </div>
          <pre>{output || "—"}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
