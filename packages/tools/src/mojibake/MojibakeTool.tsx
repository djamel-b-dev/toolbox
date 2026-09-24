import { useMemo, useState } from "react";
import { CopyButton } from "@toolbox/ui";

// Windows-1252 differs from Latin-1 only in 0x80–0x9F; those code points map to these characters.
const CP1252_HIGH = [0x20ac, 0, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0, 0x017d, 0, 0, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0, 0x017e, 0x0178];
const TO_CP1252 = new Map<number, number>(CP1252_HIGH.map((cp, i) => [cp, 0x80 + i]).filter(([cp]) => cp !== 0) as [number, number][]);

/** Re-encodes text as single-byte Windows-1252 (or Latin-1); null when a character doesn't fit. */
function toSingleByte(s: string, cp1252: boolean): Uint8Array | null {
  const out: number[] = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x80 || (cp >= 0xa0 && cp <= 0xff) || (!cp1252 && cp <= 0xff)) out.push(cp);
    else if (cp1252 && TO_CP1252.has(cp)) out.push(TO_CP1252.get(cp)!);
    else if (cp1252 && cp >= 0x80 && cp <= 0x9f) out.push(cp);
    else return null;
  }
  return Uint8Array.from(out);
}

const strictUtf8 = new TextDecoder("utf-8", { fatal: true });
function decodeRun(run: string, cp1252: boolean): string | null {
  const bytes = toSingleByte(run, cp1252);
  if (!bytes) return null;
  try {
    return strictUtf8.decode(bytes);
  } catch {
    return null;
  }
}

// Every character a UTF-8 byte ≥ 0x80 can turn into when misread as Windows-1252 / Latin-1.
const SUSPECT = new RegExp(`[${String.fromCharCode(0x80)}-${String.fromCharCode(0xff)}${[...TO_CP1252.keys()].map((cp) => String.fromCharCode(cp)).join("")}]+`, "g");

/**
 * Repairs each run of suspect characters on its own: real text usually mixes
 * correctly decoded characters (« », é) with mojibake (Ã©), and re-encoding the
 * whole string at once would fail on the good parts.
 */
function fix(s: string, cp1252: boolean): string | null {
  let changed = false;
  const out = s.replace(SUSPECT, (run) => {
    const fixed = decodeRun(run, cp1252);
    if (fixed === null || fixed === run) return run;
    changed = true;
    return fixed;
  });
  return changed ? out : null;
}

/** How "broken" a string looks: typical mojibake sequences, replacement chars and C1 controls. */
function badness(s: string): number {
  return (s.match(/[ÃÂ][\u0080-¿]|â€|Ã[©¨ª«¢§®´¹¼]|[\u0080-\u009f]|�|Ã|Â/g) ?? []).length;
}

interface Candidate {
  label: string;
  text: string;
  score: number;
}

function candidates(input: string): Candidate[] {
  const out: Candidate[] = [];
  let cur = input;
  for (let pass = 1; pass <= 3; pass++) {
    const fixed = fix(cur, true) ?? fix(cur, false);
    if (!fixed || fixed === cur) break;
    out.push({ label: pass === 1 ? "UTF-8 lu comme Windows-1252 / Latin-1" : `Encodé ${pass} fois (double encodage)`, text: fixed, score: badness(fixed) });
    cur = fixed;
  }
  return out;
}

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join(" ");

export function MojibakeTool() {
  const [input, setInput] = useState("Le fichier « rÃ©sumÃ©.pdf » a Ã©tÃ© envoyÃ© â€” Ã§a marche, câ€™est rÃ©glÃ© ! ðŸŽ‰");
  const cands = useMemo(() => candidates(input), [input]);
  const best = cands.length ? cands.reduce((a, b) => (b.score <= a.score ? b : a)) : null;
  const hasReplacement = input.includes("�");
  const utf8 = new TextEncoder().encode(input);

  return (
    <div>
      <div className="panel mb-lg" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Texte abîmé</span>
          <span className="meta">score de corruption : {badness(input)}</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 110 }} />
      </div>

      {hasReplacement && (
        <p className="validation bad">
          Le texte contient des « � » (U+FFFD) : les octets d'origine ont déjà été remplacés, cette partie n'est pas récupérable. Il faut relire la source avec le bon encodage (souvent Windows-1252 ou ISO-8859-1).
        </p>
      )}

      {best ? (
        <div className="panel mb-lg" style={{ minHeight: 0 }}>
          <div className="panel-head">
            <span className="label">Texte réparé</span>
            <span className="meta text-success">{best.label}</span>
          </div>
          <pre>{best.text}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => best.text} />
            <button type="button" className="btn" onClick={() => setInput(best.text)}>
              Utiliser comme entrée
            </button>
          </div>
        </div>
      ) : (
        !hasReplacement && <p className="validation ok mb-lg">Aucun mojibake détecté : le texte semble correctement décodé.</p>
      )}

      {cands.length > 1 && (
        <div className="hash-rows mb-lg">
          {cands.map((c, i) => (
            <div className="hash-row" key={i}>
              <span className="alg">{c.label}</span>
              <span className="val">{c.text}</span>
              <CopyButton variant="mini" getText={() => c.text} />
            </div>
          ))}
        </div>
      )}

      <div className="row-head">
        <h2>Octets de l'entrée</h2>
      </div>
      <div className="hash-rows">
        <div className="hash-row">
          <span className="alg">UTF-8 ({utf8.length} o)</span>
          <span className="val">{hex(utf8.subarray(0, 96))}{utf8.length > 96 ? " …" : ""}</span>
          <CopyButton variant="mini" getText={() => hex(utf8)} />
        </div>
        <div className="hash-row">
          <span className="alg">Windows-1252</span>
          <span className="val">{(() => { const b = toSingleByte(input, true); return b ? hex(b.subarray(0, 96)) + (b.length > 96 ? " …" : "") : "non représentable (caractères hors Windows-1252)"; })()}</span>
          <span />
        </div>
      </div>

      <details className="help-box">
        <summary>D'où vient le mojibake ?</summary>
        <p>
          « é » s'écrit <code>C3 A9</code> en UTF-8. Si un logiciel lit ces deux octets comme du Windows-1252, il affiche « Ã© ». La réparation refait le chemin inverse : on ré-encode le texte en Windows-1252 pour retrouver les octets, puis on les relit en UTF-8. Causes fréquentes : export CSV depuis Excel, base de données en <code>latin1</code> avec des données UTF-8, en-tête <code>Content-Type</code> sans <code>charset</code>.
        </p>
      </details>
    </div>
  );
}
