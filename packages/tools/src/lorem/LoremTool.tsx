import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "culpa",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sentence(): string {
  const len = 6 + Math.floor(Math.random() * 10);
  const words = Array.from({ length: len }, () => pick(WORDS));
  const text = words.join(" ");
  return text[0].toUpperCase() + text.slice(1) + ".";
}

function paragraph(): string {
  const len = 3 + Math.floor(Math.random() * 4);
  return Array.from({ length: len }, sentence).join(" ");
}

type Mode = "words" | "sentences" | "paragraphs";

export function LoremTool() {
  const [mode, setMode] = useState<Mode>("paragraphs");
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState("");

  function generate() {
    if (mode === "words") {
      setOutput(Array.from({ length: count }, () => pick(WORDS)).join(" "));
    } else if (mode === "sentences") {
      setOutput(Array.from({ length: count }, sentence).join(" "));
    } else {
      setOutput(Array.from({ length: count }, paragraph).join("\n\n"));
    }
  }

  return (
    <div>
      <div className="field-row">
        <div className="field" style={{ maxWidth: 320 }}>
          <span className="field-label">Unité</span>
          <SegmentedControl<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "words", label: "Mots" },
              { value: "sentences", label: "Phrases" },
              { value: "paragraphs", label: "Paragraphes" },
            ]}
          />
        </div>
        <div className="field" style={{ maxWidth: 120 }}>
          <span className="field-label">Quantité</span>
          <input
            className="input"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
          />
        </div>
        <button type="button" className="btn" style={{ alignSelf: "flex-end" }} onClick={generate}>
          Générer
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Résultat</span>
          <span className="meta">{output.length} car.</span>
        </div>
        <pre>{output || "Cliquez sur Générer."}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => output} />
        </div>
      </div>
    </div>
  );
}
