import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

export function UrlParserTool() {
  const [input, setInput] = useState("https://workbench.dev:8443/search?q=hash+generator&lang=fr#results");

  let url: URL | null = null;
  let error = "";
  if (input.trim()) {
    try {
      url = new URL(input.trim());
    } catch {
      error = "URL invalide — assurez-vous qu'elle inclut un protocole (https://…).";
    }
  }

  const rows: [string, string][] = url
    ? [
        ["Protocole", url.protocol],
        ["Hôte", url.host],
        ["Nom d'hôte", url.hostname],
        ["Port", url.port || "(par défaut)"],
        ["Chemin", url.pathname || "/"],
        ["Requête", url.search || "—"],
        ["Fragment", url.hash || "—"],
      ]
    : [];

  const params = url ? Array.from(url.searchParams.entries()) : [];

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">URL</span>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="panel">
          <pre className="is-error">{error}</pre>
        </div>
      )}

      {url && (
        <>
          <div className="hash-rows" style={{ marginBottom: params.length ? "1.5rem" : 0 }}>
            {rows.map(([label, value]) => (
              <div className="hash-row" key={label}>
                <span className="alg">{label}</span>
                <span className="val">{value}</span>
                <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${label}`} />
              </div>
            ))}
          </div>

          {params.length > 0 && (
            <>
              <div className="row-head">
                <h2>Paramètres de requête</h2>
              </div>
              <div className="hash-rows">
                {params.map(([key, value], i) => (
                  <div className="hash-row" key={key + i}>
                    <span className="alg">{key}</span>
                    <span className="val">{value}</span>
                    <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${key}`} />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
