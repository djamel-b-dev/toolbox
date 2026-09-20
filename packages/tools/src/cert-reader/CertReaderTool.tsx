import { useState } from "react";
import * as forge from "node-forge";
import { CopyButton } from "@toolbox/ui";

const EXAMPLE = "";

function attrsToString(attrs: forge.pki.CertificateField[]): string {
  return attrs
    .map((a) => `${a.shortName ?? a.name}=${a.value}`)
    .join(", ");
}

function formatAltName(alt: { type: number; value?: string; ip?: string }): string {
  if (alt.type === 7 && alt.ip) return `IP:${alt.ip}`;
  return `DNS:${alt.value ?? ""}`;
}

export function CertReaderTool() {
  const [input, setInput] = useState(EXAMPLE);
  let error = "";
  let rows: [string, string][] = [];
  let sans: string[] = [];
  let isExpired = false;
  let isNotYetValid = false;

  if (input.trim()) {
    try {
      const cert = forge.pki.certificateFromPem(input);
      const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
      const sha1 = forge.md.sha1.create();
      sha1.update(der);
      const sha256 = forge.md.sha256.create();
      sha256.update(der);

      const now = new Date();
      isExpired = now > cert.validity.notAfter;
      isNotYetValid = now < cert.validity.notBefore;

      let keyInfo = "Inconnu";
      if (cert.publicKey && "n" in cert.publicKey) {
        keyInfo = `RSA ${(cert.publicKey as forge.pki.rsa.PublicKey).n.bitLength()} bits`;
      }

      const sanExt = cert.extensions.find((e) => e.name === "subjectAltName");
      sans = sanExt?.altNames ? sanExt.altNames.map(formatAltName) : [];

      rows = [
        ["Sujet", attrsToString(cert.subject.attributes)],
        ["Émetteur", attrsToString(cert.issuer.attributes)],
        ["Numéro de série", cert.serialNumber],
        ["Valide à partir du", cert.validity.notBefore.toLocaleString("fr-FR")],
        ["Valide jusqu'au", cert.validity.notAfter.toLocaleString("fr-FR")],
        ["Algorithme de signature", forge.pki.oids[cert.signatureOid] ?? cert.signatureOid],
        ["Clé publique", keyInfo],
        ["Empreinte SHA-1", sha1.digest().toHex()],
        ["Empreinte SHA-256", sha256.digest().toHex()],
      ];
    } catch (e) {
      error = e instanceof Error ? e.message : "Certificat invalide.";
    }
  }

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Certificat (PEM)</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----"}
          spellCheck={false}
          style={{ minHeight: 160 }}
        />
      </div>

      {error && (
        <div className="panel mb-lg">
          <pre className="is-error">{error}</pre>
        </div>
      )}

      {rows.length > 0 && (
        <>
          {(isExpired || isNotYetValid) && (
            <span className="status-pill" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              <span className="dot" style={{ background: "var(--danger)" }} />
              {isExpired ? "Certificat expiré" : "Pas encore valide"}
            </span>
          )}
          <div className="hash-rows" style={{ marginTop: isExpired || isNotYetValid ? "0.85rem" : 0, marginBottom: sans.length ? "1.5rem" : 0 }}>
            {rows.map(([label, value]) => (
              <div className="hash-row" key={label}>
                <span className="alg">{label}</span>
                <span className="val">{value}</span>
                <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${label}`} />
              </div>
            ))}
          </div>

          {sans.length > 0 && (
            <>
              <div className="row-head">
                <h2>Noms alternatifs (SAN)</h2>
              </div>
              <div className="hash-rows">
                {sans.map((san, i) => (
                  <div className="hash-row" key={san + i} style={{ gridTemplateColumns: "1fr auto" }}>
                    <span className="val">{san}</span>
                    <CopyButton variant="mini" getText={() => san} ariaLabel={`Copier ${san}`} />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
