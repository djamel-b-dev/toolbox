import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(time: number, len: number) {
  let str = "";
  let n = time;
  for (let i = len - 1; i >= 0; i--) {
    const mod = n % 32;
    str = ENCODING[mod] + str;
    n = (n - mod) / 32;
  }
  return str;
}

function encodeRandom(len: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let str = "";
  for (let i = 0; i < len; i++) str += ENCODING[bytes[i] % 32];
  return str;
}

function ulid() {
  return encodeTime(Date.now(), 10) + encodeRandom(16);
}

export function UlidTool() {
  const [ulids, setUlids] = useState<string[]>(() => [ulid()]);

  return (
    <div>
      <div className="panel-tools mb-md">
        <button type="button" className="btn" onClick={() => setUlids((prev) => [ulid(), ...prev].slice(0, 12))}>
          Générer un ULID
        </button>
        <button type="button" className="btn" onClick={() => setUlids([ulid()])}>
          Réinitialiser
        </button>
      </div>
      <div className="uuid-rows">
        {ulids.map((id, i) => (
          <div className="uuid-row" key={id + i}>
            <span>{id}</span>
            <CopyButton variant="mini" getText={() => id} ariaLabel="Copier l'ULID" />
          </div>
        ))}
      </div>
    </div>
  );
}
