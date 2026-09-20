import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

export function UuidTool() {
  const [uuids, setUuids] = useState<string[]>(() => [crypto.randomUUID()]);

  return (
    <div>
      <div className="panel-tools mb-md">
        <button
          type="button"
          className="btn"
          onClick={() => setUuids((prev) => [crypto.randomUUID(), ...prev].slice(0, 12))}
        >
          Générer un UUID
        </button>
        <button type="button" className="btn" onClick={() => setUuids([crypto.randomUUID()])}>
          Réinitialiser
        </button>
      </div>
      <div className="uuid-rows">
        {uuids.map((id, i) => (
          <div className="uuid-row" key={id + i}>
            <span>{id}</span>
            <CopyButton variant="mini" getText={() => id} ariaLabel="Copier l'UUID" />
          </div>
        ))}
      </div>
    </div>
  );
}
