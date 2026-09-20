import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

function relative(diffSeconds: number): string {
  const abs = Math.abs(diffSeconds);
  const units: [number, string][] = [
    [60, "seconde"],
    [60, "minute"],
    [24, "heure"],
    [30, "jour"],
    [12, "mois"],
    [Infinity, "an"],
  ];
  let value = abs;
  let label = "seconde";
  for (const [size, name] of units) {
    if (value < size) {
      label = name;
      break;
    }
    value = Math.floor(value / size);
    label = name;
  }
  const plural = value > 1 && !label.endsWith("s") ? "s" : "";
  return diffSeconds >= 0 ? `dans ${value} ${label}${plural}` : `il y a ${value} ${label}${plural}`;
}

export function TimestampTool() {
  const [epochInput, setEpochInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [dateInput, setDateInput] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });

  const epoch = epochInput.trim() ? Number(epochInput.trim()) : NaN;
  const fromEpochValid = Number.isFinite(epoch);
  const date = fromEpochValid ? new Date(epoch * 1000) : null;

  const epochRows: [string, string][] = date
    ? [
        ["Local", date.toLocaleString()],
        ["UTC", date.toUTCString()],
        ["ISO 8601", date.toISOString()],
        ["Relatif", relative(epoch - Math.floor(Date.now() / 1000))],
      ]
    : [];

  const parsedDate = dateInput ? new Date(dateInput) : null;
  const toEpochValid = parsedDate && !Number.isNaN(parsedDate.getTime());
  const epochSeconds = toEpochValid ? Math.floor(parsedDate.getTime() / 1000) : null;

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Timestamp Unix → date</span>
        </div>
        <div className="field-row" style={{ marginBottom: 0 }}>
          <div className="field">
            <span className="field-label">Secondes depuis epoch</span>
            <input className="input" value={epochInput} onChange={(e) => setEpochInput(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn"
            style={{ alignSelf: "flex-end" }}
            onClick={() => setEpochInput(String(Math.floor(Date.now() / 1000)))}
          >
            Maintenant
          </button>
        </div>
      </div>

      {!fromEpochValid && epochInput.trim() ? (
        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <pre className="is-error">Timestamp invalide.</pre>
        </div>
      ) : (
        <div className="hash-rows" style={{ marginBottom: "1.5rem" }}>
          {epochRows.map(([label, value]) => (
            <div className="hash-row" key={label}>
              <span className="alg">{label}</span>
              <span className="val">{value}</span>
              <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${label}`} />
            </div>
          ))}
        </div>
      )}

      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Date → timestamp Unix</span>
        </div>
        <div className="field">
          <span className="field-label">Date et heure locales</span>
          <input className="input" type="datetime-local" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
        </div>
      </div>

      {toEpochValid && (
        <div className="hash-rows">
          <div className="hash-row">
            <span className="alg">Secondes</span>
            <span className="val">{epochSeconds}</span>
            <CopyButton variant="mini" getText={() => String(epochSeconds)} ariaLabel="Copier les secondes" />
          </div>
          <div className="hash-row">
            <span className="alg">Millisec.</span>
            <span className="val">{epochSeconds !== null ? epochSeconds * 1000 : ""}</span>
            <CopyButton variant="mini" getText={() => String((epochSeconds ?? 0) * 1000)} ariaLabel="Copier les millisecondes" />
          </div>
        </div>
      )}
    </div>
  );
}
