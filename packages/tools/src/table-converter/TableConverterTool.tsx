import { useMemo, useState } from "react";
import { CopyButton, Icon } from "@toolbox/ui";
import { CodeView, type CodeLanguage } from "../shared/CodeView";

type In = "auto" | "csv" | "tsv" | "markdown" | "html" | "json";
type Out = "markdown" | "html" | "ascii" | "unicode" | "csv" | "json" | "latex" | "jira";
type Align = "left" | "center" | "right";

const EXAMPLE = `Service,Port,Statut,Latence (ms)
nginx,443,OK,12
postgres,5432,OK,3
redis,6379,Dégradé,48
kafka,9092,KO,
`;

function parseDelimited(text: string, sep: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') q = false;
      else field += c;
    } else if (c === '"' && !field) q = true;
    else if (c === sep) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows.filter((r) => r.some((c) => c.trim()));
}

function parseMarkdown(text: string): { rows: string[][]; align: Align[] } {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|") || l.includes("|"));
  const cells = (l: string) => l.replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
  const sepIdx = lines.findIndex((l) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(l));
  const align: Align[] = sepIdx >= 0 ? cells(lines[sepIdx]).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left")) : [];
  return { rows: lines.filter((_, i) => i !== sepIdx).map(cells), align };
}

function parseHtml(text: string): string[][] {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const table = doc.querySelector("table");
  if (!table) throw new Error("Aucune balise <table> trouvée.");
  return Array.from(table.querySelectorAll("tr")).map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent ?? "").trim().replace(/\s+/g, " ")));
}

function parseJson(text: string): string[][] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("Un tableau JSON est attendu.");
  if (data.every(Array.isArray)) return data.map((r: unknown[]) => r.map((c) => (c === null || c === undefined ? "" : String(c))));
  const keys: string[] = [];
  for (const r of data) if (r && typeof r === "object") for (const k of Object.keys(r)) if (!keys.includes(k)) keys.push(k);
  return [keys, ...data.map((r: Record<string, unknown>) => keys.map((k) => (r?.[k] === null || r?.[k] === undefined ? "" : typeof r[k] === "object" ? JSON.stringify(r[k]) : String(r[k]))))];
}

function detect(text: string): Exclude<In, "auto"> {
  const t = text.trim();
  if (/^<|<table/i.test(t)) return "html";
  if (/^[[{]/.test(t)) return "json";
  if (/^\|/.test(t) || /\n\s*\|?\s*:?-{3,}/.test(t)) return "markdown";
  const first = t.split("\n")[0];
  return (first.match(/\t/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? "tsv" : "csv";
}

/** Visual width: CJK and emoji take two terminal columns. */
function width(s: string): number {
  let w = 0;
  for (const ch of s) w += /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]|\p{Extended_Pictographic}/u.test(ch) ? 2 : 1;
  return w;
}
function pad(s: string, w: number, a: Align): string {
  const diff = w - width(s);
  if (diff <= 0) return s;
  if (a === "right") return " ".repeat(diff) + s;
  if (a === "center") return " ".repeat(Math.floor(diff / 2)) + s + " ".repeat(Math.ceil(diff / 2));
  return s + " ".repeat(diff);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render(rows: string[][], out: Out, align: Align[], header: boolean): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const norm = rows.map((r) => Array.from({ length: cols }, (_, i) => r[i] ?? ""));
  const al = (i: number): Align => align[i] ?? (norm.slice(header ? 1 : 0).every((r) => r[i] === "" || /^-?[\d\s.,%€$]+$/.test(r[i])) ? "right" : "left");
  const widths = Array.from({ length: cols }, (_, i) => Math.max(3, ...norm.map((r) => width(r[i]))));
  const [head, ...body] = header ? norm : [Array.from({ length: cols }, (_, i) => `Col ${i + 1}`), ...norm];

  switch (out) {
    case "markdown": {
      const line = (r: string[]) => "| " + r.map((c, i) => pad(c.replace(/\|/g, "\\|"), widths[i], al(i))).join(" | ") + " |";
      const sep = "| " + widths.map((w, i) => (al(i) === "center" ? ":" + "-".repeat(w - 2) + ":" : al(i) === "right" ? "-".repeat(w - 1) + ":" : "-".repeat(w))).join(" | ") + " |";
      return [line(head), sep, ...body.map(line)].join("\n") + "\n";
    }
    case "html":
      return `<table>\n  <thead>\n    <tr>\n${head.map((c, i) => `      <th${al(i) !== "left" ? ` style="text-align: ${al(i)}"` : ""}>${esc(c)}</th>`).join("\n")}\n    </tr>\n  </thead>\n  <tbody>\n${body.map((r) => `    <tr>\n${r.map((c, i) => `      <td${al(i) !== "left" ? ` style="text-align: ${al(i)}"` : ""}>${esc(c)}</td>`).join("\n")}\n    </tr>`).join("\n")}\n  </tbody>\n</table>\n`;
    case "ascii": {
      const border = "+" + widths.map((w) => "-".repeat(w + 2)).join("+") + "+";
      const line = (r: string[]) => "| " + r.map((c, i) => pad(c, widths[i], al(i))).join(" | ") + " |";
      return [border, line(head), border.replace(/-/g, "="), ...body.map(line), border].join("\n") + "\n";
    }
    case "unicode": {
      const hl = (l: string, m: string, r: string) => l + widths.map((w) => "─".repeat(w + 2)).join(m) + r;
      const line = (r: string[]) => "│ " + r.map((c, i) => pad(c, widths[i], al(i))).join(" │ ") + " │";
      return [hl("┌", "┬", "┐"), line(head), hl("├", "┼", "┤"), ...body.map(line), hl("└", "┴", "┘")].join("\n") + "\n";
    }
    case "csv":
      return [head, ...body].map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n") + "\n";
    case "json":
      return JSON.stringify(body.map((r) => Object.fromEntries(head.map((h, i) => [h, /^-?\d+(\.\d+)?$/.test(r[i]) ? Number(r[i]) : r[i]]))), null, 2) + "\n";
    case "latex": {
      const texEsc = (s: string) => s.replace(/([&%$#_{}])/g, "\\$1").replace(/~/g, "\\textasciitilde{}").replace(/\^/g, "\\textasciicircum{}");
      const spec = widths.map((_, i) => al(i)[0]).join(" ");
      return `\\begin{tabular}{${spec}}\n\\hline\n${head.map(texEsc).join(" & ")} \\\\\n\\hline\n${body.map((r) => r.map(texEsc).join(" & ") + " \\\\").join("\n")}\n\\hline\n\\end{tabular}\n`;
    }
    case "jira":
      return [`|| ${head.join(" || ")} ||`, ...body.map((r) => `| ${r.map((c) => c || " ").join(" | ")} |`)].join("\n") + "\n";
  }
}

const OUTS: { id: Out; label: string; lang: CodeLanguage }[] = [
  { id: "markdown", label: "Markdown", lang: "text" },
  { id: "html", label: "HTML", lang: "xml" },
  { id: "ascii", label: "ASCII", lang: "text" },
  { id: "unicode", label: "Unicode (─│┼)", lang: "text" },
  { id: "csv", label: "CSV", lang: "csv" },
  { id: "json", label: "JSON", lang: "json" },
  { id: "latex", label: "LaTeX", lang: "text" },
  { id: "jira", label: "Jira / Confluence", lang: "text" },
];

export function TableConverterTool() {
  const [input, setInput] = useState(EXAMPLE);
  const [inFmt, setInFmt] = useState<In>("auto");
  const [out, setOut] = useState<Out>("markdown");
  const [header, setHeader] = useState(true);

  const result = useMemo(() => {
    try {
      const fmt = inFmt === "auto" ? detect(input) : inFmt;
      let rows: string[][];
      let align: Align[] = [];
      if (fmt === "csv") rows = parseDelimited(input, input.split("\n")[0].includes(";") && !input.split("\n")[0].includes(",") ? ";" : ",");
      else if (fmt === "tsv") rows = parseDelimited(input, "\t");
      else if (fmt === "markdown") ({ rows, align } = parseMarkdown(input));
      else if (fmt === "html") rows = parseHtml(input);
      else rows = parseJson(input);
      if (!rows.length) return { fmt, text: "", error: "", rows: 0, cols: 0 };
      return { fmt, text: render(rows, out, align, header), error: "", rows: rows.length - (header ? 1 : 0), cols: Math.max(...rows.map((r) => r.length)) };
    } catch (e) {
      return { fmt: inFmt, text: "", error: e instanceof Error ? e.message : "Entrée illisible.", rows: 0, cols: 0 };
    }
  }, [input, inFmt, out, header]);

  return (
    <div>
      <div className="panel-tools mb-md">
        <label className="check-row">
          Entrée
          <select className="input" value={inFmt} onChange={(e) => setInFmt(e.target.value as In)} style={{ width: "auto" }}>
            <option value="auto">Détection auto{inFmt === "auto" && result.fmt !== "auto" ? ` (${result.fmt.toUpperCase()})` : ""}</option>
            <option value="csv">CSV</option>
            <option value="tsv">TSV / copié d'Excel</option>
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} />
          Première ligne = en-têtes
        </label>
      </div>
      <div className="emoji-groups mb-md">
        {OUTS.map((o) => (
          <button key={o.id} type="button" className={"btn" + (o.id === out ? " is-active" : "")} onClick={() => setOut(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Tableau source</span>
            <span className="meta">
              {result.rows} lignes × {result.cols} colonnes
            </span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder="Collez un CSV, des cellules copiées depuis Excel / Sheets, un tableau Markdown ou HTML…" />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{OUTS.find((o) => o.id === out)!.label}</span>
          </div>
          <CodeView code={result.error || result.text} language={result.error ? "text" : OUTS.find((o) => o.id === out)!.lang} error={!!result.error} />
          <div className="panel-tools">
            <CopyButton getText={() => result.text} />
          </div>
        </div>
      </div>
    </div>
  );
}
