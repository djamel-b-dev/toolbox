import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SegmentedControl } from "@toolbox/ui";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import ini from "highlight.js/lib/languages/ini";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import csharp from "highlight.js/lib/languages/csharp";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import kotlin from "highlight.js/lib/languages/kotlin";
import swift from "highlight.js/lib/languages/swift";
import csv from "./hljsCsv";

hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("toml", ini);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("csv", csv);
hljs.registerLanguage("css", css);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("swift", swift);

export type CodeLanguage = "json" | "xml" | "yaml" | "toml" | "sql" | "typescript" | "csv" | "css" | "bash" | "csharp" | "python" | "java" | "go" | "rust" | "kotlin" | "swift" | "text";

const MAX_HIGHLIGHT = 400_000;

/** Read-only, syntax-highlighted code with line numbers. */
export function CodeView({ code, language, error }: { code: string; language: CodeLanguage; error?: boolean }) {
  const html = useMemo(() => {
    if (error || language === "text" || code.length > MAX_HIGHLIGHT) return null;
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  }, [code, language, error]);
  const lines = code ? code.split("\n").length : 0;

  return (
    <div className={"code-view" + (error ? " is-error" : "")}>
      {!error && lines > 0 && (
        <div className="code-gutter" aria-hidden="true">
          {Array.from({ length: lines }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      )}
      {html !== null ? <pre dangerouslySetInnerHTML={{ __html: html }} /> : <pre>{code}</pre>}
    </div>
  );
}

type OutputView = "tree" | "text";
const VIEW_KEY = "toolbox:output-view";

function readView(): OutputView {
  try {
    return localStorage.getItem(VIEW_KEY) === "text" ? "text" : "tree";
  } catch {
    return "tree";
  }
}

interface StructuredOutputProps {
  text: string;
  language: CodeLanguage;
  /** Collapsible tree for the same data; omitted when there is nothing to show as a tree. */
  tree?: ReactNode;
  error?: string;
}

/**
 * Output panel body for any tool producing structured data: an "Arbre" tab with
 * foldable groups and a "Texte" tab with highlighted source. The chosen tab is
 * remembered across tools.
 */
export function StructuredOutput({ text, language, tree, error }: StructuredOutputProps) {
  const [view, setView] = useState<OutputView>(readView);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* not persisted */
    }
  }, [view]);

  if (error) return <CodeView code={error} language="text" error />;
  if (!text) return <CodeView code="" language="text" />;

  const showTree = view === "tree" && tree;
  return (
    <div className="structured-output">
      {tree && (
        <div className="structured-output-tabs">
          <SegmentedControl<OutputView>
            value={view}
            onChange={setView}
            options={[
              { value: "tree", label: "Arbre" },
              { value: "text", label: "Texte" },
            ]}
          />
        </div>
      )}
      {showTree ? tree : <CodeView code={text} language={language} />}
    </div>
  );
}
