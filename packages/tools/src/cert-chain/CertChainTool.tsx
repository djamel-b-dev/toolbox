import { useEffect, useState } from "react";
import * as forge from "node-forge";
import { CopyButton } from "@toolbox/ui";

interface Cert {
  index: number;
  pem: string;
  subject: string;
  issuer: string;
  subjectDer: string;
  issuerDer: string;
  notBefore: Date;
  notAfter: Date;
  isCA: boolean | null;
  sans: string[];
  sigAlg: string;
  sigOid: string;
  tbs: Uint8Array<ArrayBuffer>;
  signature: Uint8Array<ArrayBuffer>;
  spki: Uint8Array<ArrayBuffer>;
  keyDesc: string;
  keyAlg: { name: string; namedCurve?: string } | null;
}

const OIDS: Record<string, string> = {
  "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST", "2.5.4.10": "O", "2.5.4.11": "OU", "1.2.840.113549.1.9.1": "E",
};
const SIG: Record<string, { label: string; hash: string; kind: "RSA" | "ECDSA" }> = {
  "1.2.840.113549.1.1.5": { label: "SHA-1 + RSA", hash: "SHA-1", kind: "RSA" },
  "1.2.840.113549.1.1.11": { label: "SHA-256 + RSA", hash: "SHA-256", kind: "RSA" },
  "1.2.840.113549.1.1.12": { label: "SHA-384 + RSA", hash: "SHA-384", kind: "RSA" },
  "1.2.840.113549.1.1.13": { label: "SHA-512 + RSA", hash: "SHA-512", kind: "RSA" },
  "1.2.840.10045.4.3.2": { label: "ECDSA + SHA-256", hash: "SHA-256", kind: "ECDSA" },
  "1.2.840.10045.4.3.3": { label: "ECDSA + SHA-384", hash: "SHA-384", kind: "ECDSA" },
  "1.2.840.10045.4.3.4": { label: "ECDSA + SHA-512", hash: "SHA-512", kind: "ECDSA" },
};
const CURVES: Record<string, string> = { "1.2.840.10045.3.1.7": "P-256", "1.3.132.0.34": "P-384", "1.3.132.0.35": "P-521" };

const bytes = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(s, (c) => c.charCodeAt(0));
type Node = forge.asn1.Asn1;
const kids = (n: Node) => n.value as Node[];

function dnToString(dn: Node): string {
  return kids(dn)
    .flatMap((set) => kids(set))
    .map((atv) => {
      const [oid, val] = kids(atv);
      const name = OIDS[forge.asn1.derToOid(oid.value as string)] ?? forge.asn1.derToOid(oid.value as string);
      return `${name}=${forge.util.decodeUtf8(val.value as string)}`;
    })
    .join(", ");
}

function asnTime(n: Node): Date {
  return n.type === forge.asn1.Type.UTCTIME ? forge.asn1.utcTimeToDate(n.value as string) : forge.asn1.generalizedTimeToDate(n.value as string);
}

function parse(pem: string, index: number): Cert {
  const der = forge.pem.decode(pem)[0].body;
  // Keep BIT STRINGs (public key, signature) as raw bytes: forge would otherwise try to parse them as nested ASN.1.
  // @types/node-forge only knows the old fromDer(bytes, strict) signature; forge 1.x takes an options object.
  const fromDer = forge.asn1.fromDer as unknown as (bytes: string, options: { decodeBitStrings: boolean }) => forge.asn1.Asn1;
  const root = fromDer(der, { decodeBitStrings: false });
  const [tbs, sigAlgNode, sigValue] = kids(root);
  const t = kids(tbs);
  let i = 0;
  if (t[0].tagClass === forge.asn1.Class.CONTEXT_SPECIFIC) i++;
  const issuer = t[i + 2];
  const validity = kids(t[i + 3]);
  const subject = t[i + 4];
  const spki = t[i + 5];
  const sigOid = forge.asn1.derToOid(kids(sigAlgNode)[0].value as string);
  const spkiAlg = kids(kids(spki)[0]);
  const keyOid = forge.asn1.derToOid(spkiAlg[0].value as string);
  let keyDesc = keyOid;
  let keyAlg: Cert["keyAlg"] = null;
  if (keyOid === "1.2.840.113549.1.1.1") {
    const bits = (kids(spki)[1].value as string).slice(1);
    const modulus = kids(forge.asn1.fromDer(bits))[0].value as string;
    keyDesc = `RSA ${(modulus.charCodeAt(0) === 0 ? modulus.length - 1 : modulus.length) * 8} bits`;
    keyAlg = { name: "RSASSA-PKCS1-v1_5" };
  } else if (keyOid === "1.2.840.10045.2.1") {
    const curve = CURVES[forge.asn1.derToOid(spkiAlg[1].value as string)];
    keyDesc = `ECDSA ${curve ?? "courbe inconnue"}`;
    if (curve) keyAlg = { name: "ECDSA", namedCurve: curve };
  } else if (keyOid === "1.3.101.112") keyDesc = "Ed25519";

  let isCA: boolean | null = null;
  const sans: string[] = [];
  const extWrapper = t.find((n) => n.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && n.type === 3);
  if (extWrapper) {
    for (const ext of kids(kids(extWrapper)[0])) {
      const parts = kids(ext);
      const oid = forge.asn1.derToOid(parts[0].value as string);
      const value = forge.asn1.fromDer(parts[parts.length - 1].value as string);
      if (oid === "2.5.29.19") {
        const bc = kids(value);
        isCA = bc.length > 0 && bc[0].type === forge.asn1.Type.BOOLEAN ? (bc[0].value as string).charCodeAt(0) !== 0 : false;
      } else if (oid === "2.5.29.17") {
        for (const gn of kids(value)) {
          if (gn.type === 2) sans.push(gn.value as string);
          else if (gn.type === 7) sans.push(Array.from(bytes(gn.value as string)).join("."));
        }
      }
    }
  }
  return {
    index,
    pem,
    subject: dnToString(subject),
    issuer: dnToString(issuer),
    subjectDer: forge.asn1.toDer(subject).getBytes(),
    issuerDer: forge.asn1.toDer(issuer).getBytes(),
    notBefore: asnTime(validity[0]),
    notAfter: asnTime(validity[1]),
    isCA,
    sans,
    sigAlg: SIG[sigOid]?.label ?? sigOid,
    sigOid,
    tbs: bytes(forge.asn1.toDer(tbs).getBytes()),
    signature: bytes((sigValue.value as string).slice(1)),
    spki: bytes(forge.asn1.toDer(spki).getBytes()),
    keyDesc,
    keyAlg,
  };
}

/** X.509 ECDSA signatures are DER SEQUENCE { r, s }; WebCrypto wants r || s, each padded to the curve size. */
function ecdsaDerToRaw(sig: Uint8Array, curve: string): Uint8Array<ArrayBuffer> {
  const size = curve === "P-256" ? 32 : curve === "P-384" ? 48 : 66;
  const seq = kids(forge.asn1.fromDer(String.fromCharCode(...sig)));
  const out = new Uint8Array(size * 2);
  seq.forEach((n, k) => {
    let v: Uint8Array = bytes(n.value as string);
    while (v.length > size && v[0] === 0) v = v.subarray(1);
    out.set(v, k * size + (size - v.length));
  });
  return out;
}

async function verify(child: Cert, issuer: Cert): Promise<boolean | null> {
  const sig = SIG[child.sigOid];
  if (!sig || !issuer.keyAlg) return null;
  try {
    const key = await crypto.subtle.importKey("spki", issuer.spki, sig.kind === "RSA" ? { name: "RSASSA-PKCS1-v1_5", hash: sig.hash } : { name: "ECDSA", namedCurve: issuer.keyAlg.namedCurve! }, false, ["verify"]);
    const signature = sig.kind === "ECDSA" ? ecdsaDerToRaw(child.signature, issuer.keyAlg.namedCurve!) : child.signature;
    return await crypto.subtle.verify(sig.kind === "RSA" ? { name: "RSASSA-PKCS1-v1_5" } : { name: "ECDSA", hash: sig.hash }, key, signature, child.tbs);
  } catch {
    return null;
  }
}

function hostMatches(host: string, names: string[]): boolean {
  const h = host.toLowerCase();
  return names.some((n) => {
    const p = n.toLowerCase();
    if (p.startsWith("*.")) return h.endsWith(p.slice(1)) && h.split(".").length === p.split(".").length;
    return p === h;
  });
}

interface Link {
  cert: Cert;
  issuer: Cert | null;
  signature: boolean | null;
  selfSigned: boolean;
}

async function analyze(input: string): Promise<{ links: Link[]; warnings: string[]; ordered: string; certs: Cert[] }> {
  const pems = input.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];
  if (!pems.length) throw new Error("Aucun bloc « BEGIN CERTIFICATE » trouvé.");
  const certs = pems.map((p, i) => parse(p, i));
  const bySubject = (der: string) => certs.find((c) => c.subjectDer === der);
  const issuedByOther = new Set(certs.flatMap((c) => certs.filter((o) => o !== c && o.issuerDer === c.subjectDer).map(() => c.index)));
  const leaf = certs.find((c) => !issuedByOther.has(c.index)) ?? certs[0];
  const chain: Cert[] = [];
  let cur: Cert | undefined = leaf;
  while (cur && !chain.includes(cur)) {
    chain.push(cur);
    if (cur.issuerDer === cur.subjectDer) break;
    cur = bySubject(cur.issuerDer);
  }
  const links: Link[] = [];
  for (const c of chain) {
    const selfSigned = c.issuerDer === c.subjectDer;
    const issuer = selfSigned ? c : bySubject(c.issuerDer) ?? null;
    links.push({ cert: c, issuer, signature: issuer ? await verify(c, issuer) : null, selfSigned });
  }
  const warnings: string[] = [];
  const last = chain[chain.length - 1];
  if (last.issuerDer !== last.subjectDer) warnings.push(`Chaîne incomplète : l'émetteur de « ${last.subject} » (${last.issuer}) est absent. Ajoutez le certificat intermédiaire.`);
  else if (chain.length > 1) warnings.push("La racine est incluse : inutile côté serveur (les clients l'ont déjà), mais sans danger.");
  const unused = certs.filter((c) => !chain.includes(c));
  if (unused.length) warnings.push(`${unused.length} certificat(s) sans rapport avec la chaîne : ${unused.map((c) => c.subject).join(" ; ")}`);
  if (chain.some((c, i) => c.index !== i)) warnings.push("Ordre incorrect : un serveur doit envoyer la feuille en premier, puis chaque émetteur. Utilisez la version réordonnée ci-dessous.");
  for (const c of chain.slice(1)) if (c.isCA === false) warnings.push(`« ${c.subject} » signe un autre certificat mais n'est pas marqué CA (basicConstraints).`);
  return { links, warnings, ordered: chain.map((c) => c.pem).join("\n") + "\n", certs };
}

const EXAMPLE_HINT = `-----BEGIN CERTIFICATE-----
(certificat du serveur)
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
(certificat intermédiaire)
-----END CERTIFICATE-----`;

export function CertChainTool() {
  const [input, setInput] = useState("");
  const [host, setHost] = useState("");
  const [state, setState] = useState<{ links: Link[]; warnings: string[]; ordered: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!input.trim()) {
      setState(null);
      setError("");
      return;
    }
    analyze(input)
      .then((r) => {
        if (!cancelled) {
          setState(r);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setState(null);
          setError(e instanceof Error ? e.message : "Certificats illisibles.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [input]);

  const now = Date.now();
  const leaf = state?.links[0]?.cert;

  return (
    <div>
      <div className="panel mb-md" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Certificats PEM (dans n'importe quel ordre)</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 160 }} placeholder={EXAMPLE_HINT} />
        <p className="row-head hint" style={{ margin: 0 }}>
          Pour récupérer la chaîne d'un serveur : <code>openssl s_client -connect exemple.fr:443 -showcerts &lt;/dev/null</code>
        </p>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Nom d'hôte à vérifier (optionnel)</span>
          <input className="input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="www.exemple.fr" />
        </div>
      </div>

      {error && <p className="validation bad">{error}</p>}
      {state && leaf && (
        <>
          {host.trim() && (
            <p className={"validation " + (hostMatches(host.trim(), leaf.sans) ? "ok" : "bad")}>
              {hostMatches(host.trim(), leaf.sans) ? `✓ Le certificat couvre ${host.trim()}` : `✗ ${host.trim()} n'est pas dans les SAN (${leaf.sans.join(", ") || "aucun SAN"})`}
            </p>
          )}
          {state.warnings.map((w, i) => (
            <p key={i} className="validation warn">
              {w}
            </p>
          ))}
          <div className="chain">
            {state.links.map((l, i) => {
              const expired = l.cert.notAfter.getTime() < now;
              const notYet = l.cert.notBefore.getTime() > now;
              const days = Math.round((l.cert.notAfter.getTime() - now) / 86400000);
              const role = i === 0 ? "Feuille (serveur)" : l.selfSigned ? "Racine" : "Intermédiaire";
              return (
                <div className="chain-item" key={i}>
                  <div className="chain-head">
                    <span className="port-tags">
                      <span>{role}</span>
                    </span>
                    <strong>{l.cert.subject}</strong>
                  </div>
                  <div className="hash-rows">
                    <div className="hash-row hash-row-2">
                      <span className="alg">Émis par</span>
                      <span className="val">{l.cert.issuer}</span>
                    </div>
                    <div className="hash-row hash-row-2">
                      <span className="alg">Validité</span>
                      <span className={"val " + (expired || notYet ? "text-danger" : days < 30 ? "text-danger" : "text-success")}>
                        {l.cert.notBefore.toLocaleDateString("fr-FR")} → {l.cert.notAfter.toLocaleDateString("fr-FR")} · {expired ? "EXPIRÉ" : notYet ? "pas encore valide" : `${days} jours restants`}
                      </span>
                    </div>
                    <div className="hash-row hash-row-2">
                      <span className="alg">Clé · signature</span>
                      <span className="val">
                        {l.cert.keyDesc} · {l.cert.sigAlg}
                        {l.cert.sigAlg.startsWith("SHA-1") && <span className="text-danger"> (SHA-1 obsolète)</span>}
                      </span>
                    </div>
                    <div className="hash-row hash-row-2">
                      <span className="alg">Signature vérifiée</span>
                      <span className={"val " + (l.signature === true ? "text-success" : l.signature === false ? "text-danger" : "")}>
                        {l.signature === true ? `✓ par ${l.selfSigned ? "elle-même" : "le certificat suivant"}` : l.signature === false ? "✗ signature invalide" : l.issuer ? "non vérifiable (algorithme non pris en charge)" : "émetteur absent"}
                      </span>
                    </div>
                    {i === 0 && l.cert.sans.length > 0 && (
                      <div className="hash-row hash-row-2">
                        <span className="alg">SAN</span>
                        <span className="val">{l.cert.sans.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="panel-tools mt-lg">
            <CopyButton getText={() => state.ordered} label="Copier la chaîne réordonnée" />
          </div>
        </>
      )}
    </div>
  );
}
