import { useMemo, useState } from "react";
import { CopyButton, Icon } from "@toolbox/ui";
import { CodeView } from "../shared/CodeView";

type Target = "fetch" | "axios" | "python" | "go" | "php" | "powershell";

interface Req {
  method: string;
  url: string;
  headers: [string, string][];
  body?: string;
  form: [string, string][];
  auth?: [string, string];
  insecure: boolean;
  follow: boolean;
}

const EXAMPLE = `curl -X POST 'https://api.exemple.fr/v1/orders?dry_run=true' \\
  -H 'Authorization: Bearer eyJhbGciOi...' \\
  -H 'Content-Type: application/json' \\
  -d '{"product":"toolbox-pro","quantity":2,"coupon":null}'`;

/** Minimal POSIX-shell word splitter: quotes, backslash escapes and line continuations. */
function tokenize(cmd: string): string[] {
  const out: string[] = [];
  let cur = "";
  let has = false;
  let i = 0;
  const s = cmd.replace(/\\\r?\n/g, " ");
  while (i < s.length) {
    const c = s[i];
    if (c === "'") {
      const end = s.indexOf("'", i + 1);
      if (end === -1) throw new Error("Apostrophe non fermée.");
      cur += s.slice(i + 1, end);
      has = true;
      i = end + 1;
    } else if (c === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && i + 1 < s.length && '"\\$`'.includes(s[i + 1])) i++;
        cur += s[i++];
      }
      if (i >= s.length) throw new Error("Guillemet non fermé.");
      has = true;
      i++;
    } else if (c === "$" && s[i + 1] === "'") {
      const end = s.indexOf("'", i + 2);
      cur += s.slice(i + 2, end).replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\'/g, "'");
      has = true;
      i = end + 1;
    } else if (c === "\\" && i + 1 < s.length) {
      cur += s[i + 1];
      has = true;
      i += 2;
    } else if (/\s/.test(c)) {
      if (has) out.push(cur);
      cur = "";
      has = false;
      i++;
    } else {
      cur += c;
      has = true;
      i++;
    }
  }
  if (has) out.push(cur);
  return out;
}

function parseCurl(cmd: string): Req {
  const t = tokenize(cmd.trim());
  if (t[0] !== "curl") throw new Error("La commande doit commencer par « curl ».");
  const req: Req = { method: "", url: "", headers: [], form: [], insecure: false, follow: false };
  const data: string[] = [];
  let getMode = false;
  for (let i = 1; i < t.length; i++) {
    const a = t[i];
    const next = () => t[++i] ?? "";
    if (a === "-X" || a === "--request") req.method = next().toUpperCase();
    else if (a === "-H" || a === "--header") {
      const h = next();
      const j = h.indexOf(":");
      if (j > 0) req.headers.push([h.slice(0, j).trim(), h.slice(j + 1).trim()]);
    } else if (["-d", "--data", "--data-raw", "--data-binary", "--data-ascii"].includes(a)) data.push(next());
    else if (a === "--data-urlencode") {
      const v = next();
      const j = v.indexOf("=");
      data.push(j >= 0 ? `${v.slice(0, j)}=${encodeURIComponent(v.slice(j + 1))}` : encodeURIComponent(v));
    } else if (a === "--json") {
      data.push(next());
      req.headers.push(["Content-Type", "application/json"], ["Accept", "application/json"]);
    } else if (a === "-F" || a === "--form") {
      const v = next();
      const j = v.indexOf("=");
      req.form.push([v.slice(0, j), v.slice(j + 1)]);
    } else if (a === "-u" || a === "--user") {
      const v = next();
      const j = v.indexOf(":");
      req.auth = j >= 0 ? [v.slice(0, j), v.slice(j + 1)] : [v, ""];
    } else if (a === "-A" || a === "--user-agent") req.headers.push(["User-Agent", next()]);
    else if (a === "-b" || a === "--cookie") req.headers.push(["Cookie", next()]);
    else if (a === "-e" || a === "--referer") req.headers.push(["Referer", next()]);
    else if (a === "-k" || a === "--insecure") req.insecure = true;
    else if (a === "-L" || a === "--location") req.follow = true;
    else if (a === "-G" || a === "--get") getMode = true;
    else if (a === "--url") req.url = next();
    else if (a === "-I" || a === "--head") req.method = "HEAD";
    else if (/^-/.test(a)) {
      // Flags with a value we don't translate (timeouts, output file…): skip the value too.
      if (["-o", "--output", "-m", "--max-time", "--connect-timeout", "-w", "--write-out", "--retry", "-x", "--proxy", "--cacert", "--cert", "--key"].includes(a)) i++;
    } else if (!req.url) req.url = a;
  }
  if (!req.url) throw new Error("Aucune URL trouvée.");
  if (data.length) {
    if (getMode) req.url += (req.url.includes("?") ? "&" : "?") + data.join("&");
    else req.body = data.join("&");
  }
  if (!req.method) req.method = req.body || req.form.length ? "POST" : "GET";
  if (req.body && !req.headers.some(([k]) => k.toLowerCase() === "content-type")) req.headers.push(["Content-Type", "application/x-www-form-urlencoded"]);
  return req;
}

const js = (s: string) => JSON.stringify(s);
const py = (s: string) => JSON.stringify(s);
const isJson = (r: Req) => r.headers.some(([k, v]) => k.toLowerCase() === "content-type" && /json/.test(v)) && !!r.body && (() => {
  try {
    JSON.parse(r.body!);
    return true;
  } catch {
    return false;
  }
})();

function generate(r: Req, target: Target): string {
  const headers = [...r.headers];
  if (r.auth && target !== "python" && target !== "powershell") headers.push(["Authorization", `Basic ${btoa(`${r.auth[0]}:${r.auth[1]}`)}`]);
  const json = isJson(r);
  switch (target) {
    case "fetch": {
      const lines = [`const response = await fetch(${js(r.url)}, {`, `  method: ${js(r.method)},`];
      const hs = r.form.length ? headers.filter(([k]) => k.toLowerCase() !== "content-type") : headers;
      if (hs.length) lines.push("  headers: {", ...hs.map(([k, v]) => `    ${js(k)}: ${js(v)},`), "  },");
      if (r.form.length) lines.splice(0, 0, "const form = new FormData();", ...r.form.map(([k, v]) => (v.startsWith("@") ? `form.append(${js(k)}, fileInput.files[0]); // ${v.slice(1)}` : `form.append(${js(k)}, ${js(v)});`)), ""), lines.push("  body: form,");
      else if (r.body) lines.push(json ? `  body: JSON.stringify(${JSON.stringify(JSON.parse(r.body), null, 2).replace(/\n/g, "\n  ")}),` : `  body: ${js(r.body)},`);
      lines.push("});", "", json || /json/i.test(headers.map((h) => h.join(":")).join()) ? "const data = await response.json();" : "const data = await response.text();");
      return lines.join("\n") + "\n";
    }
    case "axios": {
      const lines = ['import axios from "axios";', "", "const { data } = await axios({", `  method: ${js(r.method.toLowerCase())},`, `  url: ${js(r.url)},`];
      if (headers.length) lines.push("  headers: {", ...headers.map(([k, v]) => `    ${js(k)}: ${js(v)},`), "  },");
      if (r.body) lines.push(json ? `  data: ${JSON.stringify(JSON.parse(r.body), null, 2).replace(/\n/g, "\n  ")},` : `  data: ${js(r.body)},`);
      if (!r.follow) lines.push("  maxRedirects: 0,");
      if (r.insecure) lines.push("  // -k : désactiver la vérification TLS via un httpsAgent({ rejectUnauthorized: false })");
      lines.push("});");
      return lines.join("\n") + "\n";
    }
    case "python": {
      const lines = ["import requests", ""];
      if (headers.length) lines.push("headers = {", ...headers.map(([k, v]) => `    ${py(k)}: ${py(v)},`), "}", "");
      if (r.form.length) lines.push("files = {", ...r.form.map(([k, v]) => (v.startsWith("@") ? `    ${py(k)}: open(${py(v.slice(1))}, "rb"),` : `    ${py(k)}: (None, ${py(v)}),`)), "}", "");
      const args = [py(r.url)];
      if (headers.length) args.push("headers=headers");
      if (r.body) args.push(json ? `json=${JSON.stringify(JSON.parse(r.body)).replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False").replace(/\bnull\b/g, "None")}` : `data=${py(r.body)}`);
      if (r.form.length) args.push("files=files");
      if (r.auth) args.push(`auth=(${py(r.auth[0])}, ${py(r.auth[1])})`);
      if (r.insecure) args.push("verify=False");
      if (!r.follow && r.method !== "GET") args.push("allow_redirects=False");
      lines.push(`response = requests.${["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(r.method) ? r.method.toLowerCase() : "request"}(${r.method === "OPTIONS" ? `"OPTIONS", ` : ""}${args.join(", ")})`, "response.raise_for_status()", json ? "print(response.json())" : "print(response.text)");
      return lines.join("\n") + "\n";
    }
    case "go": {
      const lines = ["package main", "", "import (", '\t"fmt"', '\t"io"', '\t"net/http"'];
      if (r.body) lines.push('\t"strings"');
      if (r.insecure) lines.push('\t"crypto/tls"');
      lines.push(")", "", "func main() {");
      if (r.body) lines.push(`\tbody := strings.NewReader(${"`" + r.body.replace(/`/g, "` + \"`\" + `") + "`"})`);
      lines.push(`\treq, err := http.NewRequest(${js(r.method)}, ${js(r.url)}, ${r.body ? "body" : "nil"})`, "\tif err != nil {", "\t\tpanic(err)", "\t}");
      for (const [k, v] of headers) lines.push(`\treq.Header.Set(${js(k)}, ${js(v)})`);
      lines.push(r.insecure ? "\tclient := &http.Client{Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}}" : "\tclient := &http.Client{}");
      lines.push("\tresp, err := client.Do(req)", "\tif err != nil {", "\t\tpanic(err)", "\t}", "\tdefer resp.Body.Close()", "\tdata, _ := io.ReadAll(resp.Body)", "\tfmt.Println(resp.Status, string(data))", "}");
      return lines.join("\n") + "\n";
    }
    case "php": {
      const lines = ["<?php", "$ch = curl_init();", `curl_setopt($ch, CURLOPT_URL, ${js(r.url)});`, "curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);", `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${js(r.method)});`];
      if (headers.length) lines.push("curl_setopt($ch, CURLOPT_HTTPHEADER, [", ...headers.map(([k, v]) => `    ${js(`${k}: ${v}`)},`), "]);");
      if (r.body) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${"'" + r.body.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'"});`);
      if (r.follow) lines.push("curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);");
      if (r.insecure) lines.push("curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);");
      lines.push("$response = curl_exec($ch);", "curl_close($ch);", "echo $response;");
      return lines.join("\n") + "\n";
    }
    case "powershell": {
      const ps = (s: string) => `'${s.replace(/'/g, "''")}'`;
      const lines: string[] = [];
      if (headers.length) lines.push("$headers = @{", ...headers.map(([k, v]) => `    ${ps(k)} = ${ps(v)}`), "}");
      const args = [`-Uri ${ps(r.url)}`, `-Method ${r.method}`];
      if (headers.length) args.push("-Headers $headers");
      if (r.body) args.push(`-Body ${ps(r.body)}`);
      if (r.auth) lines.push(`$cred = New-Object PSCredential(${ps(r.auth[0])}, (ConvertTo-SecureString ${ps(r.auth[1])} -AsPlainText -Force))`), args.push("-Credential $cred -Authentication Basic");
      if (r.insecure) args.push("-SkipCertificateCheck");
      lines.push(`$response = Invoke-RestMethod ${args.join(" `\n  ")}`, "$response");
      return lines.join("\n") + "\n";
    }
  }
}

const TARGETS: { id: Target; label: string; lang: "typescript" | "text" }[] = [
  { id: "fetch", label: "JavaScript (fetch)", lang: "typescript" },
  { id: "axios", label: "Node.js (axios)", lang: "typescript" },
  { id: "python", label: "Python (requests)", lang: "text" },
  { id: "go", label: "Go (net/http)", lang: "text" },
  { id: "php", label: "PHP (cURL)", lang: "text" },
  { id: "powershell", label: "PowerShell", lang: "text" },
];

export function CurlConverterTool() {
  const [input, setInput] = useState(EXAMPLE);
  const [target, setTarget] = useState<Target>("fetch");

  const result = useMemo(() => {
    try {
      const req = parseCurl(input);
      return { req, code: generate(req, target), error: "" };
    } catch (e) {
      return { req: null, code: "", error: e instanceof Error ? e.message : "Commande invalide." };
    }
  }, [input, target]);

  return (
    <div>
      <div className="emoji-groups mb-md">
        {TARGETS.map((t) => (
          <button key={t.id} type="button" className={"btn" + (t.id === target ? " is-active" : "")} onClick={() => setTarget(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Commande curl</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder="curl https://…  (Copier en tant que cURL depuis les DevTools fonctionne)" />
          {result.req && (
            <div className="hash-rows">
              <div className="hash-row hash-row-2">
                <span className="alg">Requête</span>
                <span className="val">
                  {result.req.method} {result.req.url}
                </span>
              </div>
              <div className="hash-row hash-row-2">
                <span className="alg">En-têtes</span>
                <span className="val">{result.req.headers.length}</span>
              </div>
            </div>
          )}
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{TARGETS.find((t) => t.id === target)!.label}</span>
          </div>
          <CodeView code={result.error || result.code} language={result.error ? "text" : TARGETS.find((t) => t.id === target)!.lang} error={!!result.error} />
          <div className="panel-tools">
            <CopyButton getText={() => result.code} />
          </div>
        </div>
      </div>
    </div>
  );
}
