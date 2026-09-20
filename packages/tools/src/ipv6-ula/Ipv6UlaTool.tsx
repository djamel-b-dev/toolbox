import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

function hex(n: number, digits: number): string {
  return n.toString(16).padStart(digits, "0");
}

function generate() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const globalId = Array.from(bytes)
    .map((b) => hex(b, 2))
    .join("");
  const h1 = (0xfd << 8) | bytes[0];
  const h2 = (bytes[1] << 8) | bytes[2];
  const h3 = (bytes[3] << 8) | bytes[4];
  const prefix48 = `${hex(h1, 4)}:${hex(h2, 4)}:${hex(h3, 4)}`;
  return {
    globalId,
    prefix48: `${prefix48}::/48`,
    address64: `${prefix48}:0000::/64`,
  };
}

export function Ipv6UlaTool() {
  const [result, setResult] = useState(generate);

  const rows: [string, string][] = [
    ["Préfixe /48", result.prefix48],
    ["Adresse /64 (sous-réseau 0)", result.address64],
    ["Global ID", result.globalId],
  ];

  return (
    <div>
      <div className="panel-tools mb-lg">
        <button type="button" className="btn" onClick={() => setResult(generate())}>
          Régénérer
        </button>
      </div>

      <div className="hash-rows">
        {rows.map(([label, value]) => (
          <div className="hash-row" key={label}>
            <span className="alg">{label}</span>
            <span className="val">{value}</span>
            <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${label}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
