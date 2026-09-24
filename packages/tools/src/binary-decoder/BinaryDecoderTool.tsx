import { useMemo, useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";
import { JsonTree } from "../shared/JsonTree";
import { StructuredOutput } from "../shared/CodeView";

type Format = "protobuf" | "msgpack" | "cbor";
type Encoding = "auto" | "hex" | "base64";

const EXAMPLES: Record<Format, string> = {
  // { id: 150, name: "Toolbox", tags: ["dev","ops"], owner: { email: "dj@example.com" } }
  protobuf: "08 96 01 12 07 54 6f 6f 6c 62 6f 78 1a 03 64 65 76 1a 03 6f 70 73 22 10 0a 0e 64 6a 40 65 78 61 6d 70 6c 65 2e 63 6f 6d",
  // {"compact": true, "schema": 0, "tags": ["a","b"], "pi": 3.14}
  msgpack: "84 a7 63 6f 6d 70 61 63 74 c3 a6 73 63 68 65 6d 61 00 a4 74 61 67 73 92 a1 61 a1 62 a2 70 69 cb 40 09 1e b8 51 eb 85 1f",
  // {"name": "Toolbox", "version": [1, 2], "ready": true, "created": 1(1790000000)}
  cbor: "a4 64 6e 61 6d 65 67 54 6f 6f 6c 62 6f 78 67 76 65 72 73 69 6f 6e 82 01 02 65 72 65 61 64 79 f5 67 63 72 65 61 74 65 64 c1 1a 6a b1 67 80",
};

function toBytes(input: string, enc: Encoding): Uint8Array {
  const t = input.trim();
  const looksHex = /^(0x)?[0-9a-f\s,:]+$/i.test(t) && t.replace(/[^0-9a-f]/gi, "").length % 2 === 0;
  if (enc === "hex" || (enc === "auto" && looksHex)) {
    const clean = t.replace(/0x/gi, "").replace(/[^0-9a-f]/gi, "");
    if (clean.length % 2) throw new Error("Nombre impair de chiffres hexadécimaux.");
    return Uint8Array.from(clean.match(/../g) ?? [], (h) => parseInt(h, 16));
  }
  const b64 = t.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
  } catch {
    throw new Error("Ni hexadécimal ni base64 valide.");
  }
}

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join(" ");
const utf8 = new TextDecoder("utf-8", { fatal: true });

function tryText(b: Uint8Array): string | null {
  try {
    const s = utf8.decode(b);
    return /^[\P{C}\n\r\t]*$/u.test(s) ? s : null;
  } catch {
    return null;
  }
}

class Reader {
  pos = 0;
  constructor(public b: Uint8Array) {}
  get view() {
    return new DataView(this.b.buffer, this.b.byteOffset, this.b.byteLength);
  }
  need(n: number) {
    if (this.pos + n > this.b.length) throw new Error(`Données tronquées à l'octet ${this.pos}.`);
  }
  u8() {
    this.need(1);
    return this.b[this.pos++];
  }
  bytes(n: number) {
    this.need(n);
    const out = this.b.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
  uint(n: 1 | 2 | 4 | 8): number | bigint {
    this.need(n);
    const v = this.view;
    const p = this.pos;
    this.pos += n;
    if (n === 1) return v.getUint8(p);
    if (n === 2) return v.getUint16(p);
    if (n === 4) return v.getUint32(p);
    const big = v.getBigUint64(p);
    return big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(big) : big;
  }
  int(n: 1 | 2 | 4 | 8): number | bigint {
    this.need(n);
    const v = this.view;
    const p = this.pos;
    this.pos += n;
    if (n === 1) return v.getInt8(p);
    if (n === 2) return v.getInt16(p);
    if (n === 4) return v.getInt32(p);
    const big = v.getBigInt64(p);
    return big >= BigInt(Number.MIN_SAFE_INTEGER) && big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(big) : big;
  }
  float(n: 4 | 8) {
    this.need(n);
    const v = n === 4 ? this.view.getFloat32(this.pos) : this.view.getFloat64(this.pos);
    this.pos += n;
    return v;
  }
  varint(): bigint {
    let result = 0n;
    let shift = 0n;
    for (;;) {
      const b = this.u8();
      result |= BigInt(b & 0x7f) << shift;
      if (!(b & 0x80)) return result;
      shift += 7n;
      if (shift > 70n) throw new Error("Varint trop long.");
    }
  }
}

const big = (v: number | bigint) => (typeof v === "bigint" ? v.toString() : v);

// ---------- MessagePack ----------
function msgpack(r: Reader): unknown {
  const t = r.u8();
  if (t <= 0x7f) return t;
  if (t >= 0xe0) return t - 256;
  if ((t & 0xf0) === 0x80) return mpMap(r, t & 0x0f);
  if ((t & 0xf0) === 0x90) return mpArr(r, t & 0x0f);
  if ((t & 0xe0) === 0xa0) return new TextDecoder().decode(r.bytes(t & 0x1f));
  switch (t) {
    case 0xc0: return null;
    case 0xc2: return false;
    case 0xc3: return true;
    case 0xc4: case 0xc5: case 0xc6: return { $bin: hex(r.bytes(Number(r.uint(t === 0xc4 ? 1 : t === 0xc5 ? 2 : 4)))) };
    case 0xc7: case 0xc8: case 0xc9: {
      const len = Number(r.uint(t === 0xc7 ? 1 : t === 0xc8 ? 2 : 4));
      return mpExt(r.int(1) as number, r.bytes(len));
    }
    case 0xca: return r.float(4);
    case 0xcb: return r.float(8);
    case 0xcc: return r.uint(1);
    case 0xcd: return r.uint(2);
    case 0xce: return r.uint(4);
    case 0xcf: return big(r.uint(8));
    case 0xd0: return r.int(1);
    case 0xd1: return r.int(2);
    case 0xd2: return r.int(4);
    case 0xd3: return big(r.int(8));
    case 0xd4: case 0xd5: case 0xd6: case 0xd7: case 0xd8: {
      const type = r.int(1) as number;
      return mpExt(type, r.bytes(1 << (t - 0xd4)));
    }
    case 0xd9: case 0xda: case 0xdb: return new TextDecoder().decode(r.bytes(Number(r.uint(t === 0xd9 ? 1 : t === 0xda ? 2 : 4))));
    case 0xdc: return mpArr(r, Number(r.uint(2)));
    case 0xdd: return mpArr(r, Number(r.uint(4)));
    case 0xde: return mpMap(r, Number(r.uint(2)));
    case 0xdf: return mpMap(r, Number(r.uint(4)));
  }
  throw new Error(`Octet de type MessagePack inconnu 0x${t.toString(16)} à l'octet ${r.pos - 1}.`);
}
function mpArr(r: Reader, n: number) {
  return Array.from({ length: n }, () => msgpack(r));
}
function mpMap(r: Reader, n: number) {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < n; i++) {
    const k = msgpack(r);
    out[typeof k === "string" ? k : JSON.stringify(k)] = msgpack(r);
  }
  return out;
}
function mpExt(type: number, data: Uint8Array) {
  if (type === -1) {
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let secs = 0;
    if (data.length === 4) secs = dv.getUint32(0);
    else if (data.length === 8) secs = Number(dv.getBigUint64(0) & 0x3ffffffffn);
    else if (data.length === 12) secs = Number(dv.getBigInt64(4));
    return { $timestamp: new Date(secs * 1000).toISOString() };
  }
  return { $ext: type, data: hex(data) };
}

// ---------- CBOR ----------
function cborLen(r: Reader, info: number): number | bigint | null {
  if (info < 24) return info;
  if (info === 24) return r.uint(1);
  if (info === 25) return r.uint(2);
  if (info === 26) return r.uint(4);
  if (info === 27) return r.uint(8);
  if (info === 31) return null;
  throw new Error(`Longueur CBOR invalide (${info}).`);
}
const BREAK = Symbol("break");
function cbor(r: Reader): unknown {
  const ib = r.u8();
  const major = ib >> 5;
  const info = ib & 0x1f;
  if (major === 7) {
    if (info === 20) return false;
    if (info === 21) return true;
    if (info === 22) return null;
    if (info === 23) return { $undefined: true };
    if (info === 25) {
      const h = Number(r.uint(2));
      const e = (h >> 10) & 0x1f;
      const m = h & 0x3ff;
      const v = e === 0 ? m * 2 ** -24 : e === 31 ? (m ? NaN : Infinity) : (1 + m / 1024) * 2 ** (e - 15);
      return h & 0x8000 ? -v : v;
    }
    if (info === 26) return r.float(4);
    if (info === 27) return r.float(8);
    if (info === 31) return BREAK;
    return { $simple: info < 24 ? info : r.u8() };
  }
  const len = cborLen(r, info);
  switch (major) {
    case 0: return big(len!);
    case 1: return typeof len === "bigint" ? (-1n - len).toString() : -1 - (len as number);
    case 2:
    case 3: {
      const chunks: Uint8Array[] = [];
      if (len === null) for (;;) {
        const c = cbor(r);
        if (c === BREAK) break;
        chunks.push(typeof c === "string" ? new TextEncoder().encode(c) : Uint8Array.from((c as { $bytes: string }).$bytes.split(" ").filter(Boolean), (h) => parseInt(h, 16)));
      }
      else chunks.push(r.bytes(Number(len)));
      const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let o = 0;
      for (const c of chunks) {
        all.set(c, o);
        o += c.length;
      }
      return major === 3 ? new TextDecoder().decode(all) : { $bytes: hex(all) };
    }
    case 4: {
      const out: unknown[] = [];
      for (let i = 0; len === null || i < Number(len); i++) {
        const v = cbor(r);
        if (v === BREAK) break;
        out.push(v);
      }
      return out;
    }
    case 5: {
      const out: Record<string, unknown> = {};
      for (let i = 0; len === null || i < Number(len); i++) {
        const k = cbor(r);
        if (k === BREAK) break;
        out[typeof k === "string" ? k : JSON.stringify(k)] = cbor(r);
      }
      return out;
    }
    case 6: {
      const tag = Number(len);
      const v = cbor(r);
      if (tag === 0) return { $date: v };
      if (tag === 1 && typeof v === "number") return { $date: new Date(v * 1000).toISOString(), epoch: v };
      if ((tag === 2 || tag === 3) && v && typeof v === "object" && "$bytes" in v) {
        const n = BigInt("0x" + ((v as { $bytes: string }).$bytes.replace(/ /g, "") || "0"));
        return { $bignum: (tag === 2 ? n : -1n - n).toString() };
      }
      if (tag === 32) return { $uri: v };
      if (tag === 37) return { $uuid: v };
      return { $tag: tag, value: v };
    }
  }
  throw new Error("Type CBOR inconnu.");
}

// ---------- Protobuf (schemaless) ----------
const WIRE = ["varint", "i64", "len", "sgroup", "egroup", "i32"];
function protobuf(bytes: Uint8Array, depth = 0): Record<string, unknown> {
  const r = new Reader(bytes);
  const out: Record<string, unknown> = {};
  const repeated = new Set<string>();
  const add = (key: string, v: unknown) => {
    if (repeated.has(key)) (out[key] as unknown[]).push(v);
    else if (key in out) {
      out[key] = [out[key], v];
      repeated.add(key);
    } else out[key] = v;
  };
  while (r.pos < bytes.length) {
    const tag = r.varint();
    const field = Number(tag >> 3n);
    const wire = Number(tag & 7n);
    if (field === 0) throw new Error("Numéro de champ 0 invalide.");
    const key = `${field} (${WIRE[wire] ?? "?"})`;
    if (wire === 0) {
      const v = r.varint();
      const signed = BigInt.asIntN(64, v);
      const zigzag = (v >> 1n) ^ -(v & 1n);
      add(key, signed === v && v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : { uint: v.toString(), int: signed.toString(), sint: zigzag.toString() });
    } else if (wire === 1) {
      const b = r.bytes(8);
      const dv = new DataView(b.buffer, b.byteOffset, 8);
      add(key, { double: dv.getFloat64(0, true), fixed64: dv.getBigUint64(0, true).toString() });
    } else if (wire === 5) {
      const b = r.bytes(4);
      const dv = new DataView(b.buffer, b.byteOffset, 4);
      add(key, { float: dv.getFloat32(0, true), fixed32: dv.getUint32(0, true) });
    } else if (wire === 2) {
      const len = Number(r.varint());
      const b = r.bytes(len);
      let nested: Record<string, unknown> | null = null;
      if (depth < 12 && len > 0) {
        try {
          nested = protobuf(b, depth + 1);
        } catch {
          nested = null;
        }
      }
      const text = tryText(b);
      // A printable string that also happens to parse as a message is almost always a string.
      add(key, text !== null && (!nested || /^[\x20-\x7e\u00a0-\uffff]+$/.test(text)) ? text : nested ?? { $bytes: hex(b) });
    } else throw new Error(`Type filaire ${wire} non pris en charge (groupes obsolètes).`);
  }
  return out;
}

export function BinaryDecoderTool() {
  const [format, setFormat] = useState<Format>("protobuf");
  const [encoding, setEncoding] = useState<Encoding>("auto");
  const [input, setInput] = useState(EXAMPLES.protobuf);

  const result = useMemo(() => {
    if (!input.trim()) return { data: undefined as unknown, error: "", size: 0, rest: 0 };
    try {
      const bytes = toBytes(input, encoding);
      if (format === "protobuf") return { data: protobuf(bytes), error: "", size: bytes.length, rest: 0 };
      const r = new Reader(bytes);
      const data = format === "msgpack" ? msgpack(r) : cbor(r);
      return { data, error: "", size: bytes.length, rest: bytes.length - r.pos };
    } catch (e) {
      return { data: undefined, error: e instanceof Error ? e.message : "Décodage impossible.", size: 0, rest: 0 };
    }
  }, [input, format, encoding]);

  const text = result.data !== undefined ? JSON.stringify(result.data, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2) : "";

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Format>
          value={format}
          onChange={(f) => {
            setFormat(f);
            setInput(EXAMPLES[f]);
          }}
          options={[
            { value: "protobuf", label: "Protobuf (sans schéma)" },
            { value: "msgpack", label: "MessagePack" },
            { value: "cbor", label: "CBOR" },
          ]}
        />
        <SegmentedControl<Encoding>
          value={encoding}
          onChange={setEncoding}
          options={[
            { value: "auto", label: "Auto" },
            { value: "hex", label: "Hex" },
            { value: "base64", label: "Base64" },
          ]}
        />
      </div>
      <div className="bench bench-2">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Octets</span>
            <span className="meta">{result.size} octets</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder="08 96 01 …  ou  CJYBEgdUb29sYm94" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Décodé</span>
            {result.rest > 0 && <span className="meta text-danger">{result.rest} octets non lus</span>}
          </div>
          <StructuredOutput text={text} language="json" error={result.error} tree={result.data !== undefined ? <JsonTree data={JSON.parse(text)} defaultDepth={4} /> : undefined} />
          <div className="panel-tools">
            <CopyButton getText={() => text} />
          </div>
        </div>
      </div>
      {format === "protobuf" && (
        <p className="row-head hint" style={{ margin: "0.85rem 0 0" }}>
          Sans fichier .proto, les noms de champs sont inconnus : chaque clé indique le numéro de champ et le type filaire. Les varints ambigus sont proposés en uint, int et sint (zigzag).
        </p>
      )}
    </div>
  );
}
