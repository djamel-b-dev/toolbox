import { useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

type Sort = "none" | "asc" | "desc";
type Sep = "\n" | ", " | "; " | " ";
type Quote = "" | "'" | '"';

const SEP_OPTIONS: { value: Sep; label: string }[] = [
  { value: "\n", label: "Ligne" },
  { value: ", ", label: "Virgule" },
  { value: "; ", label: "Point-virgule" },
  { value: " ", label: "Espace" },
];

export function ListConverterTool() {
  const [input, setInput] = useState("banana\napple\ncherry\napple");
  const [trim, setTrim] = useState(true);
  const [dedupe, setDedupe] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [sort, setSort] = useState<Sort>("asc");
  const [sep, setSep] = useState<Sep>(", ");
  const [quote, setQuote] = useState<Quote>("");

  let items = input.split(/\r?\n/);
  if (trim) items = items.map((i) => i.trim());
  if (removeEmpty) items = items.filter((i) => i !== "");
  if (dedupe) items = Array.from(new Set(items));
  if (sort === "asc") items = [...items].sort((a, b) => a.localeCompare(b));
  if (sort === "desc") items = [...items].sort((a, b) => b.localeCompare(a));

  const output = items.map((i) => (quote ? `${quote}${i}${quote}` : i)).join(sep);

  return (
    <div>
      <div className="panel-tools mb-lg">
        <label className="check-row">
          <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
          Nettoyer les espaces
        </label>
        <label className="check-row">
          <input type="checkbox" checked={removeEmpty} onChange={(e) => setRemoveEmpty(e.target.checked)} />
          Retirer les lignes vides
        </label>
        <label className="check-row">
          <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
          Supprimer les doublons
        </label>
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">Tri</span>
          <SegmentedControl<Sort>
            value={sort}
            onChange={setSort}
            options={[
              { value: "none", label: "Aucun" },
              { value: "asc", label: "A → Z" },
              { value: "desc", label: "Z → A" },
            ]}
          />
        </div>
        <div className="field">
          <span className="field-label">Séparateur de sortie</span>
          <SegmentedControl<Sep> value={sep} onChange={setSep} options={SEP_OPTIONS} />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <span className="field-label">Guillemets</span>
          <SegmentedControl<Quote>
            value={quote}
            onChange={setQuote}
            options={[
              { value: "", label: "Aucun" },
              { value: "'", label: "' '" },
              { value: '"', label: '" "' },
            ]}
          />
        </div>
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Entrée</span>
            <span className="meta">{input.split(/\r?\n/).filter(Boolean).length} lignes</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Sortie</span>
            <span className="meta">{items.length} éléments</span>
          </div>
          <pre>{output}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
