import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import type { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import { redo, undo } from "@codemirror/commands";
import { openSearchPanel } from "@codemirror/search";
import { SegmentedControl } from "@toolbox/ui";
import { useMarkdownDocs, type MarkdownDoc } from "@toolbox/core";
import { Editor, type CursorInfo, type EditorSettings } from "./Editor";
import { countWords, renderMarkdown, renderMermaid } from "./render";
import { buildStandaloneHtml, downloadFile, printHtml, safeFilename } from "./export";
import { MdIcon, Popover, TablePicker, type MdIconName } from "./ui";
import {
  INLINE_MATH_TEMPLATE,
  MATH_BLOCK_TEMPLATE,
  MERMAID_TEMPLATE,
  headingLevelAt,
  insertAlert,
  insertBlock,
  insertCodeBlock,
  insertFootnote,
  insertImage,
  insertInline,
  insertLink,
  insertTable,
  setHeading,
  toggleLinePrefix,
  toggleTaskAt,
  toggleWrap,
  type EditorCommand,
} from "./commands";

type ViewMode = "edit" | "split" | "preview";

interface Settings extends EditorSettings {
  viewMode: ViewMode;
  syncScroll: boolean;
}

const SETTINGS_KEY = "toolbox:markdown-settings";
const SAVE_DELAY = 400;

const DEFAULT_SETTINGS: Settings = { viewMode: "split", lineNumbers: true, wrap: true, syncScroll: true };

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* unreadable settings — defaults are fine */
  }
  return DEFAULT_SETTINGS;
}

const CODE_LANGUAGES = [
  ["", "Texte brut"],
  ["js", "JavaScript"],
  ["ts", "TypeScript"],
  ["jsx", "JSX"],
  ["tsx", "TSX"],
  ["json", "JSON"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["scss", "SCSS"],
  ["bash", "Bash"],
  ["python", "Python"],
  ["java", "Java"],
  ["kotlin", "Kotlin"],
  ["swift", "Swift"],
  ["go", "Go"],
  ["rust", "Rust"],
  ["c", "C"],
  ["cpp", "C++"],
  ["csharp", "C#"],
  ["php", "PHP"],
  ["ruby", "Ruby"],
  ["sql", "SQL"],
  ["yaml", "YAML"],
  ["xml", "XML"],
  ["diff", "Diff"],
  ["markdown", "Markdown"],
] as const;

const ALERTS = [
  ["note", "Remarque"],
  ["tip", "Astuce"],
  ["important", "Important"],
  ["warning", "Attention"],
  ["caution", "Danger"],
] as const;

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = IS_MAC ? "⌘" : "Ctrl";
const ALT = IS_MAC ? "⌥" : "Alt";

const SHORTCUTS: [string, string][] = [
  [`${MOD} B`, "Gras"],
  [`${MOD} I`, "Italique"],
  [`${MOD} ⇧ X`, "Barré"],
  [`${MOD} E`, "Code en ligne"],
  [`${MOD} K`, "Lien"],
  [`${MOD} ⇧ M`, "Formule en ligne"],
  [`${MOD} ${ALT} 1…6`, "Titre 1 à 6"],
  [`${MOD} ${ALT} 0`, "Paragraphe"],
  [`${MOD} ⇧ 7 / 8 / 9`, "Liste numérotée / à puces / de tâches"],
  [`${MOD} ⇧ .`, "Citation"],
  [`${MOD} F`, "Rechercher / remplacer"],
  [`${MOD} Z / ${MOD} ⇧ Z`, "Annuler / rétablir"],
  [`${MOD} D`, "Sélectionner l'occurrence suivante"],
  [`${ALT} ↑ / ↓`, "Déplacer la ligne"],
  [`${ALT} clic`, "Curseurs multiples"],
  ["Tab / ⇧ Tab", "Indenter / désindenter"],
  [`${MOD} S`, "Enregistrer"],
];

const EXAMPLE = `# Bienvenue dans l'éditeur Markdown

Tout est **enregistré automatiquement** dans votre navigateur. Rien ne quitte l'onglet.

## Mise en forme

Du texte en **gras**, en _italique_, ~~barré~~, du \`code en ligne\` et un [lien](https://commonmark.org).

> Une citation, qui peut contenir **de la mise en forme**.

> [!TIP]
> Les alertes façon GitHub : \`NOTE\`, \`TIP\`, \`IMPORTANT\`, \`WARNING\`, \`CAUTION\`.

## Listes

1. Listes numérotées
2. Avec des sous-listes
   - imbriquées
   - sur plusieurs niveaux

- [x] Cases à cocher, cliquables dans l'aperçu
- [ ] Essayez de cocher celle-ci

## Code

\`\`\`ts
function greet(name: string): string {
  return \`Bonjour, \${name} !\`;
}
\`\`\`

## Tableaux

| Fonction | Raccourci | Statut |
| :--- | :---: | ---: |
| Gras | ${MOD} B | ✅ |
| Lien | ${MOD} K | ✅ |
| Recherche | ${MOD} F | ✅ |

## Maths

La célèbre formule $E = mc^2$, et en bloc :

$$
\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

## Diagrammes

\`\`\`mermaid
flowchart LR
  A[Écrire] --> B{Relire}
  B -->|OK| C[Exporter]
  B -->|À revoir| A
\`\`\`

## Notes de bas de page

Une affirmation qui mérite une source[^1].

[^1]: La note apparaît en bas du document.
`;

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(ts).toLocaleDateString("fr-FR");
}

interface ToolButtonProps {
  icon: MdIconName;
  label: string;
  shortcut?: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToolButton({ icon, label, shortcut, onClick, active, disabled }: ToolButtonProps) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type="button"
      className={"md-tb-btn" + (active ? " active" : "")}
      title={title}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
    >
      <MdIcon name={icon} />
    </button>
  );
}

export function MarkdownTool() {
  const { docs, createDoc, updateDoc, removeDoc } = useMarkdownDocs();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [fullscreen, setFullscreen] = useState(false);
  const [content, setContent] = useState("");
  const [cursor, setCursor] = useState<CursorInfo>({ line: 1, col: 1, selected: 0, selections: 1 });
  const [headingLevel, setHeadingLevel] = useState(0);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [docQuery, setDocQuery] = useState("");
  const [themeKey, setThemeKey] = useState(0);

  const viewRef = useRef<EditorView | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const pendingContent = useRef<{ id: string; content: string } | null>(null);
  // Whichever pane the user is on drives the other one; this is also what prevents feedback loops.
  const scrollSource = useRef<"editor" | "preview">("editor");

  // One-time bootstrap: create the first document (pre-filled with the example)
  // if none exist yet. Guarded by a ref, not just `docs.length === 0` — React's
  // StrictMode dev double-invoke would otherwise run this twice against the same
  // stale (empty) closure and create two documents before either commit lands.
  const didBootstrap = useRef(false);
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    if (docs.length === 0) createDoc("Guide Markdown", EXAMPLE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (docs.length > 0 && (!activeId || !docs.some((d) => d.id === activeId))) {
      setActiveId([...docs].sort((a, b) => b.updatedAt - a.updatedAt)[0].id);
    }
  }, [docs, activeId]);

  const activeDoc = docs.find((d) => d.id === activeId);

  // The editor owns the live text; the store is written on a short debounce.
  const flushSave = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    const p = pendingContent.current;
    if (p) {
      updateDoc(p.id, { content: p.content });
      pendingContent.current = null;
    }
    setPending(false);
  }, [updateDoc]);

  useEffect(() => {
    window.addEventListener("beforeunload", flushSave);
    return () => {
      window.removeEventListener("beforeunload", flushSave);
      flushSave();
    };
  }, [flushSave]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* not persisted — settings still apply this session */
    }
  }, [settings]);

  // Load the new document's text when switching (the editor itself swaps state via docId).
  // State, not a ref: StrictMode's double render would otherwise drop the update.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (activeDoc && loadedId !== activeDoc.id) {
    setLoadedId(activeDoc.id);
    setContent(activeDoc.content);
  }
  const loadedIdRef = useRef(loadedId);
  loadedIdRef.current = loadedId;

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Mermaid picks its palette from the page background, so re-render the preview on theme change.
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeKey((k) => k + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !document.querySelector(".md-editor .cm-search") && !document.querySelector(".md-popover")) setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const deferred = useDeferredValue(content);
  const rendered = useMemo(() => renderMarkdown(deferred), [deferred]);
  const words = useMemo(() => countWords(deferred), [deferred]);
  const lines = useMemo(() => deferred.split("\n").length, [deferred]);

  const showEditor = settings.viewMode !== "preview";
  const showPreview = settings.viewMode !== "edit";

  // After each render of the preview: tag blocks with their source line for scroll sync,
  // make task checkboxes clickable, and draw mermaid diagrams.
  useLayoutEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    const blocks = Array.from(root.children).filter((el) => !el.classList.contains("footnotes"));
    blocks.forEach((el, i) => {
      const line = rendered.blockLines[i];
      if (line !== undefined) (el as HTMLElement).dataset.line = String(line);
    });
    root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((box, i) => {
      box.disabled = false;
      box.dataset.task = String(i);
    });
    void renderMermaid(root);
  }, [rendered, themeKey]);

  function run(cmd: EditorCommand) {
    const view = viewRef.current;
    if (view) cmd(view);
  }

  const handleChange = useCallback(
    (next: string) => {
      setContent(next);
      if (!loadedIdRef.current) return;
      pendingContent.current = { id: loadedIdRef.current, content: next };
      setPending(true);
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(flushSave, SAVE_DELAY);
    },
    [flushSave],
  );

  const handleCursor = useCallback((info: CursorInfo) => {
    setCursor(info);
    if (viewRef.current) setHeadingLevel(headingLevelAt(viewRef.current));
  }, []);

  function switchDoc(id: string) {
    flushSave();
    setActiveId(id);
  }

  function openFile(file: File) {
    file.text().then((text) => {
      flushSave();
      const title = file.name.replace(/\.(md|markdown|txt)$/i, "") || "Sans titre";
      setActiveId(createDoc(title, text));
      setNotice(`« ${file.name} » importé.`);
    });
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    files.forEach(openFile);
  }

  function handleNew(template = "") {
    flushSave();
    setActiveId(createDoc(template ? "Guide Markdown" : "Sans titre", template));
  }

  function handleDuplicate() {
    if (!activeDoc) return;
    flushSave();
    setActiveId(createDoc(`${activeDoc.title || "Sans titre"} (copie)`, viewRef.current?.state.doc.toString() ?? activeDoc.content));
  }

  function handleDelete() {
    if (!activeDoc || docs.length <= 1) return;
    if (!window.confirm(`Supprimer « ${activeDoc.title || "Sans titre"} » ? Cette action est définitive.`)) return;
    pendingContent.current = null;
    removeDoc(activeDoc.id);
  }

  function handleSave() {
    flushSave();
    setNotice("Enregistré dans le navigateur.");
  }

  function currentHtml(): string {
    // Prefer the live preview DOM (it already has rendered diagrams); fall back to a fresh render.
    return previewRef.current?.innerHTML ?? renderMarkdown(content).html;
  }

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(message);
    } catch {
      setNotice("Le presse-papiers n'est pas accessible.");
    }
  }

  const title = activeDoc?.title || "Sans titre";
  const exportActions: { icon: MdIconName; label: string; run: () => void }[] = [
    { icon: "download", label: "Markdown (.md)", run: () => downloadFile(content, `${safeFilename(title)}.md`, "text/markdown;charset=utf-8") },
    {
      icon: "file",
      label: "Page HTML (.html)",
      run: () => downloadFile(buildStandaloneHtml(title, currentHtml()), `${safeFilename(title)}.html`, "text/html;charset=utf-8"),
    },
    { icon: "print", label: "PDF / imprimer", run: () => printHtml(buildStandaloneHtml(title, currentHtml())) },
    { icon: "copy", label: "Copier le Markdown", run: () => void copyText(content, "Markdown copié.") },
    { icon: "copy", label: "Copier le HTML", run: () => void copyText(currentHtml(), "HTML copié.") },
  ];

  // ---------- scroll sync ----------
  function blockOffsets(): { line: number; top: number }[] {
    const root = previewRef.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-line]")).map((el) => ({ line: Number(el.dataset.line), top: el.offsetTop }));
  }

  const syncPreviewFromEditor = useCallback(() => {
    const view = viewRef.current;
    const preview = previewRef.current?.parentElement;
    if (!view || !preview || !settings.syncScroll || settings.viewMode !== "split") return;
    if (scrollSource.current === "preview") return;
    const scroller = view.scrollDOM;
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
      preview.scrollTop = preview.scrollHeight;
      return;
    }
    // Block heights are measured from the top of the document, below the content padding.
    const y = scroller.scrollTop - view.documentPadding.top;
    const block = view.lineBlockAtHeight(y);
    const lineNo = view.state.doc.lineAt(block.from).number - 1;
    const within = block.height ? (y - block.top) / block.height : 0;
    const exact = lineNo + Math.max(0, Math.min(1, within));
    const offsets = blockOffsets();
    if (!offsets.length) return;
    let i = offsets.findIndex((o) => o.line > exact) - 1;
    if (i === -2) i = offsets.length - 1;
    let target: number;
    if (i < 0) target = (offsets[0].top * exact) / Math.max(1, offsets[0].line);
    else {
      const a = offsets[i];
      const b = offsets[i + 1] ?? { line: view.state.doc.lines, top: preview.scrollHeight };
      const frac = b.line === a.line ? 0 : (exact - a.line) / (b.line - a.line);
      target = a.top + (b.top - a.top) * frac;
    }
    preview.scrollTop = target - 12;
  }, [settings.syncScroll, settings.viewMode]);

  function syncEditorFromPreview() {
    const view = viewRef.current;
    const preview = previewRef.current?.parentElement;
    if (!view || !preview || !settings.syncScroll || settings.viewMode !== "split") return;
    if (scrollSource.current !== "preview") return;
    const scroller = view.scrollDOM;
    if (preview.scrollTop + preview.clientHeight >= preview.scrollHeight - 4) {
      scroller.scrollTop = scroller.scrollHeight;
      return;
    }
    const offsets = blockOffsets();
    if (!offsets.length) return;
    const y = preview.scrollTop + 12;
    let i = offsets.findIndex((o) => o.top > y) - 1;
    if (i === -2) i = offsets.length - 1;
    let line: number;
    if (i < 0) line = 0;
    else {
      const a = offsets[i];
      const b = offsets[i + 1] ?? { line: view.state.doc.lines, top: preview.scrollHeight };
      const frac = b.top === a.top ? 0 : (y - a.top) / (b.top - a.top);
      line = a.line + (b.line - a.line) * frac;
    }
    const n = Math.min(view.state.doc.lines, Math.floor(line) + 1);
    const block = view.lineBlockAt(view.state.doc.line(n).from);
    scroller.scrollTop = view.documentPadding.top + block.top + block.height * (line - Math.floor(line));
  }

  function goToHeading(id: string, line: number) {
    const view = viewRef.current;
    if (view && showEditor) {
      const pos = view.state.doc.line(Math.min(view.state.doc.lines, line + 1)).from;
      scrollSource.current = "editor";
      view.dispatch({ selection: EditorSelection.cursor(pos), effects: [] });
      view.scrollDOM.scrollTop = view.lineBlockAt(pos).top;
      view.focus();
    }
    const target = previewRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    const preview = previewRef.current?.parentElement;
    if (target && preview && (!showEditor || !settings.syncScroll)) preview.scrollTop = target.offsetTop - 12;
  }

  function handlePreviewClick(e: MouseEvent<HTMLDivElement>) {
    const el = e.target as HTMLElement;
    if (el instanceof HTMLInputElement && el.type === "checkbox" && el.dataset.task) {
      e.preventDefault();
      const view = viewRef.current;
      if (view) toggleTaskAt(view, Number(el.dataset.task));
      return;
    }
    const link = el.closest("a");
    const href = link?.getAttribute("href");
    if (link && href?.startsWith("#")) {
      e.preventDefault();
      const target = previewRef.current?.querySelector<HTMLElement>(`#${CSS.escape(decodeURIComponent(href.slice(1)))}`);
      const preview = previewRef.current?.parentElement;
      if (target && preview) {
        scrollSource.current = "preview";
        preview.scrollTo({ top: target.offsetTop - 12, behavior: "smooth" });
      }
    }
  }

  const sortedDocs = useMemo(() => {
    const q = docQuery.trim().toLowerCase();
    return [...docs]
      .filter((d) => !q || d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [docs, docQuery]);

  if (!activeDoc) return null;

  const readingMinutes = Math.max(1, Math.round(words / 220));

  return (
    <div className={"md-editor" + (fullscreen ? " is-fullscreen" : "")}>
      <div className="md-header">
        <Popover
          className="md-docs-popover"
          trigger={({ open, toggle }) => (
            <button type="button" className="btn md-docs-trigger" onClick={toggle} aria-expanded={open} title="Mes documents">
              <MdIcon name="file" />
              <span>Documents ({docs.length})</span>
              <MdIcon name="chevron" />
            </button>
          )}
        >
          {(close) => (
            <>
              <input className="input mb-sm" value={docQuery} onChange={(e) => setDocQuery(e.target.value)} placeholder="Rechercher un document…" autoFocus />
              <div className="md-doc-list">
                {sortedDocs.map((d: MarkdownDoc) => (
                  <button
                    key={d.id}
                    type="button"
                    className={"md-doc-item" + (d.id === activeDoc.id ? " active" : "")}
                    onClick={() => {
                      switchDoc(d.id);
                      close();
                    }}
                  >
                    <span className="md-doc-title">{d.title || "Sans titre"}</span>
                    <span className="md-doc-meta">
                      {relativeTime(d.updatedAt)} · {countWords(d.content)} mots
                    </span>
                  </button>
                ))}
                {sortedDocs.length === 0 && <p className="md-popover-hint">Aucun document ne correspond.</p>}
              </div>
              <div className="md-popover-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    handleNew();
                    close();
                  }}
                >
                  <MdIcon name="plus" /> Nouveau
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    handleNew(EXAMPLE);
                    close();
                  }}
                >
                  <MdIcon name="help" /> Guide d'exemple
                </button>
              </div>
            </>
          )}
        </Popover>

        <input
          className="md-title-input"
          value={activeDoc.title}
          onChange={(e) => updateDoc(activeDoc.id, { title: e.target.value })}
          placeholder="Sans titre"
          aria-label="Titre du document"
        />
        <span className={"md-save-state" + (pending ? " pending" : "")} aria-live="polite">
          {pending ? "Modification…" : `Enregistré ${relativeTime(activeDoc.updatedAt)}`}
        </span>

        <div className="md-header-actions">
          <button type="button" className="btn" onClick={() => handleNew()} title="Nouveau document">
            <MdIcon name="plus" /> Nouveau
          </button>
          <button type="button" className="btn" onClick={() => fileInputRef.current?.click()} title="Importer des fichiers .md">
            <MdIcon name="upload" /> Importer
          </button>
          <input ref={fileInputRef} type="file" multiple accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={handleFiles} hidden />
          <Popover
            align="end"
            trigger={({ open, toggle }) => (
              <button type="button" className="btn" onClick={toggle} aria-expanded={open}>
                <MdIcon name="download" /> Exporter <MdIcon name="chevron" />
              </button>
            )}
          >
            {(close) => (
              <div className="md-menu">
                {exportActions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    className="md-menu-item"
                    onClick={() => {
                      a.run();
                      close();
                    }}
                  >
                    <MdIcon name={a.icon} /> {a.label}
                  </button>
                ))}
              </div>
            )}
          </Popover>
          <ToolButton icon="duplicate" label="Dupliquer le document" onClick={handleDuplicate} />
          <ToolButton icon="trash" label="Supprimer le document" onClick={handleDelete} disabled={docs.length <= 1} />
        </div>
      </div>

      <div className="md-toolbar" role="toolbar" aria-label="Mise en forme">
        {showEditor && (
          <>
            <div className="md-tb-group">
              <ToolButton icon="undo" label="Annuler" shortcut={`${MOD} Z`} onClick={() => run(undo)} />
              <ToolButton icon="redo" label="Rétablir" shortcut={`${MOD} ⇧ Z`} onClick={() => run(redo)} />
            </div>
            <div className="md-tb-group">
              <select
                className="md-select"
                value={headingLevel}
                onChange={(e) => run(setHeading(Number(e.target.value)))}
                aria-label="Style de paragraphe"
              >
                <option value={0}>Paragraphe</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    Titre {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="md-tb-group">
              <ToolButton icon="bold" label="Gras" shortcut={`${MOD} B`} onClick={() => run(toggleWrap("**", "texte en gras"))} />
              <ToolButton icon="italic" label="Italique" shortcut={`${MOD} I`} onClick={() => run(toggleWrap("_", "texte en italique"))} />
              <ToolButton icon="strike" label="Barré" shortcut={`${MOD} ⇧ X`} onClick={() => run(toggleWrap("~~", "texte barré"))} />
              <ToolButton icon="code" label="Code en ligne" shortcut={`${MOD} E`} onClick={() => run(toggleWrap("`", "code"))} />
            </div>
            <div className="md-tb-group">
              <ToolButton icon="link" label="Lien" shortcut={`${MOD} K`} onClick={() => run(insertLink)} />
              <ToolButton icon="image" label="Image (ou collez / déposez un fichier)" onClick={() => run(insertImage)} />
            </div>
            <div className="md-tb-group">
              <ToolButton icon="ul" label="Liste à puces" shortcut={`${MOD} ⇧ 8`} onClick={() => run(toggleLinePrefix(() => "- ", /^\s*[-*+]\s(?!\[)/))} />
              <ToolButton icon="ol" label="Liste numérotée" shortcut={`${MOD} ⇧ 7`} onClick={() => run(toggleLinePrefix((i) => `${i + 1}. `, /^\s*\d+[.)]\s/))} />
              <ToolButton icon="task" label="Liste de tâches" shortcut={`${MOD} ⇧ 9`} onClick={() => run(toggleLinePrefix(() => "- [ ] ", /^\s*[-*+]\s\[[ xX]\]\s/))} />
            </div>
            <div className="md-tb-group">
              <ToolButton icon="quote" label="Citation" shortcut={`${MOD} ⇧ .`} onClick={() => run(toggleLinePrefix(() => "> ", /^\s*>/))} />
              <Popover
                trigger={({ open, toggle }) => <ToolButton icon="codeblock" label="Bloc de code" onClick={toggle} active={open} />}
                className="md-lang-popover"
              >
                {(close) => (
                  <div className="md-menu md-menu-grid">
                    {CODE_LANGUAGES.map(([id, name]) => (
                      <button
                        key={id}
                        type="button"
                        className="md-menu-item"
                        onClick={() => {
                          close();
                          run(insertCodeBlock(id));
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </Popover>
              <Popover trigger={({ open, toggle }) => <ToolButton icon="table" label="Tableau" onClick={toggle} active={open} />}>
                {(close) => (
                  <TablePicker
                    onPick={(r, c) => {
                      close();
                      run(insertTable(r, c));
                    }}
                  />
                )}
              </Popover>
              <ToolButton icon="hr" label="Ligne horizontale" onClick={() => run(insertBlock("---\n"))} />
            </div>
            <div className="md-tb-group">
              <ToolButton icon="footnote" label="Note de bas de page" onClick={() => run(insertFootnote)} />
              <Popover trigger={({ open, toggle }) => <ToolButton icon="math" label="Formule mathématique (LaTeX)" onClick={toggle} active={open} />}>
                {(close) => (
                  <div className="md-menu">
                    <button
                      type="button"
                      className="md-menu-item"
                      onClick={() => {
                        close();
                        run(insertInline(INLINE_MATH_TEMPLATE, "x^2"));
                      }}
                    >
                      Formule en ligne <kbd>$…$</kbd>
                    </button>
                    <button
                      type="button"
                      className="md-menu-item"
                      onClick={() => {
                        close();
                        run(insertBlock(MATH_BLOCK_TEMPLATE));
                      }}
                    >
                      Formule en bloc <kbd>$$…$$</kbd>
                    </button>
                  </div>
                )}
              </Popover>
              <ToolButton icon="diagram" label="Diagramme Mermaid" onClick={() => run(insertBlock(MERMAID_TEMPLATE))} />
              <Popover trigger={({ open, toggle }) => <ToolButton icon="alert" label="Alerte" onClick={toggle} active={open} />}>
                {(close) => (
                  <div className="md-menu">
                    {ALERTS.map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        className={`md-menu-item md-alert-item md-alert-${type}`}
                        onClick={() => {
                          close();
                          run(insertAlert(type));
                        }}
                      >
                        <span className="md-alert-dot" /> {label}
                      </button>
                    ))}
                  </div>
                )}
              </Popover>
            </div>
            <div className="md-tb-group">
              <ToolButton icon="search" label="Rechercher et remplacer" shortcut={`${MOD} F`} onClick={() => run(openSearchPanel)} />
            </div>
          </>
        )}

        <div className="md-tb-spacer" />

        <Popover
          align="end"
          trigger={({ open, toggle }) => <ToolButton icon="toc" label="Plan du document" onClick={toggle} active={open} disabled={!rendered.headings.length} />}
          className="md-toc-popover"
        >
          {(close) => (
            <nav className="md-toc" aria-label="Plan du document">
              {rendered.headings.map((h, i) => (
                <button
                  key={`${h.id}-${i}`}
                  type="button"
                  className="md-toc-item"
                  style={{ paddingInlineStart: `${0.5 + (h.level - 1) * 0.85}rem` }}
                  onClick={() => {
                    close();
                    goToHeading(h.id, h.line);
                  }}
                >
                  {h.text}
                </button>
              ))}
            </nav>
          )}
        </Popover>

        <SegmentedControl<ViewMode>
          value={settings.viewMode}
          onChange={(viewMode) => setSettings((s) => ({ ...s, viewMode }))}
          options={[
            { value: "edit", label: "Éditeur" },
            { value: "split", label: "Divisé" },
            { value: "preview", label: "Aperçu" },
          ]}
        />

        <Popover align="end" trigger={({ open, toggle }) => <ToolButton icon="help" label="Options et raccourcis" onClick={toggle} active={open} />} className="md-help-popover">
          {() => (
            <div>
              <div className="md-options">
                <label className="check-row">
                  <input type="checkbox" checked={settings.lineNumbers} onChange={(e) => setSettings((s) => ({ ...s, lineNumbers: e.target.checked }))} />
                  Numéros de ligne
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={settings.wrap} onChange={(e) => setSettings((s) => ({ ...s, wrap: e.target.checked }))} />
                  Retour à la ligne automatique
                </label>
                <label className="check-row">
                  <input type="checkbox" checked={settings.syncScroll} onChange={(e) => setSettings((s) => ({ ...s, syncScroll: e.target.checked }))} />
                  Défilement synchronisé
                </label>
              </div>
              <div className="md-shortcuts">
                {SHORTCUTS.map(([keys, label]) => (
                  <div className="md-shortcut" key={label}>
                    <span>{label}</span>
                    <kbd>{keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Popover>

        <ToolButton icon={fullscreen ? "collapse" : "expand"} label={fullscreen ? "Quitter le mode focus (Échap)" : "Mode focus"} onClick={() => setFullscreen((f) => !f)} active={fullscreen} />
      </div>

      <div className={`md-workspace mode-${settings.viewMode}`}>
        {/* Both panes stay mounted and are hidden with CSS, so switching modes keeps undo history, cursor and diagrams. */}
        <div
          className="md-pane md-pane-editor"
          hidden={!showEditor}
          onPointerEnter={() => (scrollSource.current = "editor")}
          onFocus={() => (scrollSource.current = "editor")}
          onKeyDown={() => (scrollSource.current = "editor")}
        >
          <Editor
            docId={activeDoc.id}
            initialContent={content}
            settings={settings}
            onReady={(v) => (viewRef.current = v)}
            onChange={handleChange}
            onCursor={handleCursor}
            onScroll={syncPreviewFromEditor}
            onSave={handleSave}
            onOpenFile={openFile}
            onNotice={setNotice}
          />
        </div>
        <div
          className="md-pane md-pane-preview"
          hidden={!showPreview}
          onPointerEnter={() => (scrollSource.current = "preview")}
          onScroll={syncEditorFromPreview}
        >
          <div
            key={themeKey}
            ref={previewRef}
            className="md-preview"
            onClick={handlePreviewClick}
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
          {!content.trim() && <p className="md-preview-empty">L'aperçu apparaîtra ici.</p>}
        </div>
      </div>

      <div className="md-statusbar">
        {showEditor && (
          <span>
            Ligne {cursor.line}, col. {cursor.col}
            {cursor.selected > 0 && ` · ${cursor.selected} sélectionné${cursor.selected > 1 ? "s" : ""}`}
            {cursor.selections > 1 && ` · ${cursor.selections} curseurs`}
          </span>
        )}
        <span>{words.toLocaleString("fr-FR")} mots</span>
        <span>{content.length.toLocaleString("fr-FR")} caractères</span>
        <span>{lines.toLocaleString("fr-FR")} lignes</span>
        <span>~{readingMinutes} min de lecture</span>
        <span className="md-statusbar-end">Markdown GFM</span>
      </div>

      {notice && (
        <div className="md-toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
