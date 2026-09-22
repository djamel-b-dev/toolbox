import { useState } from "react";
import * as forge from "node-forge";
import { CopyButton, SegmentedControl } from "@toolbox/ui";
import { buildSubjectAttrs, parseSans, type SubjectFields } from "../shared/certSubject";
import { SubjectForm } from "../shared/SubjectForm";

type Bits = "2048" | "4096";

function generateKeyPairAsync(bits: number): Promise<forge.pki.rsa.KeyPair> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(forge.pki.rsa.generateKeyPair({ bits, e: 0x10001 })), 30);
  });
}

export function CsrTool() {
  const [fields, setFields] = useState<SubjectFields>({
    cn: "example.com",
    org: "Toolbox",
    ou: "",
    locality: "",
    state: "",
    country: "FR",
    email: "",
  });
  const [sans, setSans] = useState("example.com, www.example.com");
  const [bits, setBits] = useState<Bits>("2048");
  const [busy, setBusy] = useState(false);
  const [csrPem, setCsrPem] = useState("");
  const [keyPem, setKeyPem] = useState("");
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const keys = await generateKeyPairAsync(Number(bits));
      const csr = forge.pki.createCertificationRequest();
      csr.publicKey = keys.publicKey;
      csr.setSubject(buildSubjectAttrs(fields));

      const altNames = parseSans(sans);
      if (altNames.length) {
        csr.setAttributes([
          {
            name: "extensionRequest",
            extensions: [{ name: "subjectAltName", altNames }],
          },
        ]);
      }

      csr.sign(keys.privateKey, forge.md.sha256.create());
      setCsrPem(forge.pki.certificationRequestToPem(csr));
      setKeyPem(forge.pki.privateKeyToPem(keys.privateKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : "La génération a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SubjectForm fields={fields} onChange={setFields} />

      <div className="field-row">
        <div className="field">
          <span className="field-label">Noms alternatifs (SAN), séparés par des virgules</span>
          <input className="input" value={sans} onChange={(e) => setSans(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <span className="field-label">Taille de clé</span>
          <SegmentedControl<Bits>
            value={bits}
            onChange={setBits}
            options={[
              { value: "2048", label: "2048 bits" },
              { value: "4096", label: "4096 bits" },
            ]}
          />
        </div>
      </div>

      <div className="panel-tools mb-lg">
        <button type="button" className="btn" onClick={generate} disabled={busy || !fields.cn}>
          {busy ? "Génération…" : "Générer la CSR"}
        </button>
      </div>

      {error && (
        <div className="panel mb-lg">
          <pre className="is-error">{error}</pre>
        </div>
      )}

      {csrPem && (
        <div className="bench bench-2">
          <div className="panel">
            <div className="panel-head">
              <span className="label">CSR (PKCS#10)</span>
            </div>
            <pre className="pre-compact">{csrPem}</pre>
            <div className="panel-tools">
              <CopyButton getText={() => csrPem} />
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <span className="label">Clé privée</span>
            </div>
            <pre className="pre-compact">{keyPem}</pre>
            <div className="panel-tools">
              <CopyButton getText={() => keyPem} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
