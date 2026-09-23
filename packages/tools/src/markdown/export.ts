// Standalone stylesheet for exported/printed documents: always light, no app tokens,
// since the file is opened outside Toolbox.
const EXPORT_CSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#fff;color:#1f2328;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI","IBM Plex Sans",Helvetica,Arial,sans-serif}
main{max-width:800px;margin:0 auto;padding:48px 32px 80px}
h1,h2,h3,h4,h5,h6{line-height:1.25;margin:1.6em 0 .6em;font-weight:700}
h1{font-size:2em;padding-bottom:.3em;border-bottom:1px solid #d8dee4}
h2{font-size:1.5em;padding-bottom:.3em;border-bottom:1px solid #d8dee4}
h3{font-size:1.25em}h4{font-size:1em}h5{font-size:.875em}h6{font-size:.85em;color:#59636e}
h1:first-child,h2:first-child{margin-top:0}
p,ul,ol,blockquote,table,pre,.markdown-alert{margin:0 0 1em}
ul,ol{padding-left:2em}li+li{margin-top:.25em}
li:has(> input[type=checkbox]){list-style:none;margin-left:-1.4em}
li > input[type=checkbox]{margin:0 .45em 0 0;vertical-align:-.1em}
a{color:#0969da;text-decoration:none}a:hover{text-decoration:underline}
code{font-family:"IBM Plex Mono",SFMono-Regular,Consolas,monospace;font-size:.86em;background:#eff1f3;border-radius:6px;padding:.15em .4em}
pre{background:#f6f8fa;border-radius:8px;padding:16px;overflow:auto;font-size:.86em;line-height:1.5}
pre code{background:none;padding:0;font-size:1em}
blockquote{margin-left:0;padding:0 1em;color:#59636e;border-left:.25em solid #d1d9e0}
hr{border:none;border-top:1px solid #d1d9e0;margin:2em 0}
img{max-width:100%}
table{border-collapse:collapse;display:block;overflow:auto;width:max-content;max-width:100%}
th,td{border:1px solid #d1d9e0;padding:6px 13px}th{background:#f6f8fa;font-weight:600}tr:nth-child(2n) td{background:#fafbfc}
.markdown-alert{padding:.5em 1em;border-left:.25em solid #0969da}
.markdown-alert-title{display:flex;align-items:center;gap:.4em;font-weight:600;margin:0 0 .3em}
.markdown-alert > :last-child{margin-bottom:0}
.markdown-alert-note{border-color:#0969da}.markdown-alert-note .markdown-alert-title{color:#0969da}
.markdown-alert-tip{border-color:#1a7f37}.markdown-alert-tip .markdown-alert-title{color:#1a7f37}
.markdown-alert-important{border-color:#8250df}.markdown-alert-important .markdown-alert-title{color:#8250df}
.markdown-alert-warning{border-color:#9a6700}.markdown-alert-warning .markdown-alert-title{color:#9a6700}
.markdown-alert-caution{border-color:#d1242f}.markdown-alert-caution .markdown-alert-title{color:#d1242f}
.footnotes{font-size:.88em;color:#59636e;border-top:1px solid #d1d9e0;margin-top:2.5em;padding-top:1em}
.footnotes h2{font-size:1em;border:none;margin-top:0}
.md-mermaid-figure{text-align:center;margin:0 0 1em}.md-mermaid-figure svg{max-width:100%;height:auto}
.katex-display{overflow-x:auto;overflow-y:hidden}
.hljs-keyword,.hljs-selector-tag,.hljs-built_in,.hljs-type{color:#cf222e}
.hljs-string,.hljs-attr,.hljs-regexp,.hljs-addition{color:#0a3069}
.hljs-number,.hljs-literal,.hljs-symbol{color:#0550ae}
.hljs-comment,.hljs-quote{color:#6e7781;font-style:italic}
.hljs-title,.hljs-title.function_,.hljs-section{color:#8250df}
.hljs-variable,.hljs-template-variable,.hljs-params{color:#953800}
.hljs-name,.hljs-tag,.hljs-selector-class,.hljs-selector-id{color:#116329}
.hljs-meta{color:#1f2328;font-weight:600}.hljs-deletion{color:#82071e;background:#ffebe9}
@media print{main{max-width:none;padding:0}a{color:inherit}pre,blockquote,table,img,.md-mermaid-figure{break-inside:avoid}h1,h2,h3{break-after:avoid}}
`;

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.18.7/dist/katex.min.css";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Wraps rendered preview HTML into a self-contained page. */
export function buildStandaloneHtml(title: string, bodyHtml: string): string {
  const needsKatex = bodyHtml.includes('class="katex');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${needsKatex ? `<link rel="stylesheet" href="${KATEX_CSS}">\n` : ""}<style>${EXPORT_CSS}</style>
</head>
<body>
<main>
${bodyHtml}
</main>
</body>
</html>
`;
}

/** Prints through a hidden iframe so only the document — not the app — ends up in the PDF. */
export function printHtml(html: string): void {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  const run = () => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 1000);
  };
  // Give external stylesheets (KaTeX) a moment to load before printing.
  if (html.includes(KATEX_CSS)) setTimeout(run, 600);
  else requestAnimationFrame(run);
}

export function downloadFile(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(title: string): string {
  return (title.trim() || "document").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120);
}
