import { useEffect, useRef, useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encryptText(text: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, new TextEncoder().encode(text)));
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);
  return bytesToBase64(combined);
}

async function decryptText(blob: string, passphrase: string): Promise<string> {
  const bytes = base64ToBytes(blob);
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ciphertext = bytes.slice(28);
  const key = await deriveKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ciphertext as BufferSource);
  return new TextDecoder().decode(plainBuf);
}

type Mode = "encrypt" | "decrypt";

export function AesTool() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [passphrase, setPassphrase] = useState("correct horse battery staple");
  const [input, setInput] = useState("Le lancement est prévu vendredi.");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!input || !passphrase) {
      setOutput("");
      setError("");
      return;
    }
    timer.current = window.setTimeout(() => {
      const task = mode === "encrypt" ? encryptText(input, passphrase) : decryptText(input, passphrase);
      task
        .then((r) => {
          setOutput(r);
          setError("");
        })
        .catch(() => {
          setOutput("");
          setError(mode === "encrypt" ? "Le chiffrement a échoué." : "Mot de passe incorrect ou données corrompues.");
        });
    }, 200);
    return () => window.clearTimeout(timer.current);
  }, [mode, input, passphrase]);

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={(m) => {
            setMode(m);
            setInput("");
          }}
          options={[
            { value: "encrypt", label: "Chiffrer" },
            { value: "decrypt", label: "Déchiffrer" },
          ]}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">Phrase secrète</span>
          <input className="input" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
        </div>
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "encrypt" ? "Texte en clair" : "Texte chiffré (base64)"}</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "encrypt" ? "Texte chiffré (base64)" : "Texte en clair"}</span>
          </div>
          <pre className={error ? "is-error" : undefined}>{error || output}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
      <p className="row-head hint" style={{ margin: "0.85rem 0 0" }}>
        AES-256-GCM, clé dérivée par PBKDF2 (100 000 itérations). Sel et vecteur d'initialisation aléatoires à chaque chiffrement.
      </p>
    </div>
  );
}
