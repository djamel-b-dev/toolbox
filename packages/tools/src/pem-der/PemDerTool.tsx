import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Mode = "pemToDer" | "derToPem";

interface DerInfo {
  label: string;
  base64: string;
  hex: string;
  byteLength: number;
}

function pemToDerInfo(pem: string): DerInfo {
  const match = pem.match(/-----BEGIN ([^-]+)-----([\s\S]+?)-----END \1-----/);
  if (!match) throw new Error("Bloc PEM introuvable (attendu : -----BEGIN ...----- … -----END ...-----).");
  const label = match[1].trim();
  const b64 = match[2].replace(/\s+/g, "");
  const binary = atob(b64);
  let hex = "";
  for (let i = 0; i < binary.length; i++) hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
  return { label, base64: b64, hex, byteLength: binary.length };
}

function derToPem(b64: string, label: string): string {
  const clean = b64.replace(/\s+/g, "");
  atob(clean);
  const lines = clean.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

const LABELS = ["CERTIFICATE", "CERTIFICATE REQUEST", "PRIVATE KEY", "RSA PRIVATE KEY", "PUBLIC KEY"];

export function PemDerTool() {
  const [mode, setMode] = useState<Mode>("pemToDer");
  const [input, setInput] = useState("");
  const [label, setLabel] = useState(LABELS[0]);

  let error = "";
  let derInfo: DerInfo | null = null;
  let pemOutput = "";

  if (input.trim()) {
    try {
      if (mode === "pemToDer") {
        derInfo = pemToDerInfo(input);
      } else {
        pemOutput = derToPem(input, label);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Entrée invalide.";
    }
  }

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "pemToDer", label: "PEM → DER" },
            { value: "derToPem", label: "Base64 DER → PEM" },
          ]}
        />
      </div>

      {mode === "derToPem" && (
        <div className="field-row">
          <div className="field">
            <span className="field-label">Type de bloc</span>
            <SegmentedControl<string> value={label} onChange={setLabel} options={LABELS.map((l) => ({ value: l, label: l }))} />
          </div>
        </div>
      )}

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">{mode === "pemToDer" ? "PEM" : "Base64 DER"}</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 160 }} />
      </div>

      {error && (
        <div className="panel">
          <pre className="is-error">{error}</pre>
        </div>
      )}

      {derInfo && (
        <>
          <div className="hash-rows mb-lg">
            <div className="hash-row hash-row-2">
              <span className="alg">Type</span>
              <span className="val">{derInfo.label}</span>
            </div>
            <div className="hash-row hash-row-2">
              <span className="alg">Taille</span>
              <span className="val">{derInfo.byteLength} octets</span>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <span className="label">DER (hexadécimal)</span>
            </div>
            <pre style={{ wordBreak: "break-all" }}>{derInfo.hex}</pre>
            <div className="panel-tools">
              <CopyButton getText={() => derInfo!.hex} label="Copier le hex" />
              <CopyButton getText={() => derInfo!.base64} label="Copier en base64" />
            </div>
          </div>
        </>
      )}

      {pemOutput && (
        <div className="panel">
          <div className="panel-head">
            <span className="label">PEM</span>
          </div>
          <pre>{pemOutput}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => pemOutput} />
          </div>
        </div>
      )}
    </div>
  );
}
