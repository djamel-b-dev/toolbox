import { Marked, type Token, type Tokens } from "marked";
import markedFootnote from "marked-footnote";
import markedAlert from "marked-alert";
import markedKatex from "marked-katex-extension";
import { markedHighlight } from "marked-highlight";
import { gfmHeadingId, getHeadingList, resetHeadings } from "marked-gfm-heading-id";
import hljs from "highlight.js/lib/common";
import DOMPurify from "dompurify";
import "katex/dist/katex.min.css";

export interface Heading {
  id: string;
  level: number;
  text: string;
  line: number;
}

export interface RenderResult {
  html: string;
  headings: Heading[];
  /** Source line (0-based) of each top-level block, in document order. */
  blockLines: number[];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const alertIcon = (path: string) =>
  `<svg class="md-alert-icon" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

const ALERT_VARIANTS = [
  { type: "note", title: "Remarque", icon: alertIcon('<circle cx="10" cy="10" r="7.5"/><line x1="10" y1="9" x2="10" y2="14"/><circle cx="10" cy="6.2" r=".6" fill="currentColor"/>') },
  { type: "tip", title: "Astuce", icon: alertIcon('<path d="M7 14h6M8 17h4M10 2.5a5 5 0 0 0-3 9c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a5 5 0 0 0-3-9Z"/>') },
  { type: "important", title: "Important", icon: alertIcon('<path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3h-.5A1.5 1.5 0 0 1 3 12.5Z"/><line x1="10" y1="6" x2="10" y2="9"/><circle cx="10" cy="11.3" r=".6" fill="currentColor"/>') },
  { type: "warning", title: "Attention", icon: alertIcon('<path d="M10 3 2.5 16.5h15Z"/><line x1="10" y1="8" x2="10" y2="11.5"/><circle cx="10" cy="14" r=".6" fill="currentColor"/>') },
  { type: "caution", title: "Danger", icon: alertIcon('<path d="M7 2.5h6L17.5 7v6L13 17.5H7L2.5 13V7Z"/><line x1="10" y1="6.5" x2="10" y2="10.5"/><circle cx="10" cy="13.3" r=".6" fill="currentColor"/>') },
];

const marked = new Marked(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (lang === "mermaid") return escapeHtml(code);
      if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      return escapeHtml(code);
    },
  }),
  { gfm: true, breaks: false },
  gfmHeadingId(),
  markedFootnote({ description: "Notes", backRefLabel: "Revenir à la référence {0}" }),
  markedAlert({ variants: ALERT_VARIANTS }),
  markedKatex({ throwOnError: false }),
  {
    renderer: {
      // Mermaid blocks are rendered client-side after sanitising, from the text content.
      code(token: Tokens.Code) {
        // marked-highlight has already escaped the text (and flagged it) by the time this runs.
        if (token.lang === "mermaid") return `<pre class="md-mermaid">${token.escaped ? token.text : escapeHtml(token.text)}</pre>\n`;
        return false;
      },
      link(token: Tokens.Link) {
        const html = this.parser.parseInline(token.tokens);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        if (token.href.startsWith("#")) return `<a href="${escapeHtml(token.href)}"${title}>${html}</a>`;
        return `<a href="${escapeHtml(token.href)}"${title} target="_blank" rel="noopener noreferrer">${html}</a>`;
      },
    },
  },
);

const entityDecoder = typeof document !== "undefined" ? document.createElement("textarea") : null;

function decodeEntities(s: string): string {
  if (!entityDecoder) return s;
  entityDecoder.innerHTML = s;
  return entityDecoder.value;
}

// Tokens that produce no top-level element in the output.
const INVISIBLE = new Set(["space", "def", "footnote", "footnotes"]);

function countLines(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  return n;
}

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") node.setAttribute("rel", "noopener noreferrer");
});

export function renderMarkdown(md: string): RenderResult {
  resetHeadings();
  // Same pipeline as marked.parse(), unrolled so the tokens are available for line mapping.
  // Extensions depend on these steps: marked-alert rewrites blockquotes and marked-footnote
  // resets its state in walkTokens, so a bare marked.lexer() call is not enough.
  const opts = marked.defaults;
  const hooks = opts.hooks;
  if (hooks) {
    hooks.options = opts;
    hooks.block = true;
  }
  let tokens = marked.lexer(hooks ? hooks.preprocess(md) : md);
  if (hooks) tokens = hooks.processAllTokens(tokens) as typeof tokens;
  if (opts.walkTokens) marked.walkTokens(tokens, opts.walkTokens);

  const blockLines: number[] = [];
  const tokenLine = new Map<Token, number>();
  let line = 0;
  for (const t of tokens) {
    if (!INVISIBLE.has(t.type)) {
      // Leading blank lines are part of the raw text of some tokens; skip past them.
      const lead = t.raw.match(/^\n*/)?.[0].length ?? 0;
      blockLines.push(line + lead);
      tokenLine.set(t, line + lead);
    }
    line += countLines(t.raw);
  }

  const parsed = marked.parser(tokens);
  const raw = hooks ? (hooks.postprocess(parsed) as string) : parsed;
  const html = DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true, svg: true, mathMl: true },
    ADD_ATTR: ["target"],
  });

  const headingTokens = tokens.filter((t): t is Tokens.Heading => t.type === "heading");
  const headings = getHeadingList().map((h, i) => ({
    id: h.id,
    level: h.level,
    text: decodeEntities(h.text.replace(/<[^>]+>/g, "")),
    line: headingTokens[i] ? (tokenLine.get(headingTokens[i]) ?? 0) : 0,
  }));

  return { html, headings, blockLines };
}

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
let mermaidTheme: string | null = null;
const mermaidCache = new Map<string, string>();
let mermaidSeq = 0;

function isDarkBackground(): boolean {
  const bg = getComputedStyle(document.body).backgroundColor;
  const m = bg.match(/\d+(\.\d+)?/g);
  if (!m) return false;
  const [r, g, b] = m.map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

/** Renders every `.md-mermaid` block inside `root`. Loads mermaid (~1 MB) only on first use. */
export async function renderMermaid(root: HTMLElement): Promise<void> {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("pre.md-mermaid"));
  if (!blocks.length) return;
  mermaidPromise ??= import("mermaid").then((m) => m.default);
  const mermaid = await mermaidPromise;
  const theme = isDarkBackground() ? "dark" : "default";
  if (theme !== mermaidTheme) {
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme });
    mermaidTheme = theme;
    mermaidCache.clear();
  }
  for (const block of blocks) {
    if (!block.isConnected) continue;
    const src = block.textContent ?? "";
    const key = theme + "\n" + src;
    let svg = mermaidCache.get(key);
    if (!svg) {
      const id = `md-mermaid-${++mermaidSeq}`;
      try {
        svg = (await mermaid.render(id, src)).svg;
      } catch (err) {
        // mermaid leaves its temporary error container in <body> when parsing fails.
        document.getElementById(`d${id}`)?.remove();
        svg = `<div class="md-mermaid-error">Diagramme invalide : ${escapeHtml(err instanceof Error ? err.message : String(err))}</div>`;
      }
      mermaidCache.set(key, svg);
    }
    if (!block.isConnected) continue;
    const figure = document.createElement("div");
    figure.className = "md-mermaid-figure";
    if (block.dataset.line) figure.dataset.line = block.dataset.line;
    figure.innerHTML = svg;
    block.replaceWith(figure);
  }
}

export function countWords(md: string): number {
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]()!|-]/g, " ")
    .trim();
  return text ? (text.match(/[\p{L}\p{N}]+(['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0) : 0;
}
