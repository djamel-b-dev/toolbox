import { useState } from "react";
import { CopyButton, Icon } from "@toolbox/ui";

function numeronym(word: string): string {
  if (word.length <= 3) return word;
  return word[0] + (word.length - 2) + word[word.length - 1];
}

function processText(input: string): string {
  return input.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]+/g, (word) => numeronym(word));
}

export function NumeronymTool() {
  const [input, setInput] = useState("internationalization accessibility Kubernetes");
  const output = processText(input);

  return (
    <div>
      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Entrée</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Numéronymes</span>
          </div>
          <pre>{output || "—"}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
