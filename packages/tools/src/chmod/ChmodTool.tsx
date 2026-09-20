import { Fragment, useState } from "react";
import { CopyButton } from "@toolbox/ui";

const GROUPS = ["Propriétaire", "Groupe", "Autres"];
const PERMS = [
  { key: "r", label: "Lecture", value: 4 },
  { key: "w", label: "Écriture", value: 2 },
  { key: "x", label: "Exécution", value: 1 },
];

export function ChmodTool() {
  const [state, setState] = useState<boolean[][]>([
    [true, true, false],
    [true, false, false],
    [true, false, false],
  ]);

  function toggle(g: number, p: number) {
    setState((prev) => prev.map((row, gi) => (gi === g ? row.map((v, pi) => (pi === p ? !v : v)) : row)));
  }

  const octalDigits = state.map((row) => row.reduce((sum, val, i) => (val ? sum + PERMS[i].value : sum), 0));
  const octal = octalDigits.join("");
  const symbolic = state.map((row) => row.map((v, i) => (v ? PERMS[i].key : "-")).join("")).join("");

  return (
    <div>
      <div className="chmod-grid">
        <span />
        {PERMS.map((p) => (
          <span className="ch-label" key={p.key}>
            {p.label}
          </span>
        ))}
        {GROUPS.map((g, gi) => (
          <Fragment key={g}>
            <span className="ch-label">{g}</span>
            {PERMS.map((p, pi) => (
              <label key={p.key} className="check-row">
                <input type="checkbox" checked={state[gi][pi]} onChange={() => toggle(gi, pi)} />
              </label>
            ))}
          </Fragment>
        ))}
      </div>

      <div className="hash-rows">
        <div className="hash-row">
          <span className="alg">Octal</span>
          <span className="val">{octal}</span>
          <CopyButton variant="mini" getText={() => octal} ariaLabel="Copier la notation octale" />
        </div>
        <div className="hash-row">
          <span className="alg">Symbolique</span>
          <span className="val">{symbolic}</span>
          <CopyButton variant="mini" getText={() => symbolic} ariaLabel="Copier la notation symbolique" />
        </div>
        <div className="hash-row">
          <span className="alg">Commande</span>
          <span className="val">chmod {octal} fichier</span>
          <CopyButton variant="mini" getText={() => `chmod ${octal} fichier`} ariaLabel="Copier la commande" />
        </div>
      </div>
    </div>
  );
}
