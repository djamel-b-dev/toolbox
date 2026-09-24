import { useMemo, useState, type ReactNode } from "react";
import { CopyButton } from "@toolbox/ui";

interface Kind {
  id: string;
  label: string;
  test: (cp: number) => boolean;
  danger?: boolean;
  tip: string;
}

const KINDS: Kind[] = [
  { id: "bidi", label: "Contrôle bidirectionnel", test: (c) => (c >= 0x202a && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069) || c === 0x200e || c === 0x200f || c === 0x061c, danger: true, tip: "Peut inverser l'affichage du code (attaque « Trojan Source »)." },
  { id: "zw", label: "Caractère de largeur nulle", test: (c) => c === 0x200b || c === 0x200c || c === 0x200d || c === 0x2060 || c === 0x180e, tip: "Invisible, casse les comparaisons, les mots de passe, les noms de variables." },
  { id: "bom", label: "BOM / ZWNBSP (U+FEFF)", test: (c) => c === 0xfeff, tip: "Souvent en début de fichier ; casse les scripts shell et certains parseurs JSON/CSV." },
  { id: "nbsp", label: "Espace insécable", test: (c) => c === 0x00a0 || c === 0x202f || c === 0x2007, tip: "Ressemble à une espace mais n'en est pas une (copier-coller depuis Word, Slack…)." },
  { id: "space", label: "Espace typographique", test: (c) => (c >= 0x2000 && c <= 0x200a) || c === 0x205f || c === 0x3000 || c === 0x1680, tip: "Espaces fines, cadratins… invisibles dans la plupart des éditeurs." },
  { id: "shy", label: "Trait d'union conditionnel", test: (c) => c === 0x00ad, tip: "Invisible sauf en fin de ligne ; casse la recherche de texte." },
  { id: "ctrl", label: "Caractère de contrôle", test: (c) => (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) || c === 0x7f || (c >= 0x80 && c <= 0x9f), danger: true, tip: "Octet de contrôle (NUL, ESC, BEL…) rarement voulu dans du texte." },
  { id: "tab", label: "Tabulation", test: (c) => c === 0x09, tip: "Peut poser problème en YAML ou dans un Makefile selon l'endroit." },
  { id: "quote", label: "Guillemet / apostrophe typographique", test: (c) => [0x2018, 0x2019, 0x201a, 0x201b, 0x201c, 0x201d, 0x201e, 0x00ab, 0x00bb, 0x2032, 0x2033].includes(c), tip: "Casse les commandes shell et le code copiés depuis un document." },
  { id: "dash", label: "Tiret long", test: (c) => c === 0x2013 || c === 0x2014 || c === 0x2212, tip: "« — » au lieu de « -- » : une option de commande devient invalide." },
];

const REPLACE_QUOTES: Record<string, string> = { "‘": "'", "’": "'", "‚": "'", "‛": "'", "“": '"', "”": '"', "„": '"', "«": '"', "»": '"', "′": "'", "″": '"' };

function name(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

export function TextCleanerTool() {
  const [input, setInput] = useState("Mot\u200bde\u200bpasse : s3cr\u00a0et\ncurl ——header “X-Api: 1”\u00a0https://api.test\n\ufeffif (isAdmin) {\u202e } \u2066// vérif. admin\u2069 {\r\nFin de ligne Windows   \r\n");
  const [opts, setOpts] = useState({ invisible: true, bidi: true, nbsp: true, quotes: true, dashes: true, trailing: true, eol: "lf" as "keep" | "lf" | "crlf", nfc: true, ctrl: true });

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ch of input) {
      const cp = ch.codePointAt(0)!;
      const k = KINDS.find((k) => k.test(cp));
      if (k) counts[k.id] = (counts[k.id] ?? 0) + 1;
    }
    const crlf = (input.match(/\r\n/g) ?? []).length;
    const lf = (input.match(/(?<!\r)\n/g) ?? []).length;
    const cr = (input.match(/\r(?!\n)/g) ?? []).length;
    const trailing = input.split(/\r?\n/).filter((l) => /[ \t]+$/.test(l)).length;
    // JS \w is ASCII-only even with /u, so split on letters explicitly to catch Cyrillic/Greek lookalikes.
    const mixedScript = (input.match(/\p{L}+/gu) ?? []).filter((w) => /[a-z]/i.test(w) && /[\u0400-\u04ff\u0370-\u03ff]/.test(w));
    return { counts, crlf, lf, cr, trailing, mixedScript };
  }, [input]);

  const cleaned = useMemo(() => {
    let s = input;
    if (opts.nfc) s = s.normalize("NFC");
    s = Array.from(s)
      .map((ch) => {
        const cp = ch.codePointAt(0)!;
        if (opts.bidi && KINDS[0].test(cp)) return "";
        if (opts.invisible && (KINDS[1].test(cp) || KINDS[2].test(cp) || KINDS[5].test(cp))) return "";
        if (opts.nbsp && (KINDS[3].test(cp) || KINDS[4].test(cp))) return " ";
        if (opts.ctrl && KINDS[6].test(cp)) return "";
        if (opts.quotes && REPLACE_QUOTES[ch]) return REPLACE_QUOTES[ch];
        if (opts.dashes && (cp === 0x2013 || cp === 0x2014)) return "--";
        if (opts.dashes && cp === 0x2212) return "-";
        return ch;
      })
      .join("");
    if (opts.trailing) s = s.replace(/[ \t]+(?=\r?\n|$)/g, "");
    if (opts.eol === "lf") s = s.replace(/\r\n?/g, "\n");
    if (opts.eol === "crlf") s = s.replace(/\r\n?|\n/g, "\r\n");
    return s;
  }, [input, opts]);

  const visual = useMemo(() => {
    const out: ReactNode[] = [];
    let buf = "";
    let key = 0;
    const flush = () => {
      if (buf) out.push(buf);
      buf = "";
    };
    for (const ch of input) {
      const cp = ch.codePointAt(0)!;
      const k = KINDS.find((k) => k.test(cp) && k.id !== "tab");
      if (ch === "\r") {
        flush();
        out.push(<span key={key++} className="tc-mark tc-eol">CR</span>);
      } else if (ch === "\n") {
        flush();
        out.push(<span key={key++} className="tc-mark tc-eol">LF</span>, "\n");
      } else if (ch === "\t") {
        flush();
        out.push(<span key={key++} className="tc-mark tc-tab">→</span>);
      } else if (k && k.id !== "quote" && k.id !== "dash") {
        flush();
        out.push(
          <span key={key++} className={"tc-mark" + (k.danger ? " tc-danger" : "")} title={`${k.label} ${name(cp)}`}>
            {name(cp)}
          </span>,
        );
      } else if (k) {
        flush();
        out.push(
          <span key={key++} className="tc-mark tc-soft" title={`${k.label} ${name(cp)}`}>
            {ch}
          </span>,
        );
      } else buf += ch;
    }
    flush();
    return out;
  }, [input]);

  const found = KINDS.filter((k) => stats.counts[k.id]);
  const toggle = (k: keyof typeof opts) => setOpts((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div>
      <div className="panel mb-lg" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Texte à analyser</span>
          <span className="meta">
            {Array.from(input).length} caractères · LF {stats.lf} · CRLF {stats.crlf}
            {stats.cr ? ` · CR ${stats.cr}` : ""}
          </span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 120 }} />
      </div>

      <div className="sec-list mb-lg">
        {found.length === 0 && stats.trailing === 0 && !(stats.crlf && stats.lf) && <div className="validation ok">✓ Aucun caractère suspect.</div>}
        {found.map((k) => (
          <div className={`sec-item sec-${k.danger ? "bad" : "warn"}`} key={k.id}>
            <span className="sec-icon">{stats.counts[k.id]}</span>
            <div className="sec-body">
              <div className="sec-head">
                <strong>{k.label}</strong>
              </div>
              <p>{k.tip}</p>
            </div>
          </div>
        ))}
        {stats.crlf > 0 && stats.lf > 0 && (
          <div className="sec-item sec-warn">
            <span className="sec-icon">!</span>
            <div className="sec-body">
              <strong>Fins de ligne mélangées</strong>
              <p>{stats.crlf} en CRLF (Windows) et {stats.lf} en LF (Unix) : source de diffs Git bruyants et de scripts qui échouent.</p>
            </div>
          </div>
        )}
        {stats.trailing > 0 && (
          <div className="sec-item sec-info">
            <span className="sec-icon">{stats.trailing}</span>
            <div className="sec-body">
              <strong>Ligne(s) avec espaces en fin de ligne</strong>
            </div>
          </div>
        )}
        {stats.mixedScript.length > 0 && (
          <div className="sec-item sec-bad">
            <span className="sec-icon">!</span>
            <div className="sec-body">
              <strong>Homoglyphes probables</strong>
              <p>Mots mêlant alphabet latin et cyrillique/grec (usurpation de domaine, identifiants piégés) : {stats.mixedScript.slice(0, 5).join(", ")}</p>
            </div>
          </div>
        )}
      </div>

      <div className="row-head">
        <h2>Visualisation</h2>
      </div>
      <pre className="tc-visual mb-lg">{visual}</pre>

      <div className="panel" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Texte nettoyé</span>
          <span className="meta">{Array.from(input).length - Array.from(cleaned).length} caractère(s) retiré(s)</span>
        </div>
        <div className="emoji-groups">
          {(
            [
              ["invisible", "Retirer les invisibles"],
              ["bidi", "Retirer les contrôles bidi"],
              ["ctrl", "Retirer les caractères de contrôle"],
              ["nbsp", "Espaces spéciales → espace"],
              ["quotes", "Guillemets droits"],
              ["dashes", "Tirets longs → --"],
              ["trailing", "Espaces en fin de ligne"],
              ["nfc", "Normaliser Unicode (NFC)"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" className={"btn" + (opts[k] ? " is-active" : "")} aria-pressed={!!opts[k]} onClick={() => toggle(k)}>
              {label}
            </button>
          ))}
          <select className="input" value={opts.eol} onChange={(e) => setOpts((o) => ({ ...o, eol: e.target.value as typeof o.eol }))} style={{ width: "auto" }} aria-label="Fins de ligne">
            <option value="keep">Fins de ligne : inchangées</option>
            <option value="lf">Fins de ligne : LF (Unix)</option>
            <option value="crlf">Fins de ligne : CRLF (Windows)</option>
          </select>
        </div>
        <pre>{cleaned}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => cleaned} />
          <button type="button" className="btn" onClick={() => setInput(cleaned)}>
            Remplacer l'entrée
          </button>
        </div>
      </div>
    </div>
  );
}
