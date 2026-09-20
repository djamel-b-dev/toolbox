import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Usage = "encrypt" | "sign";
type ModLen = 2048 | 4096;

function toPem(buf: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  const lines = b64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

export function RsaKeypairTool() {
  const [usage, setUsage] = useState<Usage>("encrypt");
  const [modLen, setModLen] = useState<ModLen>(2048);
  const [publicPem, setPublicPem] = useState("");
  const [privatePem, setPrivatePem] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const algorithm =
        usage === "encrypt"
          ? { name: "RSA-OAEP", modulusLength: modLen, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }
          : { name: "RSASSA-PKCS1-v1_5", modulusLength: modLen, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };
      const keyUsages: KeyUsage[] = usage === "encrypt" ? ["encrypt", "decrypt"] : ["sign", "verify"];
      const pair = await crypto.subtle.generateKey(algorithm, true, keyUsages);
      const [spki, pkcs8] = await Promise.all([
        crypto.subtle.exportKey("spki", pair.publicKey),
        crypto.subtle.exportKey("pkcs8", pair.privateKey),
      ]);
      setPublicPem(toPem(spki, "PUBLIC KEY"));
      setPrivatePem(toPem(pkcs8, "PRIVATE KEY"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "La génération a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Usage</span>
          <SegmentedControl<Usage>
            value={usage}
            onChange={setUsage}
            options={[
              { value: "encrypt", label: "Chiffrement (RSA-OAEP)" },
              { value: "sign", label: "Signature (RSASSA-PKCS1-v1_5)" },
            ]}
          />
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <span className="field-label">Longueur</span>
          <SegmentedControl<string>
            value={String(modLen)}
            onChange={(v) => setModLen(Number(v) as ModLen)}
            options={[
              { value: "2048", label: "2048 bits" },
              { value: "4096", label: "4096 bits" },
            ]}
          />
        </div>
      </div>

      <div className="panel-tools mb-lg">
        <button type="button" className="btn" onClick={generate} disabled={busy}>
          {busy ? "Génération…" : "Générer une paire de clés"}
        </button>
      </div>

      {error && (
        <div className="panel mb-lg">
          <pre className="is-error">{error}</pre>
        </div>
      )}

      {publicPem && (
        <div className="bench bench-2">
          <div className="panel">
            <div className="panel-head">
              <span className="label">Clé publique</span>
            </div>
            <pre className="pre-compact">{publicPem}</pre>
            <div className="panel-tools">
              <CopyButton getText={() => publicPem} />
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <span className="label">Clé privée</span>
            </div>
            <pre className="pre-compact">{privatePem}</pre>
            <div className="panel-tools">
              <CopyButton getText={() => privatePem} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
