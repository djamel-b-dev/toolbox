import type { HLJSApi, Language } from "highlight.js";

/** Minimal CSV grammar for highlight.js: quoted fields, numbers, separators. */
export default function csv(_hljs: HLJSApi): Language {
  return {
    name: "CSV",
    contains: [
      { scope: "string", begin: '"', end: '"', contains: [{ begin: '""' }] },
      { scope: "number", begin: /(?<=^|[,;\t])-?\d+(\.\d+)?(?=$|[,;\t])/ },
      { scope: "punctuation", begin: /[,;\t]/ },
    ],
  };
}
