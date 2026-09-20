import { useEffect, useState } from "react";
import { generateMnemonic, mnemonicToSeedWebcrypto, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

const STRENGTHS = [128, 160, 192, 224, 256] as const;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function Bip39Tool() {
  const [strength, setStrength] = useState<(typeof STRENGTHS)[number]>(128);
  const [mnemonic, setMnemonic] = useState(() => generateMnemonic(wordlist, 128));
  const [seedHex, setSeedHex] = useState("");

  useEffect(() => {
    let cancelled = false;
    mnemonicToSeedWebcrypto(mnemonic).then((seed) => {
      if (!cancelled) setSeedHex(toHex(seed));
    });
    return () => {
      cancelled = true;
    };
  }, [mnemonic]);

  const valid = validateMnemonic(mnemonic, wordlist);
  const words = mnemonic.split(" ");

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Force (bits d'entropie)</span>
          <SegmentedControl
            value={String(strength)}
            onChange={(v) => setStrength(Number(v) as (typeof STRENGTHS)[number])}
            options={STRENGTHS.map((s) => ({ value: String(s), label: `${s} (${(s / 32) * 3} mots)` }))}
          />
        </div>
      </div>

      <div className="panel-tools mb-lg">
        <button type="button" className="btn" onClick={() => setMnemonic(generateMnemonic(wordlist, strength))}>
          Générer une passphrase
        </button>
      </div>

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Passphrase BIP-39</span>
          <span className="meta">{words.length} mots</span>
        </div>
        <pre>{mnemonic}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => mnemonic} />
        </div>
      </div>

      <div className="hash-rows">
        <div className="hash-row hash-row-2">
          <span className="alg">Checksum</span>
          <span className={"val " + (valid ? "text-success" : "text-danger")}>
            {valid ? "Valide" : "Invalide"}
          </span>
        </div>
        <div className="hash-row">
          <span className="alg">Seed dérivé</span>
          <span className="val">{seedHex || "…"}</span>
          <CopyButton variant="mini" getText={() => seedHex} ariaLabel="Copier le seed" />
        </div>
      </div>

      <p className="row-head hint" style={{ margin: "0.85rem 0 0" }}>
        Généré et dérivé entièrement en local, via @scure/bip39 (audité, sans dépendance Node).
      </p>
    </div>
  );
}
