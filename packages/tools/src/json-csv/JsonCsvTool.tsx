import { useMemo, useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";
import { JsonTree } from "../shared/JsonTree";
import { CodeView, StructuredOutput } from "../shared/CodeView";

type Mode = "toCsv" | "toJson";
type Delimiter = "," | ";" | "\t";

const EXAMPLE_JSON = JSON.stringify(
  [
    { id: 1, name: "Alice", email: "alice@example.com", team: { name: "Infra", floor: 3 }, active: true },
    { id: 2, name: "Bob", email: "bob@example.com", team: { name: "Dev", floor: 2 }, active: false },
    { id: 3, name: 'Chloé "CJ"', email: "chloe@example.com", team: { name: "Sécu", floor: 3 }, active: true },
  ],
  null,
  2,
);
const EXAMPLE_CSV = "id,name,email,active\n1,Alice,alice@example.com,true\n2,Bob,bob@example.com,false\n3,\"Chloé \"\"CJ\"\"\",chloe@example.com,true\n";

function flatten(value: unknown, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (Array.isArray(value)) {
    out[prefix] = JSON.stringify(value);
  } else {
    out[prefix] = value;
  }
  return out;
}

function csvCell(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : String(value);
  return s.includes(delimiter) || /["\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function jsonToCsv(input: string, delimiter: Delimiter, flat: boolean): string {
  const data = JSON.parse(input);
  const rows: unknown[] = Array.isArray(data) ? data : [data];
  const records = rows.map((r) => (r && typeof r === "object" ? (flat ? flatten(r) : (r as Record<string, unknown>)) : { value: r }));
  const headers: string[] = [];
  for (const r of records) for (const k of Object.keys(r)) if (!headers.includes(k)) headers.push(k);
  const lines = [headers.map((h) => csvCell(h, delimiter)).join(delimiter)];
  for (const r of records) {
    lines.push(
      headers
        .map((h) => {
          const v = r[h];
          return csvCell(v && typeof v === "object" ? JSON.stringify(v) : v, delimiter);
        })
        .join(delimiter),
    );
  }
  return lines.join("\n") + "\n";
}

/** RFC 4180 parser: quoted fields, escaped quotes, newlines inside quotes. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === delimiter) {
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
  if (quoted) throw new Error("Guillemet non fermé.");
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ""));
}

function inferType(s: string): unknown {
  if (s === "") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(s) && s.length < 16) return Number(s);
  return s;
}

function unflatten(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const parts = key.split(".");
    let node = out;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) node[p] = value;
      else node = (node[p] ??= {}) as Record<string, unknown>;
    });
  }
  return out;
}

function csvToJson(input: string, delimiter: Delimiter, header: boolean, infer: boolean, nested: boolean): unknown[] {
  const rows = parseCsv(input, delimiter);
  if (!rows.length) return [];
  const conv = (s: string) => (infer ? inferType(s) : s);
  if (!header) return rows.map((r) => r.map(conv));
  const [head, ...body] = rows;
  return body.map((r) => {
    const rec = Object.fromEntries(head.map((h, i) => [h, conv(r[i] ?? "")]));
    return nested ? unflatten(rec) : rec;
  });
}

function guessDelimiter(text: string): Delimiter {
  const first = text.split("\n")[0] ?? "";
  const counts = { ",": first.split(",").length, ";": first.split(";").length, "\t": first.split("\t").length };
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Delimiter) ?? ",";
}

export function JsonCsvTool() {
  const [mode, setMode] = useState<Mode>("toCsv");
  const [input, setInput] = useState(EXAMPLE_JSON);
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [flat, setFlat] = useState(true);
  const [header, setHeader] = useState(true);
  const [infer, setInfer] = useState(true);

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", data: undefined as unknown, error: "", rows: 0 };
    try {
      if (mode === "toCsv") {
        const output = jsonToCsv(input, delimiter, flat);
        return { output, data: undefined, error: "", rows: output.trim().split("\n").length - 1 };
      }
      const data = csvToJson(input, delimiter, header, infer, flat);
      return { output: JSON.stringify(data, null, 2), data, error: "", rows: data.length };
    } catch (e) {
      return { output: "", data: undefined, error: e instanceof Error ? e.message : "Entrée invalide.", rows: 0 };
    }
  }, [input, mode, delimiter, flat, header, infer]);

  const table = useMemo(() => {
    if (mode !== "toCsv" || !result.output) return null;
    try {
      return parseCsv(result.output, delimiter).slice(0, 51);
    } catch {
      return null;
    }
  }, [mode, result.output, delimiter]);

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={(m) => {
            setMode(m);
            setInput(m === "toCsv" ? EXAMPLE_JSON : EXAMPLE_CSV);
          }}
          options={[
            { value: "toCsv", label: "JSON → CSV" },
            { value: "toJson", label: "CSV → JSON" },
          ]}
        />
        <SegmentedControl<Delimiter>
          value={delimiter}
          onChange={setDelimiter}
          options={[
            { value: ",", label: "Virgule" },
            { value: ";", label: "Point-virgule" },
            { value: "\t", label: "Tabulation" },
          ]}
        />
        <label className="check-row">
          <input type="checkbox" checked={flat} onChange={(e) => setFlat(e.target.checked)} />
          {mode === "toCsv" ? "Aplatir les objets (a.b)" : "Recréer les objets (a.b)"}
        </label>
        {mode === "toJson" && (
          <>
            <label className="check-row">
              <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} />
              Première ligne = en-têtes
            </label>
            <label className="check-row">
              <input type="checkbox" checked={infer} onChange={(e) => setInfer(e.target.checked)} />
              Détecter nombres et booléens
            </label>
          </>
        )}
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "toCsv" ? "JSON" : "CSV"}</span>
            <span className="meta">{input.length} car.</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (mode === "toJson") setDelimiter(guessDelimiter(e.target.value));
            }}
            spellCheck={false}
          />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "toCsv" ? "CSV" : "JSON"}</span>
            <span className="meta">
              {result.rows} ligne{result.rows > 1 ? "s" : ""}
            </span>
          </div>
          {mode === "toCsv" ? (
            <CodeView code={result.error || result.output} language="csv" error={!!result.error} />
          ) : (
            <StructuredOutput
              text={result.output}
              language="json"
              error={result.error}
              tree={result.data !== undefined ? <JsonTree data={result.data} /> : undefined}
            />
          )}
          <div className="panel-tools">
            <CopyButton getText={() => result.output} />
          </div>
        </div>
      </div>

      {table && table.length > 1 && (
        <div className="panel mt-lg" style={{ minHeight: 0 }}>
          <div className="panel-head">
            <span className="label">Aperçu du tableau</span>
            <span className="meta">{table.length > 50 ? "50 premières lignes" : `${table.length - 1} lignes`}</span>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {table[0].map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.slice(1, 51).map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
