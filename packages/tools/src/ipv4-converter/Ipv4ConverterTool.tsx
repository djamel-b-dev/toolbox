import { useState } from "react";
import { CopyButton } from "@toolbox/ui";
import { parseIp, toIp } from "../shared/ipv4";

function parseInput(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)) return parseIp(s);
  if (/^0x[0-9a-f]+$/i.test(s)) {
    const n = parseInt(s, 16);
    return n >= 0 && n <= 0xffffffff ? n : null;
  }
  if (/^[01]{8}(\.[01]{8}){3}$/.test(s)) return parseIp(s.split(".").map((b) => String(parseInt(b, 2))).join("."));
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return n >= 0 && n <= 0xffffffff ? n : null;
  }
  return null;
}

export function Ipv4ConverterTool() {
  const [input, setInput] = useState("192.168.1.10");
  const value = parseInput(input);

  const rows: [string, string][] = value !== null
    ? [
        ["Décimal pointé", toIp(value)],
        ["Entier (décimal)", String(value)],
        ["Hexadécimal", "0x" + value.toString(16).toUpperCase().padStart(8, "0")],
        [
          "Binaire",
          [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]
            .map((b) => b.toString(2).padStart(8, "0"))
            .join("."),
        ],
      ]
    : [];

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Adresse IPv4 (décimal pointé, entier, hex ou binaire)</span>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
      </div>

      {value === null && input.trim() && (
        <div className="panel">
          <pre className="is-error">Format non reconnu.</pre>
        </div>
      )}

      {value !== null && (
        <div className="hash-rows">
          {rows.map(([label, val]) => (
            <div className="hash-row" key={label}>
              <span className="alg">{label}</span>
              <span className="val">{val}</span>
              <CopyButton variant="mini" getText={() => val} ariaLabel={`Copier ${label}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
