import { useMemo, useState } from "react";
import { SegmentedControl } from "@toolbox/ui";

type View = "split" | "unified";
interface Line {
  type: "ctx" | "add" | "del";
  text: string;
  oldNo?: number;
  newNo?: number;
}
interface Hunk {
  header: string;
  lines: Line[];
}
interface FileDiff {
  oldPath: string;
  newPath: string;
  status: "modifié" | "ajouté" | "supprimé" | "renommé";
  hunks: Hunk[];
  added: number;
  removed: number;
  binary: boolean;
}

const EXAMPLE = `diff --git a/src/api/users.ts b/src/api/users.ts
index 3b18e51..a9c4f02 100644
--- a/src/api/users.ts
+++ b/src/api/users.ts
@@ -12,9 +12,12 @@ export async function getUser(id: string) {
   const res = await fetch(\`/api/users/\${id}\`);
-  if (res.status !== 200) {
-    throw new Error("User not found");
+  if (!res.ok) {
+    throw new HttpError(res.status, \`User \${id} not found\`);
   }
-  return res.json();
+  const user: User = await res.json();
+  cache.set(id, user);
+  return user;
 }

 export async function deleteUser(id: string) {
diff --git a/src/errors.ts b/src/errors.ts
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/src/errors.ts
@@ -0,0 +1,6 @@
+export class HttpError extends Error {
+  constructor(public status: number, message: string) {
+    super(message);
+    this.name = "HttpError";
+  }
+}
`;

function parseDiff(text: string): FileDiff[] {
  const files: FileDiff[] = [];
  let file: FileDiff | null = null;
  let hunk: Hunk | null = null;
  let oldNo = 0;
  let newNo = 0;
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const start = (oldPath = "", newPath = "") => {
    file = { oldPath, newPath, status: "modifié", hunks: [], added: 0, removed: 0, binary: false };
    files.push(file);
    hunk = null;
  };
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const git = line.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (git) {
      start(git[1], git[2]);
      continue;
    }
    // "--- x" is only a file header when "+++ y" follows; otherwise it's a removed line starting with "--".
    if (line.startsWith("--- ") && lines[idx + 1]?.startsWith("+++ ")) {
      if (!file || (file as FileDiff).hunks.length) start();
      const p = line.slice(4).replace(/^a\//, "").replace(/\t.*$/, "");
      if (p === "/dev/null") (file as unknown as FileDiff).status = "ajouté";
      else (file as unknown as FileDiff).oldPath = p;
      continue;
    }
    if (line.startsWith("+++ ") && lines[idx - 1]?.startsWith("--- ") && file) {
      const f = file as FileDiff;
      const p = line.slice(4).replace(/^b\//, "").replace(/\t.*$/, "");
      if (p === "/dev/null") f.status = "supprimé";
      else f.newPath = p;
      continue;
    }
    if (!file) continue;
    const f = file as FileDiff;
    if (/^new file mode/.test(line)) f.status = "ajouté";
    else if (/^deleted file mode/.test(line)) f.status = "supprimé";
    else if (/^rename (from|to) /.test(line)) f.status = "renommé";
    else if (/^Binary files/.test(line)) f.binary = true;
    const h = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/);
    if (h) {
      oldNo = Number(h[1]);
      newNo = Number(h[2]);
      hunk = { header: line, lines: [] };
      f.hunks.push(hunk);
      continue;
    }
    if (!hunk) continue;
    const hk = hunk as Hunk;
    if (line.startsWith("+")) {
      hk.lines.push({ type: "add", text: line.slice(1), newNo: newNo++ });
      f.added++;
    } else if (line.startsWith("-")) {
      hk.lines.push({ type: "del", text: line.slice(1), oldNo: oldNo++ });
      f.removed++;
    } else if (line.startsWith(" ") || line === "") {
      // A trailing newline at the end of the patch is not a blank context line.
      if (line === "" && idx === lines.length - 1) continue;
      hk.lines.push({ type: "ctx", text: line.slice(1), oldNo: oldNo++, newNo: newNo++ });
    }
  }
  return files.filter((f) => f.hunks.length || f.binary || f.status !== "modifié");
}

/** Pairs deletions with the additions that follow them so a split view lines them up. */
function toRows(lines: Line[]): [Line | null, Line | null][] {
  const rows: [Line | null, Line | null][] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === "ctx") {
      rows.push([lines[i], lines[i]]);
      i++;
      continue;
    }
    const dels: Line[] = [];
    const adds: Line[] = [];
    while (i < lines.length && lines[i].type === "del") dels.push(lines[i++]);
    while (i < lines.length && lines[i].type === "add") adds.push(lines[i++]);
    for (let k = 0; k < Math.max(dels.length, adds.length); k++) rows.push([dels[k] ?? null, adds[k] ?? null]);
  }
  return rows;
}

function FileBlock({ f, view }: { f: FileDiff; view: View }) {
  const [open, setOpen] = useState(true);
  const path = f.status === "renommé" && f.oldPath !== f.newPath ? `${f.oldPath} → ${f.newPath}` : f.newPath || f.oldPath;
  return (
    <div className="gd-file">
      <button type="button" className="gd-file-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={"tree-toggle" + (open ? " open" : "")}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <polyline points="7 5 13 10 7 15" />
          </svg>
        </span>
        <span className="gd-path">{path}</span>
        <span className={`gd-status gd-${f.status}`}>{f.status}</span>
        <span className="text-success">+{f.added}</span>
        <span className="text-danger">−{f.removed}</span>
      </button>
      {open && (
        <div className="gd-body">
          {f.binary && <p className="gd-note">Fichier binaire, contenu non affiché.</p>}
          {f.hunks.map((h, hi) => (
            <div key={hi}>
              <div className="gd-hunk">{h.header}</div>
              {view === "unified"
                ? h.lines.map((l, li) => (
                    <div key={li} className={`gd-row gd-${l.type}`}>
                      <span className="gd-no">{l.oldNo ?? ""}</span>
                      <span className="gd-no">{l.newNo ?? ""}</span>
                      <span className="gd-sign">{l.type === "add" ? "+" : l.type === "del" ? "−" : " "}</span>
                      <span className="gd-text">{l.text}</span>
                    </div>
                  ))
                : toRows(h.lines).map(([a, b], ri) => (
                    <div key={ri} className="gd-split-row">
                      <div className={"gd-row " + (a ? `gd-${a.type}` : "gd-empty")}>
                        <span className="gd-no">{a?.oldNo ?? ""}</span>
                        <span className="gd-text">{a?.text ?? ""}</span>
                      </div>
                      <div className={"gd-row " + (b ? `gd-${b.type}` : "gd-empty")}>
                        <span className="gd-no">{b?.newNo ?? ""}</span>
                        <span className="gd-text">{b?.text ?? ""}</span>
                      </div>
                    </div>
                  ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GitDiffTool() {
  const [input, setInput] = useState(EXAMPLE);
  const [view, setView] = useState<View>("split");
  const files = useMemo(() => parseDiff(input), [input]);
  const added = files.reduce((n, f) => n + f.added, 0);
  const removed = files.reduce((n, f) => n + f.removed, 0);

  return (
    <div>
      <div className="panel mb-lg" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Patch (git diff / diff -u)</span>
          <span className="meta">{input.split("\n").length} lignes</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 140 }} placeholder="Collez la sortie de git diff, git show ou un fichier .patch" />
      </div>
      <div className="panel-tools mb-md" style={{ justifyContent: "space-between" }}>
        <span className="row-head hint" style={{ margin: 0 }}>
          {files.length} fichier{files.length > 1 ? "s" : ""} · <span className="text-success">+{added}</span> <span className="text-danger">−{removed}</span>
        </span>
        <SegmentedControl<View>
          value={view}
          onChange={setView}
          options={[
            { value: "split", label: "Côte à côte" },
            { value: "unified", label: "Unifié" },
          ]}
        />
      </div>
      {files.length === 0 ? (
        <p className="empty-state">Aucun diff reconnu. Collez une sortie au format unifié (lignes « @@ -a,b +c,d @@ »).</p>
      ) : (
        files.map((f, i) => <FileBlock key={i} f={f} view={view} />)
      )}
    </div>
  );
}
