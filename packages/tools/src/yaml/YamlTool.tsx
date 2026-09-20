import { useState } from "react";
import { dump, load } from "js-yaml";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";

type Mode = "toYaml" | "toJson";

const EXAMPLE_JSON = '{\n  "name": "workbench",\n  "tools": 60,\n  "categories": ["Crypto", "Web", "Text"]\n}';
const EXAMPLE_YAML = "name: workbench\ntools: 60\ncategories:\n  - Crypto\n  - Web\n  - Text\n";

export function YamlTool() {
  const [mode, setMode] = useState<Mode>("toYaml");
  const [input, setInput] = useState(EXAMPLE_JSON);

  let output = "";
  let error = "";
  if (input.trim()) {
    try {
      if (mode === "toYaml") {
        output = dump(JSON.parse(input));
      } else {
        output = JSON.stringify(load(input), null, 2);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Entrée invalide.";
    }
  }

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={(m) => {
            setMode(m);
            setInput(m === "toYaml" ? EXAMPLE_JSON : EXAMPLE_YAML);
          }}
          options={[
            { value: "toYaml", label: "JSON → YAML" },
            { value: "toJson", label: "YAML → JSON" },
          ]}
        />
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "toYaml" ? "JSON" : "YAML"}</span>
            <span className="meta">{input.length} car.</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "toYaml" ? "YAML" : "JSON"}</span>
            <span className="meta">{output.length} car.</span>
          </div>
          <pre className={error ? "is-error" : undefined}>{error || output}</pre>
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
