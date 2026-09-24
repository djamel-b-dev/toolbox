import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Algo = "ed25519" | "rsa3072" | "rsa4096";

interface KeyPair {
  algo: Algo;
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  randomart: string;
}

const enc = new TextEncoder();
function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n);
  return b;
}
function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
/** SSH wire "string": uint32 length prefix + bytes. */
const sshString = (b: Uint8Array | string) => {
  const bytes = typeof b === "string" ? enc.encode(b) : b;
  return concat(u32(bytes.length), bytes);
};
/** SSH "mpint": big-endian, with a leading 0x00 when the high bit is set. */
function mpint(b: Uint8Array): Uint8Array {
  let i = 0;
  while (i < b.length - 1 && b[i] === 0) i++;
  const v = b.subarray(i);
  return sshString(v[0] & 0x80 ? concat(new Uint8Array([0]), v) : v);
}
const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const wrap = (s: string, n: number) => s.match(new RegExp(`.{1,${n}}`, "g"))!.join("\n");

async function fingerprint(blob: Uint8Array<ArrayBuffer>): Promise<{ fp: string; digest: Uint8Array }> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", blob));
  return { fp: `SHA256:${b64(digest).replace(/=+$/, "")}`, digest };
}

/** OpenSSH's "drunken bishop" visual host key, same algorithm as ssh-keygen -lv. */
function randomArt(digest: Uint8Array, title: string): string {
  const W = 17;
  const H = 9;
  const field = Array.from({ length: H }, () => new Array(W).fill(0));
  let x = 8;
  let y = 4;
  for (const byte of digest) {
    for (let s = 0; s < 8; s += 2) {
      const d = (byte >> s) & 3;
      x = Math.max(0, Math.min(W - 1, x + (d & 1 ? 1 : -1)));
      y = Math.max(0, Math.min(H - 1, y + (d & 2 ? 1 : -1)));
      field[y][x]++;
    }
  }
  const chars = " .o+=*BOX@%&#/^";
  const rows = field.map((row, ry) => row.map((v, rx) => (rx === 8 && ry === 4 ? "S" : rx === x && ry === y ? "E" : chars[Math.min(v, chars.length - 1)])).join(""));
  const head = `[${title}]`;
  const pad = W - head.length;
  const top = "+" + "-".repeat(Math.floor(pad / 2)) + head + "-".repeat(Math.ceil(pad / 2)) + "+";
  return [top, ...rows.map((r) => `|${r}|`), "+----[SHA256]-----+"].join("\n");
}

async function generate(algo: Algo, comment: string): Promise<KeyPair> {
  if (algo === "ed25519") {
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
    const seed = pkcs8.subarray(pkcs8.length - 32);
    const pubBlob = concat(sshString("ssh-ed25519"), sshString(pub));
    const check = crypto.getRandomValues(new Uint8Array(4));
    let priv = concat(check, check, sshString("ssh-ed25519"), sshString(pub), sshString(concat(seed, pub)), sshString(comment));
    const padLen = (8 - (priv.length % 8)) % 8;
    priv = concat(priv, Uint8Array.from({ length: padLen }, (_, i) => i + 1));
    const body = concat(enc.encode("openssh-key-v1\0"), sshString("none"), sshString("none"), sshString(new Uint8Array()), u32(1), sshString(pubBlob), sshString(priv));
    const { fp, digest } = await fingerprint(pubBlob);
    return {
      algo,
      publicKey: `ssh-ed25519 ${b64(pubBlob)}${comment ? " " + comment : ""}`,
      privateKey: `-----BEGIN OPENSSH PRIVATE KEY-----\n${wrap(b64(body), 70)}\n-----END OPENSSH PRIVATE KEY-----\n`,
      fingerprint: fp,
      randomart: randomArt(digest, "ED25519 256"),
    };
  }
  const bits = algo === "rsa4096" ? 4096 : 3072;
  const kp = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
  const pubBlob = concat(sshString("ssh-rsa"), mpint(b64url(jwk.e!)), mpint(b64url(jwk.n!)));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  const { fp, digest } = await fingerprint(pubBlob);
  return {
    algo,
    publicKey: `ssh-rsa ${b64(pubBlob)}${comment ? " " + comment : ""}`,
    // OpenSSH reads PKCS#8 PEM RSA keys directly; convert with ssh-keygen -p to the OpenSSH format if needed.
    privateKey: `-----BEGIN PRIVATE KEY-----\n${wrap(b64(pkcs8), 64)}\n-----END PRIVATE KEY-----\n`,
    fingerprint: fp,
    randomart: randomArt(digest, `RSA ${bits}`),
  };
}

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SshKeygenTool() {
  const [algo, setAlgo] = useState<Algo>("ed25519");
  const [comment, setComment] = useState("moi@exemple.fr");
  const [pair, setPair] = useState<KeyPair | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      setPair(await generate(algo, comment.trim()));
    } catch (e) {
      setError(algo === "ed25519" ? "Ce navigateur ne prend pas encore en charge Ed25519 dans WebCrypto. Utilisez RSA, ou un navigateur récent (Chrome 113+, Firefox 129+, Safari 17+)." : e instanceof Error ? e.message : "Échec de la génération.");
    } finally {
      setBusy(false);
    }
  }

  const base = algo === "ed25519" ? "id_ed25519" : "id_rsa";

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Commentaire</span>
          <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <div className="field" style={{ flex: "none" }}>
          <span className="field-label">Algorithme</span>
          <SegmentedControl<Algo>
            value={algo}
            onChange={setAlgo}
            options={[
              { value: "ed25519", label: "Ed25519 (recommandé)" },
              { value: "rsa3072", label: "RSA 3072" },
              { value: "rsa4096", label: "RSA 4096" },
            ]}
          />
        </div>
        <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
          <button type="button" className="btn is-active" onClick={run} disabled={busy}>
            {busy ? "Génération…" : pair ? "Générer une nouvelle paire" : "Générer la paire de clés"}
          </button>
        </div>
      </div>

      {error && <p className="validation bad">{error}</p>}

      {pair && (
        <>
          <div className="panel mb-lg" style={{ minHeight: 0 }}>
            <div className="panel-head">
              <span className="label">Clé publique · {base}.pub</span>
              <span className="meta">à coller dans authorized_keys, GitHub, GitLab…</span>
            </div>
            <pre className="pre-compact" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {pair.publicKey}
            </pre>
            <div className="panel-tools">
              <CopyButton getText={() => pair.publicKey + "\n"} />
              <button type="button" className="btn" onClick={() => download(pair.publicKey + "\n", `${base}.pub`)}>
                Télécharger {base}.pub
              </button>
            </div>
          </div>
          <div className="bench bench-2">
            <div className="panel">
              <div className="panel-head">
                <span className="label">Clé privée · {base}</span>
                <span className="meta text-danger">à garder secrète</span>
              </div>
              <pre className="pre-compact">{pair.privateKey}</pre>
              <div className="panel-tools">
                <CopyButton getText={() => pair.privateKey} />
                <button type="button" className="btn" onClick={() => download(pair.privateKey, base)}>
                  Télécharger {base}
                </button>
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <span className="label">Empreinte</span>
              </div>
              <div className="hash-rows">
                <div className="hash-row">
                  <span className="alg">SHA256</span>
                  <span className="val">{pair.fingerprint.slice(7)}</span>
                  <CopyButton variant="mini" getText={() => pair.fingerprint} />
                </div>
              </div>
              <pre className="ssh-randomart">{pair.randomart}</pre>
            </div>
          </div>
          <div className="help-box" style={{ marginTop: "1rem" }}>
            <strong>Installer la clé</strong>
            <pre className="pre-compact">{`mv ~/Downloads/${base} ~/Downloads/${base}.pub ~/.ssh/
chmod 600 ~/.ssh/${base}
ssh-keygen -p -f ~/.ssh/${base}   # ajoute une phrase de passe (recommandé)`}</pre>
          </div>
        </>
      )}
      <p className="row-head hint" style={{ margin: "1rem 0 0" }}>
        Les clés sont générées par l'API WebCrypto du navigateur et ne quittent jamais la page. La clé privée n'est pas chiffrée : ajoutez une phrase de passe avec <code>ssh-keygen -p</code>.
      </p>
    </div>
  );
}
