import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Algo = "SHA-1" | "SHA-256" | "SHA-512";
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input: string): Uint8Array<ArrayBuffer> {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  if (!clean) throw new Error("Secret vide.");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const idx = B32.indexOf(c);
    if (idx === -1) throw new Error(`Caractère « ${c} » invalide en base32 (A–Z, 2–7).`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

/** RFC 6238 TOTP (RFC 4226 HOTP over a time counter), computed with WebCrypto. */
export async function totp(secret: Uint8Array<ArrayBuffer>, counter: number, digits: number, algo: Algo): Promise<string> {
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: algo }, false, ["sign"]);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const offset = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}

function randomSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)));
}

export function TotpTool() {
  const [secret, setSecret] = useState(randomSecret);
  const [issuer, setIssuer] = useState("Toolbox");
  const [account, setAccount] = useState("moi@example.com");
  const [digits, setDigits] = useState("6");
  const [period, setPeriod] = useState("30");
  const [algo, setAlgo] = useState<Algo>("SHA-1");
  const [now, setNow] = useState(() => Date.now());
  const [codes, setCodes] = useState<{ prev: string; cur: string; next: string } | null>(null);
  const [error, setError] = useState("");
  const [qr, setQr] = useState("");
  const [check, setCheck] = useState("");

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  const step = Math.max(1, Number(period) || 30);
  const counter = Math.floor(now / 1000 / step);
  const remaining = step - Math.floor((now / 1000) % step);

  const key = useMemo(() => {
    try {
      return { bytes: base32Decode(secret), error: "" };
    } catch (e) {
      return { bytes: null, error: e instanceof Error ? e.message : "Secret invalide." };
    }
  }, [secret]);

  useEffect(() => {
    if (!key.bytes) {
      setCodes(null);
      setError(key.error);
      return;
    }
    let cancelled = false;
    const d = Number(digits);
    Promise.all([counter - 1, counter, counter + 1].map((c) => totp(key.bytes!, c, d, algo)))
      .then(([prev, cur, next]) => {
        if (!cancelled) {
          setCodes({ prev, cur, next });
          setError("");
        }
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Erreur de calcul."));
    return () => {
      cancelled = true;
    };
  }, [key, counter, digits, algo]);

  const uri = useMemo(() => {
    const label = encodeURIComponent(issuer ? `${issuer}:${account}` : account);
    const params = new URLSearchParams({ secret: secret.replace(/[\s=]/g, "").toUpperCase(), issuer, algorithm: algo.replace("-", ""), digits, period: String(step) });
    return `otpauth://totp/${label}?${params.toString()}`;
  }, [issuer, account, secret, algo, digits, step]);

  useEffect(() => {
    if (!key.bytes) return setQr("");
    QRCode.toDataURL(uri, { margin: 1, scale: 5 }).then(setQr, () => setQr(""));
  }, [uri, key.bytes]);

  const checkResult = check.trim() && codes ? ([codes.prev, codes.cur, codes.next].includes(check.trim()) ? "ok" : "ko") : null;

  return (
    <div>
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <span className="field-label">Secret (base32)</span>
          <input className="input" value={secret} onChange={(e) => setSecret(e.target.value)} spellCheck={false} />
        </div>
        <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={() => setSecret(randomSecret())}>
            Nouveau secret
          </button>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Émetteur</span>
          <input className="input" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Compte</span>
          <input className="input" value={account} onChange={(e) => setAccount(e.target.value)} />
        </div>
      </div>
      <div className="panel-tools mb-lg">
        <SegmentedControl value={digits} onChange={setDigits} options={[{ value: "6", label: "6 chiffres" }, { value: "8", label: "8 chiffres" }]} />
        <SegmentedControl value={period} onChange={setPeriod} options={[{ value: "30", label: "30 s" }, { value: "60", label: "60 s" }]} />
        <SegmentedControl<Algo>
          value={algo}
          onChange={setAlgo}
          options={[
            { value: "SHA-1", label: "SHA-1" },
            { value: "SHA-256", label: "SHA-256" },
            { value: "SHA-512", label: "SHA-512" },
          ]}
        />
      </div>

      {error ? (
        <p className="empty-state text-danger">{error}</p>
      ) : (
        codes && (
          <div className="totp-layout">
            <div className="panel totp-panel">
              <div className="panel-head">
                <span className="label">Code actuel</span>
                <span className="meta">expire dans {remaining} s</span>
              </div>
              <div className="totp-code">{codes.cur.replace(/(\d{3,4})(?=\d{3,4}$)/, "$1 ")}</div>
              <div className="totp-bar">
                <span style={{ width: `${(remaining / step) * 100}%` }} className={remaining <= 5 ? "low" : undefined} />
              </div>
              <div className="hash-rows">
                <div className="hash-row hash-row-2">
                  <span className="alg">Précédent</span>
                  <span className="val">{codes.prev}</span>
                </div>
                <div className="hash-row hash-row-2">
                  <span className="alg">Suivant</span>
                  <span className="val">{codes.next}</span>
                </div>
              </div>
              <div className="panel-tools">
                <CopyButton getText={() => codes.cur} label="Copier le code" />
              </div>
              <div className="field" style={{ marginTop: ".5rem" }}>
                <span className="field-label">Vérifier un code (± 1 période)</span>
                <input className="input" value={check} onChange={(e) => setCheck(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="123456" />
                {checkResult && <span className={checkResult === "ok" ? "text-success" : "text-danger"}>{checkResult === "ok" ? "✓ Code valide" : "✗ Code invalide"}</span>}
              </div>
            </div>
            <div className="panel totp-panel">
              <div className="panel-head">
                <span className="label">QR à scanner</span>
              </div>
              {qr && <img src={qr} alt="QR code otpauth" className="totp-qr" />}
              <div className="hash-rows">
                <div className="hash-row">
                  <span className="alg">URI</span>
                  <span className="val" style={{ wordBreak: "break-all" }}>
                    {uri}
                  </span>
                  <CopyButton variant="mini" getText={() => uri} />
                </div>
              </div>
            </div>
          </div>
        )
      )}
      <p className="row-head hint" style={{ margin: "1rem 0 0" }}>
        Compatible Google Authenticator, Authy, 1Password, Bitwarden… Le secret ne quitte jamais votre navigateur.
      </p>
    </div>
  );
}
