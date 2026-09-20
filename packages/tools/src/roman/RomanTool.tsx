import { useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

const ROMAN_MAP: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function toRoman(num: number): string {
  if (num <= 0 || num > 3999) return "";
  let result = "";
  let n = num;
  for (const [value, symbol] of ROMAN_MAP) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

function fromRoman(str: string): number | null {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const s = str.toUpperCase().trim();
  if (!s || !/^[IVXLCDM]+$/.test(s)) return null;
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]];
    if (next && cur < next) total -= cur;
    else total += cur;
  }
  return total;
}

type Mode = "toRoman" | "toArabic";

export function RomanTool() {
  const [mode, setMode] = useState<Mode>("toRoman");
  const [input, setInput] = useState("2026");

  let output = "";
  let error = false;
  if (input.trim()) {
    if (mode === "toRoman") {
      const n = parseInt(input.trim(), 10);
      output = Number.isFinite(n) ? toRoman(n) : "";
      error = !output;
    } else {
      const n = fromRoman(input);
      output = n === null ? "" : String(n);
      error = n === null;
    }
  }

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "toRoman", label: "Arabe → Romain" },
            { value: "toArabic", label: "Romain → Arabe" },
          ]}
        />
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Entrée</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 120 }} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Sortie</span>
          </div>
          <pre className={error && input.trim() ? "is-error" : undefined}>
            {error && input.trim() ? "Valeur invalide (1–3999)." : output || "—"}
          </pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
