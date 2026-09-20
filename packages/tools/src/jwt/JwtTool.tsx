import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

function base64UrlDecode(str: string) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
}

const EXAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtTool() {
  const [token, setToken] = useState("");

  let header = "";
  let payload = "";
  let error = "";
  const parts = token.trim().split(".");
  if (token.trim()) {
    if (parts.length !== 3) {
      error = "Un JWT doit contenir trois segments séparés par des points.";
    } else {
      try {
        header = JSON.stringify(JSON.parse(base64UrlDecode(parts[0])), null, 2);
        payload = JSON.stringify(JSON.parse(base64UrlDecode(parts[1])), null, 2);
      } catch {
        error = "Impossible de décoder ce token — vérifiez qu'il s'agit bien d'un JWT.";
      }
    }
  }

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Token</span>
          <span className="meta">{token.length} car.</span>
        </div>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Collez un JWT…"
          spellCheck={false}
          style={{ minHeight: 100 }}
        />
        <div className="panel-tools">
          <button type="button" className="btn" onClick={() => setToken(EXAMPLE)}>
            Utiliser un exemple
          </button>
          <button type="button" className="btn" onClick={() => setToken("")}>
            Effacer
          </button>
        </div>
      </div>

      {error && (
        <div className="panel mb-lg">
          <pre className="is-error">{error}</pre>
        </div>
      )}

      {!error && (header || payload) && (
        <>
          <div className="bench bench-2">
            <div className="panel">
              <div className="panel-head">
                <span className="label">En-tête</span>
              </div>
              <pre>{header}</pre>
              <div className="panel-tools">
                <CopyButton getText={() => header} label="Copier" />
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <span className="label">Payload</span>
              </div>
              <pre>{payload}</pre>
              <div className="panel-tools">
                <CopyButton getText={() => payload} label="Copier" />
              </div>
            </div>
          </div>
          <p className="row-head hint" style={{ margin: "0.85rem 0 0" }}>
            Signature non vérifiée — ce décodeur lit le contenu du token sans valider sa clé.
          </p>
        </>
      )}
    </div>
  );
}
