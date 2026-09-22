import { useEffect, useRef, useState } from "react";
import { CopyButton } from "@toolbox/ui";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function HashTool() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!input) {
      setHashes({});
      return;
    }
    timer.current = window.setTimeout(() => {
      const enc = new TextEncoder().encode(input);
      Promise.all(ALGOS.map((a) => crypto.subtle.digest(a, enc).then(toHex))).then((results) => {
        const map: Record<string, string> = {};
        ALGOS.forEach((a, i) => {
          map[a] = results[i];
        });
        setHashes(map);
      });
    }, 120);
    return () => window.clearTimeout(timer.current);
  }, [input]);

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Entrée</span>
          <span className="meta">{input.length} car.</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tapez ou collez du texte…"
          spellCheck={false}
          style={{ minHeight: 110 }}
        />
        <div className="panel-tools">
          <button type="button" className="btn" onClick={() => setInput("Bonjour, Toolbox 👋")}>
            Utiliser un exemple
          </button>
          <button type="button" className="btn" onClick={() => setInput("")}>
            Effacer
          </button>
        </div>
      </div>

      <div className="row-head">
        <h2>Empreintes</h2>
      </div>
      <div className="hash-rows">
        {ALGOS.map((a) => (
          <div className="hash-row" key={a}>
            <span className="alg">{a.replace("SHA-", "SHA")}</span>
            <span className="val">{hashes[a] ?? "—"}</span>
            <CopyButton variant="mini" getText={() => hashes[a] ?? ""} ariaLabel={`Copier ${a}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
