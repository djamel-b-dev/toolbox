export type TsStyle = "interface" | "type";
export type CsStyle = "positional" | "record" | "class";

// ---------- inferred type model, shared by every output language ----------
type Scalar = "string" | "int" | "long" | "float" | "bool" | "date" | "guid" | "unknown";
export type Ty = { k: "scalar"; s: Scalar } | { k: "null" } | { k: "array"; item: Ty } | { k: "object"; ref: string } | { k: "union"; types: Ty[] };
export interface Field {
  key: string;
  type: Ty;
  optional: boolean;
  nullable: boolean;
}
export interface Model {
  name: string;
  fields: Field[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function pascal(s: string): string {
  const out = s.replace(/[^A-Za-z0-9]+(.)?/g, (_m, c: string | undefined) => (c ? c.toUpperCase() : "")).replace(/^(.)/, (c) => c.toUpperCase());
  return /^[A-Za-z_]/.test(out) ? out : `T${out}`;
}
export function camel(s: string): string {
  const p = pascal(s);
  return p[0].toLowerCase() + p.slice(1);
}
function singular(s: string): string {
  if (/ies$/i.test(s)) return s.slice(0, -3) + "y";
  if (/(ss|us)$/i.test(s)) return s;
  if (/s$/i.test(s)) return s.slice(0, -1);
  return s + "Item";
}

const key = (t: Ty): string => (t.k === "scalar" ? t.s : t.k === "null" ? "null" : t.k === "array" ? `${key(t.item)}[]` : t.k === "object" ? `#${t.ref}` : t.types.map(key).sort().join("|"));

function mergeScalars(a: Scalar, b: Scalar): Scalar {
  if (a === b) return a;
  const nums: Scalar[] = ["int", "long", "float"];
  if (nums.includes(a) && nums.includes(b)) return a === "float" || b === "float" ? "float" : "long";
  if ((a === "date" || a === "guid") && b === "string") return "string";
  if ((b === "date" || b === "guid") && a === "string") return "string";
  return "unknown";
}

function union(types: Ty[]): Ty {
  const uniq = [...new Map(types.map((t) => [key(t), t])).values()];
  const scalars = uniq.filter((t): t is { k: "scalar"; s: Scalar } => t.k === "scalar");
  const rest = uniq.filter((t) => t.k !== "scalar");
  const merged: Ty[] = scalars.length ? [{ k: "scalar", s: scalars.map((t) => t.s).reduce(mergeScalars) }, ...rest] : rest;
  return merged.length === 1 ? merged[0] : { k: "union", types: merged };
}

export class Inferrer {
  models = new Map<string, Model>();
  shapes = new Map<string, string>();

  infer(value: unknown, hint: string): Ty {
    if (value === null) return { k: "null" };
    if (Array.isArray(value)) {
      if (!value.length) return { k: "array", item: { k: "scalar", s: "unknown" } };
      const objs = value.filter((v) => v && typeof v === "object" && !Array.isArray(v)) as Record<string, unknown>[];
      const items: Ty[] = value.filter((v) => !(v && typeof v === "object" && !Array.isArray(v)) && v !== null).map((v) => this.infer(v, singular(hint)));
      if (objs.length) items.push(this.object(objs, singular(hint)));
      const t = items.length ? union(items) : ({ k: "scalar", s: "unknown" } as Ty);
      return { k: "array", item: t };
    }
    if (typeof value === "object") return this.object([value as Record<string, unknown>], hint);
    if (typeof value === "string") return { k: "scalar", s: GUID.test(value) ? "guid" : ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)) ? "date" : "string" };
    if (typeof value === "number") return { k: "scalar", s: !Number.isInteger(value) ? "float" : Math.abs(value) > 2147483647 ? "long" : "int" };
    if (typeof value === "boolean") return { k: "scalar", s: "bool" };
    return { k: "scalar", s: "unknown" };
  }

  /** Merges several sample objects into one model; keys missing from some samples become optional. */
  object(samples: Record<string, unknown>[], hint: string): Ty {
    const keys: string[] = [];
    for (const s of samples) for (const k of Object.keys(s)) if (!keys.includes(k)) keys.push(k);
    const fields: Field[] = keys.map((k) => {
      const present = samples.filter((s) => k in s);
      const values = present.map((s) => s[k]);
      const nonNull = values.filter((v) => v !== null);
      const objects = nonNull.filter((v) => v && typeof v === "object" && !Array.isArray(v)) as Record<string, unknown>[];
      let type: Ty;
      if (objects.length && objects.length === nonNull.length) type = this.object(objects, pascal(k));
      else if (nonNull.length) type = union(nonNull.map((v) => this.infer(v, pascal(k))));
      else type = { k: "null" };
      return { key: k, type, optional: present.length < samples.length, nullable: values.some((v) => v === null) };
    });
    const sig = fields.map((f) => `${f.key}:${key(f.type)}:${f.optional}:${f.nullable}`).join(";");
    const existing = this.shapes.get(sig);
    if (existing) return { k: "object", ref: existing };
    let name = pascal(hint) || "Root";
    for (let i = 2; this.models.has(name); i++) name = `${pascal(hint)}${i}`;
    this.shapes.set(sig, name);
    this.models.set(name, { name, fields });
    return { k: "object", ref: name };
  }
}

// ---------- TypeScript ----------
function tsType(t: Ty): string {
  switch (t.k) {
    case "null":
      return "null";
    case "scalar":
      return { string: "string", int: "number", long: "number", float: "number", bool: "boolean", date: "string", guid: "string", unknown: "unknown" }[t.s];
    case "array": {
      const inner = tsType(t.item);
      return t.item.k === "union" ? `(${inner})[]` : `${inner}[]`;
    }
    case "object":
      return t.ref;
    case "union":
      return t.types.map(tsType).join(" | ");
  }
}

export function emitTs(inf: Inferrer, root: Ty, rootName: string, style: TsStyle, optionalNull: boolean, readonly: boolean): string {
  const out: string[] = [];
  for (const m of [...inf.models.values()].reverse()) {
    const lines = m.fields.map((f) => {
      let t = f.type.k === "null" ? "unknown" : tsType(f.type);
      const optional = f.optional || (optionalNull && f.nullable);
      if (f.nullable && !optionalNull && f.type.k !== "null") t += " | null";
      if (f.type.k === "null" && !optionalNull) t = "null";
      const k = /^[A-Za-z_$][\w$]*$/.test(f.key) ? f.key : JSON.stringify(f.key);
      return `  ${readonly ? "readonly " : ""}${k}${optional ? "?" : ""}: ${t};`;
    });
    out.push(style === "interface" ? `export interface ${m.name} {\n${lines.join("\n")}\n}` : `export type ${m.name} = {\n${lines.join("\n")}\n};`);
  }
  if (root.k !== "object") out.push(`export type ${pascal(rootName)} = ${tsType(root)};`);
  return out.join("\n\n") + "\n";
}

// ---------- C# ----------
const CS_KEYWORDS = new Set("abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while".split(" "));

function csType(t: Ty, list: "List" | "array"): string {
  switch (t.k) {
    case "null":
      return "object";
    case "scalar":
      return { string: "string", int: "int", long: "long", float: "double", bool: "bool", date: "DateTimeOffset", guid: "Guid", unknown: "JsonElement" }[t.s];
    case "array":
      return list === "List" ? `List<${csType(t.item, list)}>` : `${csType(t.item, list)}[]`;
    case "object":
      return t.ref;
    case "union":
      // C# has no union types: fall back to the raw JSON value.
      return "JsonElement";
  }
}

const isValueType = (t: Ty) => t.k === "scalar" && ["int", "long", "float", "bool", "date", "guid"].includes(t.s);

export interface CsOptions {
  style: CsStyle;
  namespace: string;
  list: "List" | "array";
  nullable: boolean;
  attributes: boolean;
}

export function emitCs(inf: Inferrer, root: Ty, rootName: string, o: CsOptions): string {
  let usesJson = false;
  let usesElement = false;
  const blocks: string[] = [];
  for (const m of [...inf.models.values()].reverse()) {
    const props = m.fields.map((f) => {
      let t = csType(f.type, o.list);
      if (t === "JsonElement") usesElement = true;
      const maybeMissing = f.nullable || f.optional || f.type.k === "null";
      if (maybeMissing && (o.nullable || isValueType(f.type))) t += "?";
      let name = pascal(f.key);
      if (name === m.name) name += "Value";
      const safeName = CS_KEYWORDS.has(name) ? `@${name}` : name;
      // Assumes JsonSerializerDefaults.Web (camelCase, as in ASP.NET Core): only keys that aren't plain camelCase need mapping.
      const needsAttr = o.attributes && camel(f.key) !== f.key;
      if (needsAttr) usesJson = true;
      return { t, name: safeName, key: f.key, attr: needsAttr, required: !maybeMissing && !isValueType(f.type) };
    });
    if (o.style === "positional") {
      const params = props.map((p) => `    ${p.attr ? `[property: JsonPropertyName(${JSON.stringify(p.key)})] ` : ""}${p.t} ${p.name}`);
      blocks.push(`public record ${m.name}(\n${params.join(",\n")}\n);`);
    } else {
      const kw = o.style === "record" ? "record" : "class";
      const lines = props.map((p) => {
        const attr = p.attr ? `    [JsonPropertyName(${JSON.stringify(p.key)})]\n` : "";
        const init = o.style === "record" ? "init" : "set";
        const req = o.nullable && p.required ? "required " : "";
        return `${attr}    public ${req}${p.t} ${p.name} { get; ${init}; }`;
      });
      blocks.push(`public ${kw} ${m.name}\n{\n${lines.join("\n")}\n}`);
    }
  }
  if (root.k === "array") blocks.push(`// Racine : ${csType(root, o.list)}\n// var data = JsonSerializer.Deserialize<${csType(root, o.list)}>(json);`);
  const usesSystem = [...inf.models.values()].some((m) => m.fields.some((f) => /DateTimeOffset|Guid/.test(csType(f.type, o.list))));
  const header = [usesSystem ? "using System;" : "", o.list === "List" ? "using System.Collections.Generic;" : "", usesElement ? "using System.Text.Json;" : "", usesJson ? "using System.Text.Json.Serialization;" : ""].filter(Boolean);
  const nsLine = o.namespace.trim() ? `namespace ${o.namespace.trim()};\n\n` : "";
  const usage = root.k === "object" ? `\n// var ${camel(rootName) || "data"} = JsonSerializer.Deserialize<${(root as { ref: string }).ref}>(json);\n` : "\n";
  return (header.length ? header.join("\n") + "\n\n" : "") + (o.nullable ? "#nullable enable\n\n" : "") + nsLine + blocks.join("\n\n") + "\n" + usage;
}


// ---------- helpers shared by the other languages ----------
/** Models in declaration order: the root first, then the types it references. */
const ordered = (inf: Inferrer) => [...inf.models.values()].reverse();
const missing = (f: Field) => f.optional || f.nullable || f.type.k === "null";

export function snake(s: string): string {
  const out = s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  return /^[a-z_]/.test(out) ? out : `f_${out}`;
}

function uses(inf: Inferrer, pred: (t: Ty) => boolean): boolean {
  const walk = (t: Ty): boolean => pred(t) || (t.k === "array" && walk(t.item)) || (t.k === "union" && t.types.some(walk));
  return [...inf.models.values()].some((m) => m.fields.some((f) => walk(f.type)));
}
const isScalar = (s: string) => (t: Ty) => t.k === "scalar" && t.s === s;
const isLoose = (t: Ty) => t.k === "union" || t.k === "null" || (t.k === "scalar" && t.s === "unknown");

// ---------- Python ----------
export type PyStyle = "pydantic" | "dataclass";
const PY_KEYWORDS = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "));

function pyType(t: Ty): string {
  switch (t.k) {
    case "null":
      return "None";
    case "scalar":
      return { string: "str", int: "int", long: "int", float: "float", bool: "bool", date: "datetime", guid: "UUID", unknown: "Any" }[t.s];
    case "array":
      return `list[${pyType(t.item)}]`;
    case "object":
      return t.ref;
    case "union":
      return t.types.map(pyType).join(" | ");
  }
}

export function emitPython(inf: Inferrer, style: PyStyle): string {
  let aliases = false;
  const blocks = ordered(inf).map((m) => {
    // Dataclass fields with a default must come after those without one.
    const fields = style === "dataclass" ? [...m.fields].sort((a, b) => Number(missing(a)) - Number(missing(b))) : m.fields;
    const lines = fields.map((f) => {
      let name = snake(f.key);
      if (PY_KEYWORDS.has(name)) name += "_";
      let t = f.type.k === "null" ? "Any" : pyType(f.type);
      if (missing(f) && f.type.k !== "null") t += " | None";
      const renamed = name !== f.key;
      if (style === "pydantic") {
        if (renamed) aliases = true;
        const def = missing(f) ? (renamed ? ` = Field(default=None, alias=${JSON.stringify(f.key)})` : " = None") : renamed ? ` = Field(alias=${JSON.stringify(f.key)})` : "";
        return `    ${name}: ${t}${def}`;
      }
      return `    ${name}: ${t}${missing(f) ? " = None" : ""}${renamed ? `  # JSON : ${JSON.stringify(f.key)}` : ""}`;
    });
    const head = style === "pydantic" ? `class ${m.name}(BaseModel):` : `@dataclass\nclass ${m.name}:`;
    const config = style === "pydantic" && aliases ? "    model_config = ConfigDict(populate_by_name=True)\n\n" : "";
    return `${head}\n${config}${lines.join("\n") || "    pass"}`;
  });
  const imports = ["from __future__ import annotations", ""];
  if (uses(inf, isScalar("date"))) imports.push("from datetime import datetime");
  if (uses(inf, isScalar("guid"))) imports.push("from uuid import UUID");
  if (uses(inf, (t) => isLoose(t) || isScalar("unknown")(t)) || [...inf.models.values()].some((m) => m.fields.some((f) => f.type.k === "null"))) imports.push("from typing import Any");
  imports.push(style === "pydantic" ? `from pydantic import BaseModel${aliases ? ", ConfigDict, Field" : ""}` : "from dataclasses import dataclass");
  const root = ordered(inf)[0]?.name;
  const usage = style === "pydantic" && root ? `\n\n# ${snake(root)} = ${root}.model_validate_json(json_text)` : "";
  return imports.join("\n") + "\n\n\n" + blocks.join("\n\n\n") + usage + "\n";
}

// ---------- Java ----------
export type JavaStyle = "record" | "lombok";
const JAVA_KEYWORDS = new Set("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while record var yield true false null".split(" "));
function javaType(t: Ty, boxed: boolean): string {
  switch (t.k) {
    case "null":
      return "Object";
    case "scalar": {
      const prim = { int: "int", long: "long", float: "double", bool: "boolean" } as Record<string, string>;
      const box = { int: "Integer", long: "Long", float: "Double", bool: "Boolean" } as Record<string, string>;
      if (prim[t.s]) return boxed ? box[t.s] : prim[t.s];
      return { string: "String", date: "OffsetDateTime", guid: "UUID", unknown: "JsonNode" }[t.s as "string"];
    }
    case "array":
      return `List<${javaType(t.item, true)}>`;
    case "object":
      return t.ref;
    case "union":
      return "JsonNode";
  }
}

export function emitJava(inf: Inferrer, style: JavaStyle, pkg: string): string {
  const blocks = ordered(inf).map((m) => {
    const fields = m.fields.map((f) => {
      let name = camel(f.key);
      if (JAVA_KEYWORDS.has(name)) name += "_";
      return { name, t: javaType(f.type, missing(f)), attr: name !== f.key, key: f.key };
    });
    if (style === "record") {
      const params = fields.map((f) => `        ${f.attr ? `@JsonProperty(${JSON.stringify(f.key)}) ` : ""}${f.t} ${f.name}`);
      return `public record ${m.name}(\n${params.join(",\n")}\n) {}`;
    }
    const body = fields.map((f) => `${f.attr ? `    @JsonProperty(${JSON.stringify(f.key)})\n` : ""}    private ${f.t} ${f.name};`);
    return `@Data\n@NoArgsConstructor\n@AllArgsConstructor\npublic class ${m.name} {\n${body.join("\n")}\n}`;
  });
  // Java wants one public top-level type per file: print them as separate files, each with only the imports it needs.
  return ordered(inf)
    .map((m, i) => {
      const block = blocks[i];
      const imports = [
        /OffsetDateTime/.test(block) && "import java.time.OffsetDateTime;",
        /\bList</.test(block) && "import java.util.List;",
        /\bUUID\b/.test(block) && "import java.util.UUID;",
        /@JsonProperty/.test(block) && "import com.fasterxml.jackson.annotation.JsonProperty;",
        /\bJsonNode\b/.test(block) && "import com.fasterxml.jackson.databind.JsonNode;",
        style === "lombok" && "import lombok.AllArgsConstructor;\nimport lombok.Data;\nimport lombok.NoArgsConstructor;",
      ].filter(Boolean);
      const head = (pkg.trim() ? `package ${pkg.trim()};\n\n` : "") + (imports.length ? imports.join("\n") + "\n\n" : "");
      return `// ===== ${m.name}.java =====\n${head}${block}\n`;
    })
    .join("\n");
}

// ---------- Go ----------
function goType(t: Ty): string {
  switch (t.k) {
    case "null":
      return "any";
    case "scalar":
      return { string: "string", int: "int", long: "int64", float: "float64", bool: "bool", date: "time.Time", guid: "string", unknown: "any" }[t.s];
    case "array":
      return `[]${goType(t.item)}`;
    case "object":
      return t.ref;
    case "union":
      return "any";
  }
}
const GO_INITIALISMS = new Set(["id", "url", "uri", "api", "http", "https", "json", "xml", "sql", "ip", "uuid", "html", "css", "db", "tls", "ssh", "cpu", "ttl"]);
function goName(key: string): string {
  const parts = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9]+/).filter(Boolean);
  const out = parts.map((p) => (GO_INITIALISMS.has(p.toLowerCase()) ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1))).join("");
  return /^[A-Za-z]/.test(out) ? out : `F${out}`;
}

export function emitGo(inf: Inferrer, pkg: string, pointers: boolean): string {
  const blocks = ordered(inf).map((m) => {
    const rows = m.fields.map((f) => {
      let t = goType(f.type);
      if (pointers && missing(f) && !t.startsWith("[]") && t !== "any") t = `*${t}`;
      return [goName(f.key), t, `\`json:"${f.key}${missing(f) ? ",omitempty" : ""}"\``];
    });
    // Align columns like gofmt does.
    const w0 = Math.max(0, ...rows.map((r) => r[0].length));
    const w1 = Math.max(0, ...rows.map((r) => r[1].length));
    return `type ${m.name} struct {\n${rows.map((r) => `\t${r[0].padEnd(w0)} ${r[1].padEnd(w1)} ${r[2]}`).join("\n")}\n}`;
  });
  const imp = uses(inf, isScalar("date")) ? 'import "time"\n\n' : "";
  return `package ${pkg.trim() || "models"}\n\n${imp}${blocks.join("\n\n")}\n`;
}

// ---------- Rust ----------
function rustType(t: Ty): string {
  switch (t.k) {
    case "null":
      return "serde_json::Value";
    case "scalar":
      return { string: "String", int: "i64", long: "i64", float: "f64", bool: "bool", date: "String", guid: "String", unknown: "serde_json::Value" }[t.s];
    case "array":
      return `Vec<${rustType(t.item)}>`;
    case "object":
      return t.ref;
    case "union":
      return "serde_json::Value";
  }
}
const RUST_KEYWORDS = new Set("as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self static struct super trait true type unsafe use where while".split(" "));

export function emitRust(inf: Inferrer): string {
  const blocks = ordered(inf).map((m) => {
    const lines = m.fields.map((f) => {
      const name = snake(f.key);
      const safe = RUST_KEYWORDS.has(name) ? `r#${name}` : name;
      let t = rustType(f.type);
      if (missing(f) && f.type.k !== "null") t = `Option<${t}>`;
      const attrs = [name !== f.key ? `rename = ${JSON.stringify(f.key)}` : "", missing(f) && f.type.k !== "null" ? 'skip_serializing_if = "Option::is_none"' : "", f.optional ? "default" : ""].filter(Boolean);
      const dateNote = f.type.k === "scalar" && f.type.s === "date" ? " // ISO 8601 (chrono::DateTime<Utc> avec la feature serde)" : "";
      return `${attrs.length ? `    #[serde(${attrs.join(", ")})]\n` : ""}    pub ${safe}: ${t},${dateNote}`;
    });
    return `#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${m.name} {\n${lines.join("\n")}\n}`;
  });
  return `use serde::{Deserialize, Serialize};\n\n${blocks.join("\n\n")}\n\n// let data: ${ordered(inf)[0]?.name ?? "Root"} = serde_json::from_str(&json)?;\n`;
}

// ---------- Kotlin ----------
function ktType(t: Ty): string {
  switch (t.k) {
    case "null":
      return "JsonElement";
    case "scalar":
      return { string: "String", int: "Int", long: "Long", float: "Double", bool: "Boolean", date: "String", guid: "String", unknown: "JsonElement" }[t.s];
    case "array":
      return `List<${ktType(t.item)}>`;
    case "object":
      return t.ref;
    case "union":
      return "JsonElement";
  }
}

export function emitKotlin(inf: Inferrer, pkg: string): string {
  let serialName = false;
  const blocks = ordered(inf).map((m) => {
    const params = m.fields.map((f) => {
      const name = camel(f.key);
      const attr = name !== f.key;
      if (attr) serialName = true;
      const t = ktType(f.type) + (missing(f) ? "?" : "");
      return `    ${attr ? `@SerialName(${JSON.stringify(f.key)}) ` : ""}val ${/^(val|var|fun|class|object|is|in|when|typealias|interface)$/.test(name) ? `\`${name}\`` : name}: ${t}${missing(f) ? " = null" : ""},`;
    });
    return `@Serializable\ndata class ${m.name}(\n${params.join("\n")}\n)`;
  });
  const imports = ["import kotlinx.serialization.Serializable"];
  if (serialName) imports.push("import kotlinx.serialization.SerialName");
  if (uses(inf, isLoose)) imports.push("import kotlinx.serialization.json.JsonElement");
  return (pkg.trim() ? `package ${pkg.trim()}\n\n` : "") + imports.join("\n") + "\n\n" + blocks.join("\n\n") + `\n\n// val data = Json { ignoreUnknownKeys = true }.decodeFromString<${ordered(inf)[0]?.name ?? "Root"}>(json)\n`;
}

// ---------- Swift ----------
function swiftType(t: Ty): string {
  switch (t.k) {
    case "null":
      return "String";
    case "scalar":
      return { string: "String", int: "Int", long: "Int64", float: "Double", bool: "Bool", date: "Date", guid: "UUID", unknown: "String" }[t.s];
    case "array":
      return `[${swiftType(t.item)}]`;
    case "object":
      return t.ref;
    case "union":
      return "String";
  }
}

const SWIFT_KEYWORDS = new Set("associatedtype class deinit enum extension fileprivate func import init inout internal let open operator private protocol public rethrows static struct subscript typealias var break case continue default defer do else fallthrough for guard if in repeat return switch where while as catch false is nil super self Self throw throws true try".split(" "));

export function emitSwift(inf: Inferrer, mutable: boolean): string {
  const blocks = ordered(inf).map((m) => {
    const fields = m.fields.map((f) => ({ name: camel(f.key), key: f.key, t: swiftType(f.type) + (missing(f) ? "?" : ""), loose: isLoose(f.type) }));
    const esc = (n: string) => (SWIFT_KEYWORDS.has(n) ? `\`${n}\`` : n);
    const props = fields.map((f) => `    ${mutable ? "var" : "let"} ${esc(f.name)}: ${f.t}${f.loose ? " // type JSON variable : à préciser" : ""}`);
    const keys = fields.some((f) => f.name !== f.key) ? `\n\n    enum CodingKeys: String, CodingKey {\n${fields.map((f) => `        case ${esc(f.name)}${f.name !== f.key ? ` = ${JSON.stringify(f.key)}` : ""}`).join("\n")}\n    }` : "";
    return `struct ${m.name}: Codable {\n${props.join("\n")}${keys}\n}`;
  });
  const dates = uses(inf, isScalar("date"));
  return `import Foundation\n\n${blocks.join("\n\n")}\n\n// let decoder = JSONDecoder()${dates ? "\n// decoder.dateDecodingStrategy = .iso8601" : ""}\n// let data = try decoder.decode(${ordered(inf)[0]?.name ?? "Root"}.self, from: jsonData)\n`;
}
