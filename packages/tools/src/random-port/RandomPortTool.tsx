import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Range = "registered" | "dynamic" | "any";

const RANGES: Record<Range, [number, number]> = {
  registered: [1024, 49151],
  dynamic: [49152, 65535],
  any: [1, 65535],
};

function randomPort(range: Range): number {
  const [min, max] = RANGES[range];
  const value = crypto.getRandomValues(new Uint32Array(1))[0];
  return min + (value % (max - min + 1));
}

export function RandomPortTool() {
  const [range, setRange] = useState<Range>("dynamic");
  const [ports, setPorts] = useState<number[]>(() => [randomPort("dynamic")]);

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Plage</span>
          <SegmentedControl<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: "registered", label: "Enregistrés (1024–49151)" },
              { value: "dynamic", label: "Dynamiques (49152–65535)" },
              { value: "any", label: "Tous (1–65535)" },
            ]}
          />
        </div>
      </div>

      <div className="panel-tools mb-md">
        <button type="button" className="btn" onClick={() => setPorts((prev) => [randomPort(range), ...prev].slice(0, 12))}>
          Générer un port
        </button>
        <button type="button" className="btn" onClick={() => setPorts([randomPort(range)])}>
          Réinitialiser
        </button>
      </div>

      <div className="uuid-rows">
        {ports.map((port, i) => (
          <div className="uuid-row" key={port + "-" + i}>
            <span>{port}</span>
            <CopyButton variant="mini" getText={() => String(port)} ariaLabel="Copier le port" />
          </div>
        ))}
      </div>
    </div>
  );
}
