import { useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
  euro: "€",
  cent: "¢",
  pound: "£",
  yen: "¥",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
};

const ENCODE_MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function encodeEntities(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ENCODE_MAP[c]);
}

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    const key = entity.toLowerCase();
    return key in NAMED ? NAMED[key] : match;
  });
}

type Mode = "encode" | "decode";

export function HtmlEntitiesTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const output = input ? (mode === "encode" ? encodeEntities(input) : decodeEntities(input)) : "";

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
          onClick={() => setInput(mode === "encode" ? '<Toolbox> & "outils"' : "&lt;Toolbox&gt; &amp; &quot;outils&quot;")}
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
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Sortie</span>
            <span className="meta">{output.length} car.</span>
          </div>
          <pre>{output}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
