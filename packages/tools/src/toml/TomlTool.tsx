import { useState } from "react";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";
import { JsonTree } from "../shared/JsonTree";
import { StructuredOutput } from "../shared/CodeView";

type Mode = "toToml" | "toJson";

const EXAMPLE_JSON = '{\n  "name": "toolbox",\n  "tools": 60,\n  "owner": { "name": "Djamel" }\n}';
const EXAMPLE_TOML = 'name = "toolbox"\ntools = 60\n\n[owner]\nname = "Djamel"\n';

export function TomlTool() {
  const [mode, setMode] = useState<Mode>("toToml");
  const [input, setInput] = useState(EXAMPLE_JSON);

  let output = "";
  let error = "";
  let data: unknown;
  if (input.trim()) {
    try {
      if (mode === "toToml") {
        data = JSON.parse(input);
        output = stringifyToml(data as Record<string, unknown>);
      } else {
        data = parseToml(input);
        output = JSON.stringify(data, null, 2);
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
            setInput(m === "toToml" ? EXAMPLE_JSON : EXAMPLE_TOML);
          }}
          options={[
            { value: "toToml", label: "JSON → TOML" },
            { value: "toJson", label: "TOML → JSON" },
          ]}
        />
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "toToml" ? "JSON" : "TOML"}</span>
            <span className="meta">{input.length} car.</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{mode === "toToml" ? "TOML" : "JSON"}</span>
            <span className="meta">{output.length} car.</span>
          </div>
          <StructuredOutput
            text={output}
            language={mode === "toToml" ? "toml" : "json"}
            error={error}
            tree={data !== undefined && output ? <JsonTree data={data} /> : undefined}
          />
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
