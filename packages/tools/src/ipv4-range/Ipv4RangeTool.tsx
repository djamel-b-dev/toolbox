import { useState } from "react";
import { CopyButton } from "@toolbox/ui";
import { parseIp, toIp } from "../shared/ipv4";

const MAX_LIST = 1024;

export function Ipv4RangeTool() {
  const [input, setInput] = useState("10.0.0.0/28");

  const m = input.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  const ip = m ? parseIp(m[1]) : null;
  const cidr = m ? Number(m[2]) : null;
  const valid = ip !== null && cidr !== null && cidr >= 0 && cidr <= 32;

  let addresses: string[] = [];
  let total = 0;
  if (valid) {
    const maskNum = cidr === 0 ? 0 : (0xffffffff << (32 - cidr!)) >>> 0;
    const network = (ip! & maskNum) >>> 0;
    total = 2 ** (32 - cidr!);
    const count = Math.min(total, MAX_LIST);
    addresses = Array.from({ length: count }, (_, i) => toIp((network + i) >>> 0));
  }

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Adresse CIDR</span>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="10.0.0.0/28" />
        </div>
      </div>

      {!valid && input.trim() && (
        <div className="panel">
          <pre className="is-error">Format attendu : adresse IPv4 suivie d'un préfixe, ex. 10.0.0.0/28.</pre>
        </div>
      )}

      {valid && (
        <>
          <div className="row-head">
            <h2>Adresses ({total.toLocaleString("fr-FR")})</h2>
            {total > MAX_LIST && <span className="hint">Affichage limité aux {MAX_LIST} premières.</span>}
          </div>
          <div className="panel">
            <pre>{addresses.join("\n")}</pre>
            <div className="panel-tools">
              <CopyButton getText={() => addresses.join("\n")} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
