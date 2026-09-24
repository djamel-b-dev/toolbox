import { useMemo, useState } from "react";
import { dump, load } from "js-yaml";
import { CopyButton, Icon } from "@toolbox/ui";
import { CodeView, type CodeLanguage } from "../shared/CodeView";

// Env values are always strings: quoting them all keeps "10" or "true" from being read back as a number or boolean.
const QUOTED = { quoteStyle: "double", forceQuotes: true } as const;
const DOUBLE = { quoteStyle: "double" } as const;

type Format = "dotenv" | "json" | "yaml" | "k8s" | "configmap" | "secret" | "docker" | "compose" | "export" | "powershell";

const FORMATS: { id: Format; label: string; lang: CodeLanguage; input: boolean }[] = [
  { id: "dotenv", label: ".env", lang: "text", input: true },
  { id: "json", label: "JSON", lang: "json", input: true },
  { id: "yaml", label: "YAML (objet)", lang: "yaml", input: true },
  { id: "k8s", label: "Kubernetes env:", lang: "yaml", input: true },
  { id: "configmap", label: "ConfigMap", lang: "yaml", input: false },
  { id: "secret", label: "Secret (base64)", lang: "yaml", input: false },
  { id: "docker", label: "docker run -e", lang: "text", input: true },
  { id: "compose", label: "docker-compose", lang: "yaml", input: false },
  { id: "export", label: "export (bash)", lang: "text", input: true },
  { id: "powershell", label: "PowerShell", lang: "text", input: false },
];

const EXAMPLE = `# Base de données
DATABASE_URL=postgres://app:s3cr3t@db:5432/app
DB_POOL_SIZE=10

# Application
NODE_ENV=production
APP_NAME="Toolbox API"
FEATURE_FLAGS='beta,dark-mode'
DEBUG=false
`;

function unquote(v: string): string {
  const t = v.trim();
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1);
  return t.replace(/\s+#.*$/, "");
}

function parse(input: string, format: Format): Record<string, string> {
  const out: Record<string, string> = {};
  if (format === "dotenv" || format === "export") {
    for (const line of input.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][\w.-]*)\s*=\s*(.*)$/);
      if (m) out[m[1]] = unquote(m[2]);
    }
    return out;
  }
  if (format === "docker") {
    for (const m of input.matchAll(/(?:-e|--env)\s+(?:"([^"]*)"|'([^']*)'|(\S+))/g)) {
      const pair = m[1] ?? m[2] ?? m[3];
      const i = pair.indexOf("=");
      if (i > 0) out[pair.slice(0, i)] = pair.slice(i + 1);
    }
    return out;
  }
  const data = format === "json" ? JSON.parse(input) : load(input);
  if (format === "k8s" || Array.isArray(data) || (data && typeof data === "object" && "env" in (data as object))) {
    const list = Array.isArray(data) ? data : (data as { env: unknown[] }).env;
    if (Array.isArray(list)) {
      for (const item of list as { name?: string; value?: unknown }[]) if (item?.name) out[item.name] = item.value === undefined ? "" : String(item.value);
      return out;
    }
  }
  if (!data || typeof data !== "object") throw new Error("Un objet clé/valeur est attendu.");
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) out[k] = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
  return out;
}

function dotenvValue(v: string): string {
  return /^[\w@%+=:,./-]*$/.test(v) ? v : `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function shellQuote(v: string): string {
  return /^[\w@%+=:,./-]+$/.test(v) ? v : `'${v.replace(/'/g, `'\\''`)}'`;
}

function toBase64(s: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}

function serialize(vars: Record<string, string>, format: Format, name: string): string {
  const entries = Object.entries(vars);
  switch (format) {
    case "dotenv":
      return entries.map(([k, v]) => `${k}=${dotenvValue(v)}`).join("\n") + "\n";
    case "json":
      return JSON.stringify(vars, null, 2) + "\n";
    case "yaml":
      return dump(vars, DOUBLE);
    case "k8s":
      return dump({ env: entries.map(([k, v]) => ({ name: k, value: v })) }, QUOTED);
    case "configmap":
      return dump({ apiVersion: "v1", kind: "ConfigMap", metadata: { name }, data: vars }, QUOTED);
    case "secret":
      return dump({ apiVersion: "v1", kind: "Secret", metadata: { name }, type: "Opaque", data: Object.fromEntries(entries.map(([k, v]) => [k, toBase64(v)])) });
    case "docker":
      return "docker run \\\n" + entries.map(([k, v]) => `  -e ${shellQuote(`${k}=${v}`)} \\`).join("\n") + "\n  image:tag\n";
    case "compose":
      return dump({ services: { app: { environment: vars } } }, QUOTED);
    case "export":
      return entries.map(([k, v]) => `export ${k}=${shellQuote(v)}`).join("\n") + "\n";
    case "powershell":
      return entries.map(([k, v]) => `$env:${k} = '${v.replace(/'/g, "''")}'`).join("\n") + "\n";
  }
}

export function EnvConverterTool() {
  const [from, setFrom] = useState<Format>("dotenv");
  const [to, setTo] = useState<Format>("k8s");
  const [input, setInput] = useState(EXAMPLE);
  const [name, setName] = useState("app-config");

  const result = useMemo(() => {
    try {
      const vars = parse(input, from);
      return { vars, output: serialize(vars, to, name), error: "" };
    } catch (e) {
      return { vars: {}, output: "", error: e instanceof Error ? e.message : "Entrée invalide." };
    }
  }, [input, from, to, name]);

  const count = Object.keys(result.vars).length;
  const lang = FORMATS.find((f) => f.id === to)!.lang;

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Depuis</span>
          <select className="input" value={from} onChange={(e) => setFrom(e.target.value as Format)}>
            {FORMATS.filter((f) => f.input).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="field-label">Vers</span>
          <select className="input" value={to} onChange={(e) => setTo(e.target.value as Format)}>
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        {(to === "configmap" || to === "secret") && (
          <div className="field">
            <span className="field-label">metadata.name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn"
            disabled={!FORMATS.find((f) => f.id === to)!.input || !result.output}
            onClick={() => {
              setInput(result.output);
              setFrom(to);
              setTo(from);
            }}
          >
            ⇄ Inverser
          </button>
        </div>
      </div>
      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">{FORMATS.find((f) => f.id === from)!.label}</span>
            <span className="meta">
              {count} variable{count > 1 ? "s" : ""}
            </span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{FORMATS.find((f) => f.id === to)!.label}</span>
          </div>
          <CodeView code={result.error || result.output} language={result.error ? "text" : lang} error={!!result.error} />
          <div className="panel-tools">
            <CopyButton getText={() => result.output} />
          </div>
        </div>
      </div>
      {to === "secret" && (
        <p className="row-head hint" style={{ margin: "0.85rem 0 0" }}>
          Rappel : le base64 d'un Secret Kubernetes n'est qu'un encodage, pas un chiffrement. Ne commitez pas ce fichier.
        </p>
      )}
    </div>
  );
}
