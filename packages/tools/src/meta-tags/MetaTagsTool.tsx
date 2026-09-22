import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function MetaTagsTool() {
  const [title, setTitle] = useState("Toolbox — outils développeur");
  const [description, setDescription] = useState("Des outils pour développeurs qui tournent entièrement sur votre machine.");
  const [url, setUrl] = useState("https://toolbox.dev");
  const [image, setImage] = useState("https://toolbox.dev/og-image.png");
  const [siteName, setSiteName] = useState("Toolbox");
  const [twitterHandle, setTwitterHandle] = useState("@toolbox");

  const html = [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta property="og:site_name" content="${escapeAttr(siteName)}" />`,
    "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
    twitterHandle ? `<meta name="twitter:site" content="${escapeAttr(twitterHandle)}" />` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Titre</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Nom du site</span>
          <input className="input" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Description</span>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">URL</span>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Image (og:image)</span>
          <input className="input" value={image} onChange={(e) => setImage(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <span className="field-label">Compte Twitter/X</span>
          <input className="input" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Balises &lt;head&gt;</span>
        </div>
        <pre>{html}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => html} />
        </div>
      </div>
    </div>
  );
}
