import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SlugTool() {
  const [input, setInput] = useState("");
  const slug = slugify(input);

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Titre</span>
          <span className="meta">{input.length} car.</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cinq idées reçues sur les outils développeur"
          spellCheck={false}
          style={{ minHeight: 80 }}
        />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Slug</span>
        </div>
        <pre>{slug || "—"}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => slug} />
        </div>
      </div>
    </div>
  );
}
