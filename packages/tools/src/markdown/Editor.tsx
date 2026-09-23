import { useEffect, useRef } from "react";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder,
  rectangularSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { tags as t } from "@lezer/highlight";
import {
  INLINE_MATH_TEMPLATE,
  insertInline,
  insertLink,
  setHeading,
  toggleLinePrefix,
  toggleWrap,
} from "./commands";

export interface CursorInfo {
  line: number;
  col: number;
  selected: number;
  selections: number;
}

export interface EditorSettings {
  lineNumbers: boolean;
  wrap: boolean;
}

interface EditorProps {
  docId: string;
  initialContent: string;
  settings: EditorSettings;
  onReady: (view: EditorView) => void;
  onChange: (content: string) => void;
  onCursor: (info: CursorInfo) => void;
  onScroll: () => void;
  onSave: () => void;
  onOpenFile: (file: File) => void;
  onNotice: (message: string) => void;
}

const MAX_IMAGE_BYTES = 1024 * 1024;

const PHRASES = {
  Find: "Rechercher",
  Replace: "Remplacer",
  next: "suivant",
  previous: "précédent",
  all: "tout",
  "match case": "respecter la casse",
  regexp: "expression régulière",
  "by word": "mot entier",
  replace: "remplacer",
  "replace all": "tout remplacer",
  close: "fermer",
  "current match": "occurrence actuelle",
  "on line": "à la ligne",
  "Go to line": "Aller à la ligne",
  go: "aller",
  "replaced $ matches": "$ occurrences remplacées",
  "replaced match on line $": "occurrence remplacée à la ligne $",
};

const theme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "0.9rem",
    color: "var(--text)",
    backgroundColor: "var(--surface-2)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.65",
  },
  ".cm-content": { padding: "0.9rem 0", caretColor: "var(--accent)" },
  ".cm-line": { padding: "0 1rem" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--accent-soft) !important",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--surface-3) 45%, transparent)" },
  ".cm-gutters": {
    backgroundColor: "var(--surface-2)",
    color: "var(--text-tertiary)",
    border: "none",
    borderInlineEnd: "1px solid var(--border)",
  },
  ".cm-activeLineGutter": { backgroundColor: "var(--surface-3)", color: "var(--text-secondary)" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 0.6rem 0 0.9rem", fontSize: "0.78rem" },
  ".cm-placeholder": { color: "var(--text-tertiary)" },
  ".cm-searchMatch": { backgroundColor: "color-mix(in srgb, var(--accent) 22%, transparent)", outline: "1px solid color-mix(in srgb, var(--accent) 50%, transparent)" },
  ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "color-mix(in srgb, var(--accent) 45%, transparent)" },
  ".cm-selectionMatch": { backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)" },
  ".cm-matchingBracket": { backgroundColor: "var(--accent-soft)", outline: "1px solid var(--accent)" },
  ".cm-panels": { backgroundColor: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" },
  ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--border)" },
  ".cm-panel.cm-search": { padding: "0.55rem 0.75rem", fontFamily: "var(--font-body)", fontSize: "0.8rem" },
  ".cm-panel.cm-search input, .cm-panel.cm-search button, .cm-panel.cm-search label": { fontSize: "0.8rem" },
  ".cm-textfield": {
    backgroundColor: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "0.25rem 0.5rem",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
  },
  ".cm-button": {
    backgroundImage: "none",
    backgroundColor: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text-secondary)",
    padding: "0.25rem 0.6rem",
  },
  ".cm-button:hover": { color: "var(--text)", borderColor: "var(--border-strong)" },
  ".cm-panel.cm-search [name=close]": { color: "var(--text-tertiary)", fontSize: "1.1rem" },
  ".cm-panel.cm-search label input": { accentColor: "var(--accent)" },
});

const highlight = HighlightStyle.define([
  { tag: t.heading1, fontWeight: "700", fontSize: "1.3em", color: "var(--text)" },
  { tag: t.heading2, fontWeight: "700", fontSize: "1.18em", color: "var(--text)" },
  { tag: t.heading3, fontWeight: "700", fontSize: "1.08em", color: "var(--text)" },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: "700", color: "var(--text)" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "var(--text-tertiary)" },
  { tag: t.link, color: "var(--accent)", textDecoration: "underline" },
  { tag: t.url, color: "var(--text-tertiary)" },
  { tag: t.monospace, color: "var(--danger)" },
  { tag: t.quote, color: "var(--text-secondary)", fontStyle: "italic" },
  { tag: [t.processingInstruction, t.contentSeparator], color: "var(--text-tertiary)" },
  { tag: t.list, color: "var(--accent)" },
  { tag: t.meta, color: "var(--text-tertiary)" },
  // Fenced code, via the embedded languages
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "#a855f7" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--success)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "#e0892f" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--text-tertiary)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#3b82f6" },
  { tag: [t.typeName, t.className, t.tagName], color: "#0ea5b7" },
  { tag: [t.propertyName, t.attributeName], color: "#d946ef" },
]);

const formatKeymap = keymap.of([
  { key: "Mod-b", run: toggleWrap("**", "texte en gras") },
  { key: "Mod-i", run: toggleWrap("_", "texte en italique") },
  { key: "Mod-Shift-x", run: toggleWrap("~~", "texte barré") },
  { key: "Mod-e", run: toggleWrap("`", "code") },
  { key: "Mod-k", run: insertLink },
  { key: "Mod-Shift-m", run: insertInline(INLINE_MATH_TEMPLATE, "x^2") },
  { key: "Mod-Alt-0", run: setHeading(0) },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ key: `Mod-Alt-${n}`, run: setHeading(n) })),
  { key: "Mod-Shift-7", run: toggleLinePrefix((i) => `${i + 1}. `, /^\s*\d+[.)]\s/) },
  { key: "Mod-Shift-8", run: toggleLinePrefix(() => "- ", /^\s*[-*+]\s(?!\[)/) },
  { key: "Mod-Shift-9", run: toggleLinePrefix(() => "- [ ] ", /^\s*[-*+]\s\[[ xX]\]\s/) },
  { key: "Mod-Shift-.", run: toggleLinePrefix(() => "> ", /^\s*>/) },
]);

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function Editor({ docId, initialContent, settings, onReady, onChange, onCursor, onScroll, onSave, onOpenFile, onNotice }: EditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const statesRef = useRef(new Map<string, EditorState>());
  const currentDocRef = useRef(docId);
  const compartments = useRef({ lineNumbers: new Compartment(), wrap: new Compartment() });
  // Handlers change every render; the extensions are built once, so they read through a ref.
  const handlers = useRef({ onChange, onCursor, onScroll, onSave, onOpenFile, onNotice });
  handlers.current = { onChange, onCursor, onScroll, onSave, onOpenFile, onNotice };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  function settingsExtensions(s: EditorSettings) {
    return [
      compartments.current.lineNumbers.of(s.lineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : []),
      compartments.current.wrap.of(s.wrap ? EditorView.lineWrapping : []),
    ];
  }

  function reportCursor(state: EditorState) {
    const main = state.selection.main;
    const line = state.doc.lineAt(main.head);
    handlers.current.onCursor({
      line: line.number,
      col: main.head - line.from + 1,
      selected: state.selection.ranges.reduce((n, r) => n + (r.to - r.from), 0),
      selections: state.selection.ranges.length,
    });
  }

  async function insertImageFile(view: EditorView, file: File, pos: number) {
    if (file.size > MAX_IMAGE_BYTES) {
      handlers.current.onNotice(`Image trop lourde (${Math.round(file.size / 1024)} Ko, max 1 Mo) : elle est stockée dans le navigateur avec le document.`);
      return;
    }
    const url = await readAsDataUrl(file);
    const alt = file.name.replace(/\.[^.]+$/, "") || "image";
    const text = `![${alt}](${url})`;
    view.dispatch({ changes: { from: pos, insert: text }, selection: { anchor: pos + text.length }, userEvent: "input.paste" });
  }

  function createState(content: string): EditorState {
    const extensions: Extension[] = [
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      search({ top: true }),
      markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: true }),
      syntaxHighlighting(highlight),
      theme,
      EditorState.phrases.of(PHRASES),
      placeholder("Écrivez en Markdown…"),
      formatKeymap,
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            handlers.current.onSave();
            return true;
          },
        },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),
      ...settingsExtensions(settingsRef.current),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) handlers.current.onChange(u.state.doc.toString());
        if (u.docChanged || u.selectionSet) reportCursor(u.state);
      }),
      EditorView.domEventHandlers({
        paste(event, view) {
          const image = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
          if (!image) return false;
          event.preventDefault();
          void insertImageFile(view, image, view.state.selection.main.head);
          return true;
        },
        drop(event, view) {
          const files = Array.from(event.dataTransfer?.files ?? []);
          if (!files.length) return false;
          event.preventDefault();
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? view.state.selection.main.head;
          for (const file of files) {
            if (file.type.startsWith("image/")) void insertImageFile(view, file, pos);
            else if (/\.(md|markdown|txt)$/i.test(file.name) || file.type.startsWith("text/")) handlers.current.onOpenFile(file);
          }
          return true;
        },
      }),
    ];
    return EditorState.create({ doc: content, extensions });
  }

  useEffect(() => {
    const view = new EditorView({ state: createState(initialContent), parent: hostRef.current! });
    viewRef.current = view;
    const scroller = view.scrollDOM;
    const handleScroll = () => handlers.current.onScroll();
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    onReady(view);
    reportCursor(view.state);
    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switching documents swaps the whole EditorState, so each document keeps its own undo history.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || currentDocRef.current === docId) return;
    statesRef.current.set(currentDocRef.current, view.state);
    currentDocRef.current = docId;
    const cached = statesRef.current.get(docId);
    const next = cached && cached.doc.toString() === initialContent ? cached : createState(initialContent);
    view.setState(next);
    view.dispatch({
      effects: [
        compartments.current.lineNumbers.reconfigure(settings.lineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : []),
        compartments.current.wrap.reconfigure(settings.wrap ? EditorView.lineWrapping : []),
      ],
    });
    reportCursor(view.state);
    view.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: [
        compartments.current.lineNumbers.reconfigure(settings.lineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : []),
        compartments.current.wrap.reconfigure(settings.wrap ? EditorView.lineWrapping : []),
      ],
    });
  }, [settings.lineNumbers, settings.wrap]);

  return <div ref={hostRef} className="md-cm-host" />;
}
