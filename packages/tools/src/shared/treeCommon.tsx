export type ExpandCommand = { kind: "all"; token: number } | { kind: "depth"; depth: number; token: number };

interface TreeToolbarProps {
  command: ExpandCommand;
  onCommand: (c: ExpandCommand) => void;
  meta?: string;
}

/** Expand/collapse controls shared by the JSON and XML trees. Each command remounts the tree with a new token. */
export function TreeToolbar({ command, onCommand, meta }: TreeToolbarProps) {
  const next = (c: { kind: "all" } | { kind: "depth"; depth: number }) => onCommand({ ...c, token: command.token + 1 });
  const activeDepth = command.kind === "depth" ? command.depth : null;
  return (
    <div className="tree-toolbar">
      <button type="button" className={"tree-tb-btn" + (command.kind === "all" ? " active" : "")} onClick={() => next({ kind: "all" })}>
        Tout déplier
      </button>
      <button type="button" className={"tree-tb-btn" + (activeDepth === 1 ? " active" : "")} onClick={() => next({ kind: "depth", depth: 1 })}>
        Tout replier
      </button>
      <span className="tree-tb-sep" />
      <span className="tree-tb-label">Niveau</span>
      {[2, 3, 4].map((d) => (
        <button key={d} type="button" className={"tree-tb-btn" + (activeDepth === d ? " active" : "")} onClick={() => next({ kind: "depth", depth: d })}>
          {d}
        </button>
      ))}
      {meta && <span className="tree-tb-meta">{meta}</span>}
    </div>
  );
}
