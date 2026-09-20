import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Mode = "hash" | "compare";

export function BcryptTool() {
  const [mode, setMode] = useState<Mode>("hash");
  const [text, setText] = useState("correct horse battery staple");
  const [rounds, setRounds] = useState(10);
  const [hash, setHash] = useState("");
  const [compareHash, setCompareHash] = useState("");
  const [result, setResult] = useState("");
  const [match, setMatch] = useState<boolean | null>(null);

  useEffect(() => {
    if (mode !== "hash" || !text) {
      setResult("");
      return;
    }
    let cancelled = false;
    bcrypt.hash(text, rounds).then((h) => {
      if (!cancelled) setResult(h);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, text, rounds]);

  useEffect(() => {
    if (mode !== "compare" || !text || !compareHash) {
      setMatch(null);
      return;
    }
    let cancelled = false;
    bcrypt
      .compare(text, compareHash)
      .then((ok) => {
        if (!cancelled) setMatch(ok);
      })
      .catch(() => {
        if (!cancelled) setMatch(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, text, compareHash]);

  return (
    <div>
      <div className="panel-tools mb-lg">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "hash", label: "Hacher" },
            { value: "compare", label: "Vérifier" },
          ]}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">Texte en clair</span>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        {mode === "hash" && (
          <div className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">Rounds</span>
            <input
              className="input"
              type="number"
              min={4}
              max={14}
              value={rounds}
              onChange={(e) => setRounds(Math.min(14, Math.max(4, Number(e.target.value) || 10)))}
            />
          </div>
        )}
      </div>

      {mode === "hash" ? (
        <div className="panel">
          <div className="panel-head">
            <span className="label">Hash bcrypt</span>
          </div>
          <pre>{result || "…"}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => result} />
          </div>
        </div>
      ) : (
        <>
          <div className="field-row">
            <div className="field">
              <span className="field-label">Hash bcrypt à vérifier</span>
              <input className="input" value={compareHash} onChange={(e) => setCompareHash(e.target.value)} placeholder="$2a$10$…" />
            </div>
          </div>
          <div className="hash-rows">
            <div className="hash-row hash-row-2">
              <span className="alg">Résultat</span>
              <span className={"val " + (match === null ? "" : match ? "text-success" : "text-danger")}>
                {match === null ? "—" : match ? "Correspond" : "Ne correspond pas"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
