import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

export function BasicAuthTool() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  let token = "";
  try {
    token = username || password ? btoa(unescape(encodeURIComponent(`${username}:${password}`))) : "";
  } catch {
    token = "";
  }
  const header = token ? `Basic ${token}` : "";

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Nom d'utilisateur</span>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Mot de passe</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">En-tête Authorization</span>
        </div>
        <pre>{header || "—"}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => header} />
        </div>
      </div>
    </div>
  );
}
