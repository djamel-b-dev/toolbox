import { useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Sep = ":" | "-" | "";

function generate(sep: Sep, locallyAdministered: boolean): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  if (locallyAdministered) {
    bytes[0] = (bytes[0] & 0b11111100) | 0b00000010;
  } else {
    bytes[0] = bytes[0] & 0b11111110;
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(sep);
}

export function MacAddressTool() {
  const [sep, setSep] = useState<Sep>(":");
  const [locallyAdministered, setLocallyAdministered] = useState(true);
  const [addresses, setAddresses] = useState<string[]>(() => [generate(":", true)]);

  function regenerate() {
    setAddresses((prev) => [generate(sep, locallyAdministered), ...prev].slice(0, 12));
  }

  return (
    <div>
      <div className="field-row">
        <div className="field" style={{ maxWidth: 220 }}>
          <span className="field-label">Séparateur</span>
          <SegmentedControl<Sep>
            value={sep}
            onChange={setSep}
            options={[
              { value: ":", label: "Deux-points" },
              { value: "-", label: "Tiret" },
              { value: "", label: "Aucun" },
            ]}
          />
        </div>
      </div>

      <div className="panel-tools mb-md">
        <label className="check-row">
          <input type="checkbox" checked={locallyAdministered} onChange={(e) => setLocallyAdministered(e.target.checked)} />
          Adresse administrée localement
        </label>
        <button type="button" className="btn" onClick={regenerate}>
          Générer une adresse MAC
        </button>
      </div>

      <div className="uuid-rows">
        {addresses.map((addr, i) => (
          <div className="uuid-row" key={addr + i}>
            <span>{addr}</span>
            <CopyButton variant="mini" getText={() => addr} ariaLabel="Copier l'adresse MAC" />
          </div>
        ))}
      </div>
    </div>
  );
}
