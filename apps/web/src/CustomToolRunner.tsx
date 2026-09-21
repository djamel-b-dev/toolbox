import { useEffect, useRef, useState } from "react";
import { CopyButton, Icon } from "@toolbox/ui";
import type { CustomTool } from "@toolbox/core";

export async function runCustomCode(code: string, input: string): Promise<string> {
  // eslint-disable-next-line no-new-func
  const fn = new Function("input", code) as (input: string) => unknown;
  const result = await fn(input);
  return result === undefined || result === null ? "" : String(result);
}

interface CustomToolRunnerProps {
  tool: CustomTool;
}

export function CustomToolRunner({ tool }: CustomToolRunnerProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!input) {
      setOutput("");
      setError("");
      return;
    }
    timer.current = window.setTimeout(() => {
      runCustomCode(tool.code, input)
        .then((r) => {
          setOutput(r);
          setError("");
        })
        .catch((e) => {
          setOutput("");
          setError(e instanceof Error ? e.message : "Ce code a levé une erreur.");
        });
    }, 150);
    return () => window.clearTimeout(timer.current);
  }, [tool.code, input]);

  return (
    <div className="bench">
      <div className="panel">
        <div className="panel-head">
          <span className="label">Entrée</span>
          <span className="meta">{input.length} car.</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tapez ou collez du texte…" spellCheck={false} />
      </div>
      <div className="rail-connector">
        <Icon name="arrow-right" />
      </div>
      <div className="panel">
        <div className="panel-head">
          <span className="label">Sortie</span>
          <span className="meta">{output.length} car.</span>
        </div>
        <pre className={error ? "is-error" : undefined}>{error || output}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => output} />
        </div>
      </div>
    </div>
  );
}
