import { useMemo, useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";
import { JsonTree } from "../shared/JsonTree";
import { XmlTree } from "../shared/XmlTree";
import { StructuredOutput } from "../shared/CodeView";

type Mode = "toJson" | "toXml";

const EXAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<library name="Centrale">
  <book id="1" lang="fr">
    <title>Le Petit Prince</title>
    <author>Antoine de Saint-Exupéry</author>
    <year>1943</year>
  </book>
  <book id="2" lang="en">
    <title>Dune</title>
    <author>Frank Herbert</author>
    <year>1965</year>
  </book>
</library>`;

const EXAMPLE_JSON = JSON.stringify(
  { server: { "@name": "web-01", host: "10.0.0.12", ports: { port: [80, 443] }, tags: { tag: ["prod", "eu-west"] } } },
  null,
  2,
);

/**
 * Common "badgerfish-lite" mapping: attributes become `@name` keys, text next
 * to attributes or children becomes `#text`, repeated elements become arrays.
 */
function elementToJson(el: Element, attrPrefix: string, infer: boolean): unknown {
  const obj: Record<string, unknown> = {};
  for (const a of Array.from(el.attributes)) obj[attrPrefix + a.name] = infer ? inferValue(a.value) : a.value;
  const text = Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE || n.nodeType === Node.CDATA_SECTION_NODE)
    .map((n) => n.textContent ?? "")
    .join("")
    .trim();
  const children = Array.from(el.children);
  if (!children.length && !el.attributes.length) return text === "" ? null : infer ? inferValue(text) : text;
  for (const child of children) {
    const value = elementToJson(child, attrPrefix, infer);
    const key = child.tagName;
    if (key in obj) {
      const prev = obj[key];
      obj[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else obj[key] = value;
  }
  if (text) obj["#text"] = infer ? inferValue(text) : text;
  return obj;
}

function inferValue(s: string): unknown {
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(s) && s.length < 16) return Number(s);
  return s;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function validName(name: string): string {
  const cleaned = name.replace(/[^\w.:-]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function jsonToXml(value: unknown, name: string, depth: number, attrPrefix: string): string {
  const pad = "  ".repeat(depth);
  const tag = validName(name);
  if (Array.isArray(value)) return value.map((v) => jsonToXml(v, name, depth, attrPrefix)).join("\n");
  if (value === null || value === undefined) return `${pad}<${tag} />`;
  if (typeof value !== "object") return `${pad}<${tag}>${escapeXml(String(value))}</${tag}>`;
  const entries = Object.entries(value as Record<string, unknown>);
  const attrs = entries
    .filter(([k]) => attrPrefix && k.startsWith(attrPrefix))
    .map(([k, v]) => ` ${validName(k.slice(attrPrefix.length))}="${escapeXml(String(v))}"`)
    .join("");
  const text = entries.find(([k]) => k === "#text")?.[1];
  const children = entries.filter(([k]) => !(attrPrefix && k.startsWith(attrPrefix)) && k !== "#text");
  if (!children.length && text === undefined) return `${pad}<${tag}${attrs} />`;
  if (!children.length) return `${pad}<${tag}${attrs}>${escapeXml(String(text))}</${tag}>`;
  const inner = children.map(([k, v]) => jsonToXml(v, k, depth + 1, attrPrefix)).join("\n");
  const textLine = text !== undefined ? `\n${pad}  ${escapeXml(String(text))}` : "";
  return `${pad}<${tag}${attrs}>${textLine}\n${inner}\n${pad}</${tag}>`;
}

export function XmlJsonTool() {
  const [mode, setMode] = useState<Mode>("toJson");
  const [input, setInput] = useState(EXAMPLE_XML);
  const [attrPrefix, setAttrPrefix] = useState("@");
  const [infer, setInfer] = useState(true);
  const [rootName, setRootName] = useState("root");

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", data: undefined as unknown, doc: undefined as Document | undefined, error: "" };
    try {
      if (mode === "toJson") {
        const doc = new DOMParser().parseFromString(input, "application/xml");
        const err = doc.querySelector("parsererror");
        if (err) throw new Error("XML invalide : " + (err.textContent?.split("\n").find((l) => l.trim()) ?? ""));
        const data = { [doc.documentElement.tagName]: elementToJson(doc.documentElement, attrPrefix, infer) };
        return { output: JSON.stringify(data, null, 2), data, doc: undefined, error: "" };
      }
      const parsed = JSON.parse(input);
      const keys = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed) : [];
      const body = keys.length === 1 ? jsonToXml(parsed[keys[0]], keys[0], 0, attrPrefix) : jsonToXml(parsed, rootName || "root", 0, attrPrefix);
      const output = `<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`;
      const doc = new DOMParser().parseFromString(output, "application/xml");
      return { output, data: undefined, doc: doc.querySelector("parsererror") ? undefined : doc, error: "" };
    } catch (e) {
      return { output: "", data: undefined, doc: undefined, error: e instanceof Error ? e.message : "Entrée invalide." };
    }
  }, [input, mode, attrPrefix, infer, rootName]);

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={(m) => {
            setMode(m);
            setInput(m === "toJson" ? EXAMPLE_XML : EXAMPLE_JSON);
          }}
          options={[
            { value: "toJson", label: "XML → JSON" },
            { value: "toXml", label: "JSON → XML" },
          ]}
        />
        <label className="check-row">
          Préfixe des attributs
          <input className="input" style={{ width: 64 }} value={attrPrefix} onChange={(e) => setAttrPrefix(e.target.value)} />
        </label>
        {mode === "toJson" ? (
          <label className="check-row">
            <input type="checkbox" checked={infer} onChange={(e) => setInfer(e.target.checked)} />
            Détecter nombres et booléens
          </label>
        ) : (
          <label className="check-row">
            Élément racine
            <input className="input" style={{ width: 110 }} value={rootName} onChange={(e) => setRootName(e.target.value)} />
          </label>
        )}
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "toJson" ? "XML" : "JSON"}</span>
            <span className="meta">{input.length} car.</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "toJson" ? "JSON" : "XML"}</span>
            <span className="meta">{result.output.length} car.</span>
          </div>
          <StructuredOutput
            text={result.output}
            language={mode === "toJson" ? "json" : "xml"}
            error={result.error}
            tree={result.data !== undefined ? <JsonTree data={result.data} /> : result.doc ? <XmlTree doc={result.doc} /> : undefined}
          />
          <div className="panel-tools">
            <CopyButton getText={() => result.output} />
          </div>
        </div>
      </div>
    </div>
  );
}
