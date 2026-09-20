import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Mode = "generic" | "email";

function maskGeneric(input: string, start: number, end: number, maskChar: string): string {
  if (input.length <= start + end) return maskChar.repeat(input.length);
  const middle = maskChar.repeat(input.length - start - end);
  return input.slice(0, start) + middle + (end > 0 ? input.slice(-end) : "");
}

function maskEmail(input: string): string {
  const at = input.indexOf("@");
  if (at <= 0) return maskGeneric(input, 1, 0, "*");
  const local = input.slice(0, at);
  const domain = input.slice(at);
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(1, local.length - 1))}${domain}`;
}

export function ObfuscatorTool() {
  const [mode, setMode] = useState<Mode>("generic");
  const [input, setInput] = useState("4242 4242 4242 4242");
  const [start, setStart] = useState(4);
  const [end, setEnd] = useState(4);

  const output = !input ? "" : mode === "generic" ? maskGeneric(input, start, end, "*") : maskEmail(input);

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "generic", label: "Générique" },
            { value: "email", label: "Email" },
          ]}
        />
      </div>

      {mode === "generic" && (
        <div className="field-row">
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">Caractères visibles (début)</span>
            <input className="input" type="number" min={0} value={start} onChange={(e) => setStart(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">Caractères visibles (fin)</span>
            <input className="input" type="number" min={0} value={end} onChange={(e) => setEnd(Math.max(0, Number(e.target.value) || 0))} />
          </div>
        </div>
      )}

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Valeur d'origine</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 70 }} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Masqué</span>
        </div>
        <pre>{output || "—"}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => output} />
        </div>
      </div>
    </div>
  );
}
