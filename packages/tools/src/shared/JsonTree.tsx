import { useState, type ReactNode } from "react";
import { TreeToolbar, type ExpandCommand } from "./treeCommon";

const CHUNK = 100;

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function isContainer(v: unknown): v is Json[] | Record<string, Json> {
  return typeof v === "object" && v !== null;
}

function pathSegment(parentPath: string, key: string | number): string {
  if (typeof key === "number") return `${parentPath}[${key}]`;
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${parentPath}.${key}` : `${parentPath}[${JSON.stringify(key)}]`;
}

function countDescendants(v: unknown): number {
  if (!isContainer(v)) return 1;
  let n = 1;
  for (const child of Object.values(v)) n += countDescendants(child);
  return n;
}

function Primitive({ value }: { value: Json }) {
  if (value === null) return <span className="tk-null">null</span>;
  if (typeof value === "string") return <span className="tk-string">{JSON.stringify(value)}</span>;
  if (typeof value === "number") return <span className="tk-number">{String(value)}</span>;
  if (typeof value === "boolean") return <span className="tk-bool">{String(value)}</span>;
  return null;
}

function RowActions({ path, value }: { path: string; value: Json }) {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(what: "path" | "value") {
    const text = what === "path" ? path : typeof value === "string" ? value : JSON.stringify(value, null, 2);
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(null), 1000);
  }
  return (
    <span className="tree-actions">
      <button type="button" onClick={() => copy("path")} title={`Copier le chemin ${path}`}>
        {copied === "path" ? "Copié" : "chemin"}
      </button>
      <button type="button" onClick={() => copy("value")} title="Copier la valeur">
        {copied === "value" ? "Copié" : "valeur"}
      </button>
    </span>
  );
}

interface NodeProps {
  name: ReactNode;
  value: Json;
  path: string;
  depth: number;
  command: ExpandCommand;
  last: boolean;
}

function JsonNode({ name, value, path, depth, command, last }: NodeProps) {
  const [open, setOpen] = useState(() => (command.kind === "all" ? true : depth < command.depth));
  const [shown, setShown] = useState(CHUNK);
  const comma = last ? null : <span className="tk-punct">,</span>;

  if (!isContainer(value)) {
    return (
      <div className="tree-row">
        <span className="tree-toggle-spacer" />
        {name}
        <Primitive value={value} />
        {comma}
        <RowActions path={path} value={value} />
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries: [string | number, Json][] = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
  const [openBr, closeBr] = isArray ? ["[", "]"] : ["{", "}"];
  const summary = isArray ? `${entries.length} élément${entries.length > 1 ? "s" : ""}` : `${entries.length} clé${entries.length > 1 ? "s" : ""}`;

  if (entries.length === 0) {
    return (
      <div className="tree-row">
        <span className="tree-toggle-spacer" />
        {name}
        <span className="tk-punct">
          {openBr}
          {closeBr}
        </span>
        {comma}
        <RowActions path={path} value={value} />
      </div>
    );
  }

  return (
    <div className="tree-node">
      <div className="tree-row">
        <button type="button" className={"tree-toggle" + (open ? " open" : "")} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Replier" : "Déplier"}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <polyline points="7 5 13 10 7 15" />
          </svg>
        </button>
        <span className="tree-clickable" onClick={() => setOpen((o) => !o)}>
          {name}
          <span className="tk-punct">{openBr}</span>
          {!open && (
            <>
              <span className="tree-summary">{summary}</span>
              <span className="tk-punct">{closeBr}</span>
              {comma}
            </>
          )}
        </span>
        <RowActions path={path} value={value} />
      </div>
      {open && (
        <>
          <div className="tree-children">
            {entries.slice(0, shown).map(([k, v], i) => (
              <JsonNode
                key={k}
                name={
                  isArray ? (
                    <span className="tk-index">{k}: </span>
                  ) : (
                    <>
                      <span className="tk-key">{JSON.stringify(k)}</span>
                      <span className="tk-punct">: </span>
                    </>
                  )
                }
                value={v}
                path={pathSegment(path, k)}
                depth={depth + 1}
                command={command}
                last={i === entries.length - 1}
              />
            ))}
            {entries.length > shown && (
              <button type="button" className="tree-more" onClick={() => setShown((s) => s + CHUNK * 5)}>
                Afficher {Math.min(CHUNK * 5, entries.length - shown)} de plus ({entries.length - shown} restants)
              </button>
            )}
          </div>
          <div className="tree-row">
            <span className="tree-toggle-spacer" />
            <span className="tk-punct">{closeBr}</span>
            {comma}
          </div>
        </>
      )}
    </div>
  );
}

export function JsonTree({ data, defaultDepth = 2 }: { data: unknown; defaultDepth?: number }) {
  const [command, setCommand] = useState<ExpandCommand>({ kind: "depth", depth: defaultDepth, token: 0 });
  const nodes = countDescendants(data);
  return (
    <div className="tree-box">
      <TreeToolbar command={command} onCommand={setCommand} meta={`${nodes.toLocaleString("fr-FR")} nœud${nodes > 1 ? "s" : ""}`} />
      <div className="tree" key={command.token}>
        <JsonNode name={null} value={data as Json} path="$" depth={0} command={command} last />
      </div>
    </div>
  );
}
