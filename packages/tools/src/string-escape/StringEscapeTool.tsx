import { useMemo, useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

type Direction = "escape" | "unescape";

interface Format {
  id: string;
  label: string;
  escape: (s: string) => string;
  unescape?: (s: string) => string;
}

function jsUnescape(s: string): string {
  return s.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[0-7]{1,3}|.)/g, (_m, e: string) => {
    if (e[0] === "u") return String.fromCodePoint(parseInt(e.replace(/[u{}]/g, ""), 16));
    if (e[0] === "x") return String.fromCharCode(parseInt(e.slice(1), 16));
    if (/^[0-7]+$/.test(e)) return String.fromCharCode(parseInt(e, 8));
    return ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "0": "\0" } as Record<string, string>)[e] ?? e;
  });
}

const FORMATS: Format[] = [
  {
    id: "json",
    label: "JSON",
    escape: (s) => JSON.stringify(s).slice(1, -1),
    unescape: (s) => JSON.parse(`"${s.replace(/(^|[^\\])"/g, '$1\\"')}"`),
  },
  {
    id: "js",
    label: "JavaScript",
    escape: (s) =>
      s.replace(/[\\'"`\n\r\t\b\f\v\0\u2028\u2029]|\$\{/g, (c) =>
        c === "${" ? "\\${" : ({ "\n": "\\n", "\r": "\\r", "\t": "\\t", "\b": "\\b", "\f": "\\f", "\v": "\\v", "\0": "\\0", "\u2028": "\\u2028", "\u2029": "\\u2029" } as Record<string, string>)[c] ?? "\\" + c,
      ),
    unescape: jsUnescape,
  },
  {
    id: "html",
    label: "HTML",
    escape: (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
    unescape: (s) => {
      const t = document.createElement("textarea");
      t.innerHTML = s;
      return t.value;
    },
  },
  {
    id: "xml",
    label: "XML",
    escape: (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"),
    unescape: (s) =>
      s
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
        .replace(/&amp;/g, "&"),
  },
  {
    id: "sql",
    label: "SQL (chaîne)",
    escape: (s) => s.replace(/'/g, "''"),
    unescape: (s) => s.replace(/''/g, "'"),
  },
  {
    id: "shell",
    label: "Shell (bash)",
    escape: (s) => (s === "" ? "''" : /^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`),
  },
  {
    id: "regex",
    label: "Regex",
    escape: (s) => s.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&"),
    unescape: (s) => s.replace(/\\([.*+?^${}()|[\]\\/-])/g, "$1"),
  },
  {
    id: "url",
    label: "URL (composant)",
    escape: encodeURIComponent,
    unescape: decodeURIComponent,
  },
  {
    id: "csv",
    label: "CSV (champ)",
    escape: (s) => (/[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s),
    unescape: (s) => (/^".*"$/s.test(s) ? s.slice(1, -1).replace(/""/g, '"') : s),
  },
  {
    id: "unicode",
    label: "Unicode (\\uXXXX)",
    escape: (s) =>
      Array.from(s)
        .map((c) => {
          const cp = c.codePointAt(0)!;
          if (cp < 128 && cp >= 32) return c;
          return cp > 0xffff ? `\\u{${cp.toString(16)}}` : `\\u${cp.toString(16).padStart(4, "0")}`;
        })
        .join(""),
    unescape: jsUnescape,
  },
];

const EXAMPLE = `Il a dit : "C'est l'été !"\n\tChemin : C:\\Users\\dj & <root>\n1 + 1 = 2 ? Oui. 😀`;

export function StringEscapeTool() {
  const [formatId, setFormatId] = useState("json");
  const [direction, setDirection] = useState<Direction>("escape");
  const [input, setInput] = useState(EXAMPLE);
  const format = FORMATS.find((f) => f.id === formatId)!;
  const canUnescape = !!format.unescape;
  const dir = canUnescape ? direction : "escape";

  const { output, error } = useMemo(() => {
    try {
      return { output: dir === "escape" ? format.escape(input) : format.unescape!(input), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Séquence invalide." };
    }
  }, [format, dir, input]);

  return (
    <div>
      <div className="emoji-groups mb-md" role="group" aria-label="Format">
        {FORMATS.map((f) => (
          <button key={f.id} type="button" className={"btn" + (f.id === formatId ? " is-active" : "")} onClick={() => setFormatId(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Direction>
          value={dir}
          onChange={setDirection}
          options={canUnescape ? [
            { value: "escape", label: "Échapper" },
            { value: "unescape", label: "Déséchapper" },
          ] : [{ value: "escape", label: "Échapper" }]}
        />
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (!output) return;
            setInput(output);
            if (canUnescape) setDirection(dir === "escape" ? "unescape" : "escape");
          }}
        >
          Inverser
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
            <span className="label">{dir === "escape" ? "Échappé" : "Déséchappé"}</span>
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
