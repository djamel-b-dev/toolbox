import { useState } from "react";
import * as forge from "node-forge";
import { CopyButton, SegmentedControl } from "@toolbox/ui";
import { buildSubjectAttrs, parseSans, randomSerialHex, type SubjectFields } from "../shared/certSubject";
import { SubjectForm } from "../shared/SubjectForm";

type Bits = "2048" | "4096";

function generateKeyPairAsync(bits: number): Promise<forge.pki.rsa.KeyPair> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(forge.pki.rsa.generateKeyPair({ bits, e: 0x10001 })), 30);
  });
}

export function SelfSignedCertTool() {
  const [fields, setFields] = useState<SubjectFields>({
    cn: "localhost",
    org: "Workbench",
    ou: "",
    locality: "",
    state: "",
    country: "FR",
    email: "",
  });
  const [sans, setSans] = useState("localhost, 127.0.0.1");
  const [days, setDays] = useState(365);
  const [bits, setBits] = useState<Bits>("2048");
  const [busy, setBusy] = useState(false);
  const [certPem, setCertPem] = useState("");
  const [keyPem, setKeyPem] = useState("");
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const keys = await generateKeyPairAsync(Number(bits));
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = randomSerialHex();
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + days);

      const attrs = buildSubjectAttrs(fields);
      cert.setSubject(attrs);
      cert.setIssuer(attrs);

      const altNames = parseSans(sans);
      const extensions: Array<Record<string, unknown>> = [
        { name: "basicConstraints", cA: true },
        { name: "keyUsage", keyCertSign: true, digitalSignature: true, keyEncipherment: true, cRLSign: true },
        { name: "subjectKeyIdentifier" },
      ];
      if (altNames.length) extensions.push({ name: "subjectAltName", altNames });
      cert.setExtensions(extensions);

      cert.sign(keys.privateKey, forge.md.sha256.create());
      setCertPem(forge.pki.certificateToPem(cert));
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
        <div className="field" style={{ maxWidth: 140 }}>
          <span className="field-label">Validité (jours)</span>
          <input className="input" type="number" min={1} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 365))} />
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
          {busy ? "Génération…" : "Générer le certificat"}
        </button>
      </div>

      {error && (
        <div className="panel mb-lg">
          <pre className="is-error">{error}</pre>
        </div>
      )}

      {certPem && (
        <div className="bench bench-2">
          <div className="panel">
            <div className="panel-head">
              <span className="label">Certificat</span>
            </div>
            <pre className="pre-compact">{certPem}</pre>
            <div className="panel-tools">
              <CopyButton getText={() => certPem} />
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
