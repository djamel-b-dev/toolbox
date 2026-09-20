import { useState } from "react";
import { CopyButton } from "@toolbox/ui";
import { parseIp, toIp } from "../shared/ipv4";

function calc(input: string) {
  const m = input.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!m) return null;
  const ip = parseIp(m[1]);
  const cidr = Number(m[2]);
  if (ip === null || cidr < 0 || cidr > 32) return null;
  const maskNum = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  const network = (ip & maskNum) >>> 0;
  const broadcast = (network | (~maskNum >>> 0)) >>> 0;
  const totalHosts = cidr >= 31 ? 2 ** (32 - cidr) : Math.max(0, 2 ** (32 - cidr) - 2);
  const firstHost = cidr >= 31 ? network : network + 1;
  const lastHost = cidr >= 31 ? broadcast : broadcast - 1;
  return {
    network: toIp(network),
    broadcast: toIp(broadcast),
    netmask: toIp(maskNum),
    wildcard: toIp(~maskNum >>> 0),
    firstHost: toIp(firstHost >>> 0),
    lastHost: toIp(lastHost >>> 0),
    totalHosts,
  };
}

export function SubnetTool() {
  const [input, setInput] = useState("192.168.1.10/24");
  const result = calc(input);

  const rows: [string, string][] = result
    ? [
        ["Adresse réseau", result.network],
        ["Masque", result.netmask],
        ["Masque inversé", result.wildcard],
        ["Diffusion (broadcast)", result.broadcast],
        ["Première IP utilisable", result.firstHost],
        ["Dernière IP utilisable", result.lastHost],
        ["Hôtes utilisables", String(result.totalHosts)],
      ]
    : [];

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Adresse CIDR</span>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="192.168.1.10/24" />
        </div>
      </div>

      {!result && input.trim() && (
        <div className="panel">
          <pre className="is-error">Format attendu : adresse IPv4 suivie d'un préfixe, ex. 10.0.0.0/16.</pre>
        </div>
      )}

      {result && (
        <div className="hash-rows">
          {rows.map(([label, value]) => (
            <div className="hash-row" key={label}>
              <span className="alg">{label}</span>
              <span className="val">{value}</span>
              <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${label}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
