import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

const TYPES: [string, string][] = [
  [".html", "text/html"],
  [".css", "text/css"],
  [".js / .mjs", "text/javascript"],
  [".json", "application/json"],
  [".xml", "application/xml"],
  [".txt", "text/plain"],
  [".csv", "text/csv"],
  [".md", "text/markdown"],
  [".yaml / .yml", "application/x-yaml"],
  [".png", "image/png"],
  [".jpg / .jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".avif", "image/avif"],
  [".pdf", "application/pdf"],
  [".zip", "application/zip"],
  [".tar", "application/x-tar"],
  [".gz", "application/gzip"],
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".otf", "font/otf"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".ppt", "application/vnd.ms-powerpoint"],
  [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  [".wasm", "application/wasm"],
  [".rtf", "application/rtf"],
  [".bin", "application/octet-stream"],
  [".apk", "application/vnd.android.package-archive"],
  [".epub", "application/epub+zip"],
];

export function MimeTypesTool() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = TYPES.filter(([ext, mime]) => !q || ext.toLowerCase().includes(q) || mime.toLowerCase().includes(q));

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Rechercher</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder=".json, image, pdf…" />
        </div>
      </div>

      <div className="hash-rows">
        {filtered.map(([ext, mime]) => (
          <div className="hash-row" key={ext}>
            <span className="alg">{ext}</span>
            <span className="val">{mime}</span>
            <CopyButton variant="mini" getText={() => mime} ariaLabel={`Copier le type MIME de ${ext}`} />
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-state">Aucun type ne correspond.</p>}
      </div>
    </div>
  );
}
