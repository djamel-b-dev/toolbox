import { useEffect, useRef, useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algo = (typeof ALGOS)[number];

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function HmacTool() {
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [algo, setAlgo] = useState<Algo>("SHA-256");
  const [result, setResult] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!message || !secret) {
      setResult("");
      return;
    }
    timer.current = window.setTimeout(async () => {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: algo },
        false,
        ["sign"],
      );
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
      setResult(toHex(sig));
    }, 120);
    return () => window.clearTimeout(timer.current);
  }, [message, secret, algo]);

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Clé secrète</span>
          <input className="input" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Clé partagée" />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <span className="field-label">Algorithme</span>
          <SegmentedControl<Algo>
            value={algo}
            onChange={setAlgo}
            options={ALGOS.map((a) => ({ value: a, label: a.replace("SHA-", "SHA") }))}
          />
        </div>
      </div>

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Message</span>
          <span className="meta">{message.length} car.</span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tapez ou collez le message à signer…"
          spellCheck={false}
          style={{ minHeight: 110 }}
        />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">HMAC-{algo.replace("SHA-", "SHA")}</span>
        </div>
        <pre>{result || "—"}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => result} />
        </div>
      </div>
    </div>
  );
}
