import { useState } from "react";
import * as forge from "node-forge";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Mode = "create" | "extract";

function binaryToUint8Array(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function PfxTool() {
  const [mode, setMode] = useState<Mode>("create");

  // create mode
  const [certPem, setCertPem] = useState("");
  const [keyPem, setKeyPem] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [createError, setCreateError] = useState("");

  // extract mode
  const [fileName, setFileName] = useState("");
  const [extractPassword, setExtractPassword] = useState("");
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [extractedCert, setExtractedCert] = useState("");
  const [extractedKey, setExtractedKey] = useState("");
  const [extractError, setExtractError] = useState("");

  function createPfx() {
    setCreateError("");
    setDownloadUrl("");
    try {
      const cert = forge.pki.certificateFromPem(certPem);
      const key = forge.pki.privateKeyFromPem(keyPem);
      const p12Asn1 = forge.pkcs12.toPkcs12Asn1(key, cert, createPassword || null, {
        algorithm: "3des",
        generateLocalKeyId: true,
      });
      const der = forge.asn1.toDer(p12Asn1).getBytes();
      const blob = new Blob([binaryToUint8Array(der).buffer as ArrayBuffer], { type: "application/x-pkcs12" });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Impossible de créer le fichier PFX — vérifiez le certificat et la clé.");
    }
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setExtractError("");
    setExtractedCert("");
    setExtractedKey("");
    file.arrayBuffer().then((buf) => setFileBuffer(buf));
  }

  function extractPfx() {
    if (!fileBuffer) return;
    setExtractError("");
    try {
      const binary = forge.util.binary.raw.encode(new Uint8Array(fileBuffer));
      const asn1 = forge.asn1.fromDer(binary);
      const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, extractPassword);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? [];

      if (certBags[0]?.cert) setExtractedCert(forge.pki.certificateToPem(certBags[0].cert));
      if (keyBags[0]?.key) setExtractedKey(forge.pki.privateKeyToPem(keyBags[0].key));
      if (!certBags[0]?.cert && !keyBags[0]?.key) setExtractError("Aucun certificat ou clé trouvé dans ce fichier.");
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Mot de passe incorrect ou fichier PFX invalide.");
    }
  }

  return (
    <div>
      <div className="panel-tools mb-lg">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "create", label: "Créer un .pfx" },
            { value: "extract", label: "Extraire un .pfx" },
          ]}
        />
      </div>

      {mode === "create" ? (
        <div>
          <div className="bench bench-2 mb-lg">
            <div className="panel">
              <div className="panel-head">
                <span className="label">Certificat (PEM)</span>
              </div>
              <textarea value={certPem} onChange={(e) => setCertPem(e.target.value)} spellCheck={false} style={{ minHeight: 160 }} />
            </div>
            <div className="panel">
              <div className="panel-head">
                <span className="label">Clé privée (PEM)</span>
              </div>
              <textarea value={keyPem} onChange={(e) => setKeyPem(e.target.value)} spellCheck={false} style={{ minHeight: 160 }} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <span className="field-label">Mot de passe du fichier PFX</span>
              <input className="input" type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
            </div>
          </div>

          <div className="panel-tools mb-lg">
            <button type="button" className="btn" onClick={createPfx} disabled={!certPem || !keyPem}>
              Créer le fichier .pfx
            </button>
            {downloadUrl && (
              <a className="btn" href={downloadUrl} download="certificate.pfx">
                Télécharger certificate.pfx
              </a>
            )}
          </div>

          {createError && (
            <div className="panel">
              <pre className="is-error">{createError}</pre>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="field-row">
            <div className="field">
              <span className="field-label">Fichier .pfx / .p12</span>
              <input
                className="input"
                type="file"
                accept=".pfx,.p12"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
            <div className="field">
              <span className="field-label">Mot de passe</span>
              <input className="input" type="password" value={extractPassword} onChange={(e) => setExtractPassword(e.target.value)} />
            </div>
          </div>

          <div className="panel-tools mb-lg">
            <button type="button" className="btn" onClick={extractPfx} disabled={!fileBuffer}>
              Extraire {fileName && `— ${fileName}`}
            </button>
          </div>

          {extractError && (
            <div className="panel mb-lg">
              <pre className="is-error">{extractError}</pre>
            </div>
          )}

          {(extractedCert || extractedKey) && (
            <div className="bench bench-2">
              <div className="panel">
                <div className="panel-head">
                  <span className="label">Certificat</span>
                </div>
                <pre className="pre-compact">{extractedCert || "—"}</pre>
                <div className="panel-tools">
                  <CopyButton getText={() => extractedCert} />
                </div>
              </div>
              <div className="panel">
                <div className="panel-head">
                  <span className="label">Clé privée</span>
                </div>
                <pre className="pre-compact">{extractedKey || "—"}</pre>
                <div className="panel-tools">
                  <CopyButton getText={() => extractedKey} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
