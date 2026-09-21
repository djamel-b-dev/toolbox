import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { CopyButton, Icon } from "@toolbox/ui";
import { useMarkdownDocs } from "@toolbox/core";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return "#";
}

function inline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  out = out.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_m, a, b) => `<strong>${a ?? b}</strong>`);
  out = out.replace(/\*([^*]+)\*|_([^_]+)_/g, (_m, a, b) => `<em>${a ?? b}</em>`);
  // Images before links — otherwise the link pattern below would match the
  // "[alt](url)" tail of an image and drop the leading "!".
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => `<img src="${sanitizeUrl(url)}" alt="${alt}" />`);
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, label, url) => `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );
  return out;
}

const TABLE_SEPARATOR = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      closeList();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      closeList();
      html.push("<hr />");
      i++;
      continue;
    }

    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && TABLE_SEPARATOR.test(lines[i + 1])) {
      closeList();
      const headerCells = splitTableRow(line);
      i += 2; // header + separator
      const rows: string[][] = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      html.push("<table>");
      html.push("<thead><tr>" + headerCells.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead>");
      if (rows.length) {
        html.push(
          "<tbody>" + rows.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("") + "</tbody>",
        );
      }
      html.push("</table>");
      continue;
    }

    if (/^>\s?/.test(line)) {
      closeList();
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      html.push(`<blockquote>${inline(quoteLines.join(" "))}</blockquote>`);
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      const taskMatch = ulMatch[1].match(/^\[([ xX])\]\s+(.*)$/);
      if (taskMatch) {
        const checked = taskMatch[1].toLowerCase() === "x";
        html.push(`<li class="md-task"><input type="checkbox" disabled ${checked ? "checked" : ""} /> ${inline(taskMatch[2])}</li>`);
      } else {
        html.push(`<li>${inline(ulMatch[1])}</li>`);
      }
      i++;
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inline(olMatch[1])}</li>`);
      i++;
      continue;
    }

    if (line.trim() === "") {
      closeList();
      i++;
      continue;
    }

    closeList();
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(-{3,}|\*{3,})\s*$/.test(lines[i]) &&
      !(/^\|.*\|\s*$/.test(lines[i]) && i + 1 < lines.length && TABLE_SEPARATOR.test(lines[i + 1]))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    html.push(`<p>${inline(paraLines.join(" "))}</p>`);
  }

  closeList();
  return html.join("\n");
}

const EXAMPLE = `# Bonjour

Ceci est un **aperçu** de _Markdown_, en local.

- Rapide
- Sûr
- Sans dépendance

> Rien ne quitte l'onglet.

\`\`\`
const ok = true;
\`\`\`
`;

interface ToolbarAction {
  label: string;
  title: string;
  style?: CSSProperties;
  run: (el: HTMLTextAreaElement, setValue: (v: string, selStart: number, selEnd: number) => void) => void;
}

function wrapSelection(before: string, after: string, placeholder: string): ToolbarAction["run"] {
  return (el, setValue) => {
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const newValue = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
    const newStart = selectionStart + before.length;
    setValue(newValue, newStart, newStart + selected.length);
  };
}

function applyLinePrefix(prefix: (lineIndex: number) => string): ToolbarAction["run"] {
  return (el, setValue) => {
    const { selectionStart, selectionEnd, value } = el;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const lineEndSearch = value.indexOf("\n", Math.max(selectionEnd - 1, 0));
    const lineEnd = lineEndSearch === -1 ? value.length : lineEndSearch;
    const prefixed = value
      .slice(lineStart, lineEnd)
      .split("\n")
      .map((l, i) => prefix(i) + l)
      .join("\n");
    const newValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    setValue(newValue, lineStart, lineStart + prefixed.length);
  };
}

function insertLabeledUrl(open: string): ToolbarAction["run"] {
  return (el, setValue) => {
    const { selectionStart, selectionEnd, value } = el;
    const label = value.slice(selectionStart, selectionEnd) || (open === "!" ? "texte alternatif" : "texte du lien");
    const url = "https://";
    const snippet = `${open}[${label}](${url})`;
    const newValue = value.slice(0, selectionStart) + snippet + value.slice(selectionEnd);
    const urlStart = selectionStart + `${open}[${label}](`.length;
    setValue(newValue, urlStart, urlStart + url.length);
  };
}

function insertBlock(template: (selected: string) => string, placeholder = ""): ToolbarAction["run"] {
  return (el, setValue) => {
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const needsLeadingBreak = selectionStart > 0 && value[selectionStart - 1] !== "\n";
    const block = (needsLeadingBreak ? "\n\n" : "") + template(selected);
    const newValue = value.slice(0, selectionStart) + block + value.slice(selectionEnd);
    const cursor = selectionStart + block.length;
    setValue(newValue, cursor, cursor);
  };
}

function wrapBlock(fence: string, placeholder: string): ToolbarAction["run"] {
  return (el, setValue) => {
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const needsLeadingBreak = selectionStart > 0 && value[selectionStart - 1] !== "\n";
    const lead = needsLeadingBreak ? "\n" : "";
    const snippet = `${lead}${fence}\n${selected}\n${fence}\n`;
    const newValue = value.slice(0, selectionStart) + snippet + value.slice(selectionEnd);
    const codeStart = selectionStart + lead.length + fence.length + 1;
    setValue(newValue, codeStart, codeStart + selected.length);
  };
}

const TOOLBAR_GROUPS: ToolbarAction[][] = [
  [
    { label: "H1", title: "Titre 1", run: applyLinePrefix(() => "# ") },
    { label: "H2", title: "Titre 2", run: applyLinePrefix(() => "## ") },
    { label: "H3", title: "Titre 3", run: applyLinePrefix(() => "### ") },
  ],
  [
    { label: "B", title: "Gras", style: { fontWeight: 700 }, run: wrapSelection("**", "**", "texte en gras") },
    { label: "I", title: "Italique", style: { fontStyle: "italic" }, run: wrapSelection("_", "_", "texte en italique") },
    { label: "S", title: "Barré", style: { textDecoration: "line-through" }, run: wrapSelection("~~", "~~", "texte barré") },
    { label: "</>", title: "Code en ligne", run: wrapSelection("`", "`", "code") },
  ],
  [
    { label: "Lien", title: "Insérer un lien", run: insertLabeledUrl("") },
    { label: "Image", title: "Insérer une image", run: insertLabeledUrl("!") },
  ],
  [
    { label: "Liste", title: "Liste à puces", run: applyLinePrefix(() => "- ") },
    { label: "1.", title: "Liste numérotée", run: applyLinePrefix((i) => `${i + 1}. `) },
    { label: "☐", title: "Liste de tâches", run: applyLinePrefix(() => "- [ ] ") },
  ],
  [
    { label: "Citation", title: "Citation", run: applyLinePrefix(() => "> ") },
    { label: "Bloc", title: "Bloc de code", run: wrapBlock("```", "code") },
    { label: "―", title: "Ligne horizontale", run: insertBlock(() => "---\n") },
    {
      label: "Tableau",
      title: "Tableau",
      run: insertBlock(() => "| Colonne 1 | Colonne 2 |\n| --- | --- |\n| Cellule | Cellule |\n"),
    },
  ],
];

export function MarkdownTool() {
  const { docs, createDoc, updateDoc, removeDoc } = useMarkdownDocs();
  const [activeId, setActiveId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // One-time bootstrap: create the first document (pre-filled with the example)
  // if none exist yet. Guarded by a ref, not just `docs.length === 0` — React's
  // StrictMode dev double-invoke would otherwise run this twice against the same
  // stale (empty) closure and create two documents before either commit lands.
  const didBootstrap = useRef(false);
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    if (docs.length === 0) createDoc("Sans titre", EXAMPLE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the selection valid — naturally idempotent, safe to re-run any number
  // of times (falls back to the first document whenever the active one is gone).
  useEffect(() => {
    if (docs.length > 0 && (!activeId || !docs.some((d) => d.id === activeId))) {
      setActiveId(docs[0].id);
    }
  }, [docs, activeId]);

  const activeDoc = docs.find((d) => d.id === activeId);
  const html = useMemo(() => (activeDoc ? renderMarkdown(activeDoc.content) : ""), [activeDoc?.content]);

  if (!activeDoc) return null;

  function handleNew() {
    setActiveId(createDoc("Sans titre", ""));
  }

  function handleDelete() {
    if (!activeDoc || docs.length <= 1) return;
    if (!window.confirm(`Supprimer « ${activeDoc.title || "Sans titre"} » ?`)) return;
    removeDoc(activeDoc.id);
  }

  function handleDownload() {
    const blob = new Blob([activeDoc!.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(activeDoc!.title || "document").trim() || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires onChange
    if (!file) return;
    file.text().then((content) => {
      const title = file.name.replace(/\.(md|markdown|txt)$/i, "");
      setActiveId(createDoc(title || "Sans titre", content));
    });
  }

  function runToolbarAction(action: ToolbarAction) {
    const el = textareaRef.current;
    if (!el || !activeDoc) return;
    action.run(el, (newValue, selStart, selEnd) => {
      updateDoc(activeDoc.id, { content: newValue });
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(selStart, selEnd);
      });
    });
  }

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Document</span>
          <select className="input" value={activeDoc.id} onChange={(e) => setActiveId(e.target.value)}>
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title || "Sans titre"}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="field-label">Titre</span>
          <input
            className="input"
            value={activeDoc.title}
            onChange={(e) => updateDoc(activeDoc.id, { title: e.target.value })}
            placeholder="Sans titre"
          />
        </div>
      </div>

      <div className="panel-tools mb-lg">
        <button type="button" className="btn" onClick={handleNew}>
          Nouveau document
        </button>
        <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
          Ouvrir un fichier
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={handleFileSelected}
          style={{ display: "none" }}
        />
        <button type="button" className="btn" onClick={handleDownload}>
          Télécharger .md
        </button>
        <button type="button" className="btn" onClick={handleDelete} disabled={docs.length <= 1}>
          <Icon name="trash" />
          Supprimer
        </button>
      </div>

      <div className="bench bench-2">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Markdown</span>
            <span className="meta">{activeDoc.content.length} car.</span>
          </div>
          <div className="md-toolbar">
            {TOOLBAR_GROUPS.map((group, gi) => (
              <div className="md-toolbar-group" key={gi}>
                {group.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="md-toolbar-btn"
                    title={action.title}
                    aria-label={action.title}
                    style={action.style}
                    onClick={() => runToolbarAction(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={activeDoc.content}
            onChange={(e) => updateDoc(activeDoc.id, { content: e.target.value })}
            spellCheck={false}
            style={{ minHeight: 320 }}
          />
          <div className="panel-tools">
            <CopyButton getText={() => activeDoc.content} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Aperçu</span>
          </div>
          <div className="md-preview" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
