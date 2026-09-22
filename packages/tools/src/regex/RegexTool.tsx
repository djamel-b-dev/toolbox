import { useState } from "react";

interface Segment {
  text: string;
  match: boolean;
}

function buildSegments(text: string, matches: RegExpMatchArray[]): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const m of matches) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (start < last) continue;
    if (start > last) segments.push({ text: text.slice(last, start), match: false });
    segments.push({ text: text.slice(start, end) || " ", match: true });
    last = end;
  }
  if (last < text.length) segments.push({ text: text.slice(last), match: false });
  return segments;
}

export function RegexTool() {
  const [pattern, setPattern] = useState("\\w+@\\w+\\.\\w+");
  const [caseInsensitive, setCaseInsensitive] = useState(true);
  const [multiline, setMultiline] = useState(false);
  const [dotAll, setDotAll] = useState(false);
  const [text, setText] = useState("Contact : hello@toolbox.dev ou admin@example.com");

  let regex: RegExp | null = null;
  let error = "";
  if (pattern) {
    try {
      let flags = "g";
      if (caseInsensitive) flags += "i";
      if (multiline) flags += "m";
      if (dotAll) flags += "s";
      regex = new RegExp(pattern, flags);
    } catch (e) {
      error = e instanceof Error ? e.message : "Expression régulière invalide.";
    }
  }

  const matches = regex && text ? Array.from(text.matchAll(regex)) : [];
  const segments = regex && !error ? buildSegments(text, matches) : [{ text, match: false }];

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Motif</span>
          <input className="input" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="\w+@\w+\.\w+" />
        </div>
      </div>

      <div className="panel-tools mb-lg">
        <label className="check-row">
          <input type="checkbox" checked={caseInsensitive} onChange={(e) => setCaseInsensitive(e.target.checked)} />
          Insensible à la casse
        </label>
        <label className="check-row">
          <input type="checkbox" checked={multiline} onChange={(e) => setMultiline(e.target.checked)} />
          Multiligne
        </label>
        <label className="check-row">
          <input type="checkbox" checked={dotAll} onChange={(e) => setDotAll(e.target.checked)} />
          Le point capture les sauts de ligne
        </label>
      </div>

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Texte à tester</span>
          <span className="meta">
            {matches.length} correspondance{matches.length > 1 ? "s" : ""}
          </span>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} style={{ minHeight: 100 }} />
      </div>

      {error ? (
        <div className="panel">
          <pre className="is-error">{error}</pre>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-head">
            <span className="label">Aperçu</span>
          </div>
          <p className="match-text">
            {segments.map((s, i) => (s.match ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
          </p>
        </div>
      )}

      {matches.length > 0 && !error && (
        <>
          <div className="row-head">
            <h2>Correspondances</h2>
          </div>
          <div className="hash-rows">
            {matches.map((m, i) => (
              <div className="hash-row" key={i}>
                <span className="alg">#{i + 1}</span>
                <span className="val">{m[0]}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-tertiary)" }}>
                  index {m.index}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
