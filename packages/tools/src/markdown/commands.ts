import { EditorSelection, type ChangeSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

export type EditorCommand = (view: EditorView) => boolean;

/** Selection marker for templates: text between two markers ends up selected. Can't collide with Markdown's own `|`. */
const C = "\u0001";

/** Toggles an inline marker (`**`, `_`, `~~`, `` ` ``) around each selection. */
export function toggleWrap(marker: string, placeholder: string, closing = marker): EditorCommand {
  return (view) => {
    const { state } = view;
    const tr = state.changeByRange((range) => {
      const text = state.sliceDoc(range.from, range.to);
      const before = state.sliceDoc(range.from - marker.length, range.from);
      const after = state.sliceDoc(range.to, range.to + closing.length);
      if (before === marker && after === closing) {
        return {
          changes: [
            { from: range.from - marker.length, to: range.from },
            { from: range.to, to: range.to + closing.length },
          ],
          range: EditorSelection.range(range.from - marker.length, range.to - marker.length),
        };
      }
      if (text.startsWith(marker) && text.endsWith(closing) && text.length >= marker.length + closing.length) {
        const inner = text.slice(marker.length, text.length - closing.length);
        return { changes: { from: range.from, to: range.to, insert: inner }, range: EditorSelection.range(range.from, range.from + inner.length) };
      }
      const content = text || placeholder;
      return {
        changes: { from: range.from, to: range.to, insert: marker + content + closing },
        range: EditorSelection.range(range.from + marker.length, range.from + marker.length + content.length),
      };
    });
    view.dispatch(state.update(tr, { scrollIntoView: true, userEvent: "input.format" }));
    view.focus();
    return true;
  };
}

const BLOCK_PREFIX = /^(\s*)(#{1,6}\s+|>\s?|[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+[.)]\s+)?/;

/**
 * Applies a line prefix to every line touched by the selection. If every line
 * already carries it, removes it instead. Any other block prefix (heading,
 * list, quote) is replaced, so "H2" on a "- item" line turns it into "## item".
 */
export function toggleLinePrefix(prefix: (index: number) => string, matcher: RegExp): EditorCommand {
  return (view) => {
    const { state } = view;
    const lines = new Set<number>();
    for (const r of state.selection.ranges) {
      const first = state.doc.lineAt(r.from).number;
      const last = state.doc.lineAt(r.to).number;
      for (let n = first; n <= last; n++) lines.add(n);
    }
    const sorted = [...lines].sort((a, b) => a - b);
    const allHave = sorted.every((n) => matcher.test(state.doc.line(n).text));
    const changes: ChangeSpec[] = [];
    sorted.forEach((n, i) => {
      const line = state.doc.line(n);
      const m = line.text.match(BLOCK_PREFIX)!;
      const indent = m[1];
      const existing = m[2] ?? "";
      const from = line.from + indent.length;
      const to = from + existing.length;
      changes.push({ from, to, insert: allHave ? "" : prefix(i) });
    });
    view.dispatch({ changes, scrollIntoView: true, userEvent: "input.format" });
    view.focus();
    return true;
  };
}

export function setHeading(level: number): EditorCommand {
  if (level === 0) return toggleLinePrefix(() => "", /^\s*(?!)/);
  const marker = "#".repeat(level) + " ";
  return toggleLinePrefix(() => marker, new RegExp(`^\\s*#{${level}}\\s`));
}

/** Current heading level (0 = paragraph) of the line holding the main cursor. */
export function headingLevelAt(view: EditorView): number {
  const line = view.state.doc.lineAt(view.state.selection.main.head);
  return line.text.match(/^#{1,6}(?=\s)/)?.[0].length ?? 0;
}

/**
 * Inserts a block on its own lines. `C` in the template marks where the
 * selection lands; `$SEL` is replaced by the current selection (or `fallback`).
 */
export function insertBlock(template: string, fallback = ""): EditorCommand {
  return (view) => {
    const { state } = view;
    const range = state.selection.main;
    const selected = state.sliceDoc(range.from, range.to) || fallback;
    const line = state.doc.lineAt(range.from);
    const atLineStart = range.from === line.from;
    const prevBlank = line.number === 1 || state.doc.line(line.number - 1).text.trim() === "";
    let lead = "";
    if (!atLineStart) lead = "\n\n";
    else if (!prevBlank && line.text.trim() !== "") lead = "\n";
    const endLine = state.doc.lineAt(range.to);
    const trail = range.to < endLine.to || endLine.number < state.doc.lines ? "\n" : "";

    let body = template.replace("$SEL", () => selected);
    const cursor = body.indexOf(C);
    let cursorEnd = -1;
    if (cursor !== -1) {
      body = body.slice(0, cursor) + body.slice(cursor + 1);
      cursorEnd = body.indexOf(C);
      if (cursorEnd !== -1) body = body.slice(0, cursorEnd) + body.slice(cursorEnd + 1);
    }
    const insert = lead + body + trail;
    const base = range.from + lead.length;
    const anchor = cursor === -1 ? base + body.length : base + cursor;
    const head = cursorEnd === -1 ? anchor : base + cursorEnd;
    view.dispatch({
      changes: { from: range.from, to: range.to, insert },
      selection: EditorSelection.range(anchor, head),
      scrollIntoView: true,
      userEvent: "input.format",
    });
    view.focus();
    return true;
  };
}

/** Inserts inline text at the cursor, with the same `C…C` selection convention. */
export function insertInline(template: string, fallback = ""): EditorCommand {
  return (view) => {
    const { state } = view;
    const range = state.selection.main;
    const selected = state.sliceDoc(range.from, range.to) || fallback;
    let body = template.replace("$SEL", () => selected);
    const a = body.indexOf(C);
    body = body.replace(C, "");
    const b = body.indexOf(C);
    body = body.replace(C, "");
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: body },
      selection: EditorSelection.range(range.from + (a === -1 ? body.length : a), range.from + (b === -1 ? (a === -1 ? body.length : a) : b)),
      scrollIntoView: true,
      userEvent: "input.format",
    });
    view.focus();
    return true;
  };
}

export const insertLink: EditorCommand = (view) => {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to);
  if (/^https?:\/\/\S+$/.test(text)) return insertInline(`[${C}texte du lien${C}](${text})`)(view);
  return insertInline(`[$SEL](${C}https://${C})`, "texte du lien")(view);
};

export const insertImage: EditorCommand = (view) => insertInline(`![$SEL](${C}https://${C})`, "description")(view);

export function insertTable(rows: number, cols: number): EditorCommand {
  // The first header cell is selected so the user can type over it straight away.
  const header = "| " + Array.from({ length: cols }, (_, i) => (i === 0 ? `${C}Colonne 1${C}` : `Colonne ${i + 1}`)).join(" | ") + " |";
  const sep = "| " + Array.from({ length: cols }, () => "---").join(" | ") + " |";
  const row = "| " + Array.from({ length: cols }, () => "   ").join(" | ") + " |";
  const body = Array.from({ length: rows }, () => row).join("\n");
  return insertBlock(`${header}\n${sep}\n${body}\n`);
}

export function insertCodeBlock(lang: string): EditorCommand {
  return insertBlock("```" + lang + `\n${C}$SEL${C}\n` + "```\n", "code");
}

/** Adds `[^n]` at the cursor and its definition at the end of the document. */
export const insertFootnote: EditorCommand = (view) => {
  const { state } = view;
  const used = [...state.doc.toString().matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
  const n = used.length ? Math.max(...used) + 1 : 1;
  const pos = state.selection.main.head;
  const end = state.doc.length;
  const tail = state.doc.toString().endsWith("\n") ? "" : "\n";
  const def = `${tail}\n[^${n}]: `;
  const ref = `[^${n}]`;
  view.dispatch({
    changes: [
      { from: pos, insert: ref },
      { from: end, insert: def + "Texte de la note." },
    ],
    selection: EditorSelection.range(end + ref.length + def.length, end + ref.length + def.length + "Texte de la note.".length),
    scrollIntoView: true,
    userEvent: "input.format",
  });
  view.focus();
  return true;
};

export function insertAlert(type: string): EditorCommand {
  return insertBlock(`> [!${type.toUpperCase()}]\n> ${C}$SEL${C}\n`, "Votre message.");
}

export const MERMAID_TEMPLATE = "```mermaid\nflowchart LR\n  A[" + C + "Début" + C + "] --> B{Choix}\n  B -->|Oui| C[Action]\n  B -->|Non| D[Fin]\n```\n";

export const MATH_BLOCK_TEMPLATE = `$$\n${C}E = mc^2${C}\n$$\n`;
export const INLINE_MATH_TEMPLATE = `$${C}$SEL${C}$`;

/** Toggles the task at `index` (in document order, outside code fences) between `[ ]` and `[x]`. */
export function toggleTaskAt(view: EditorView, index: number): void {
  const { doc } = view.state;
  let inFence = false;
  let seen = 0;
  for (let n = 1; n <= doc.lines; n++) {
    const line = doc.line(n);
    if (/^\s*(```|~~~)/.test(line.text)) inFence = !inFence;
    if (inFence) continue;
    const m = line.text.match(/^(\s*(?:>\s*)*[-*+]\s+\[)([ xX])\]/);
    if (!m) continue;
    if (seen++ === index) {
      const pos = line.from + m[1].length;
      view.dispatch({ changes: { from: pos, to: pos + 1, insert: m[2] === " " ? "x" : " " }, userEvent: "input.toggle" });
      return;
    }
  }
}
