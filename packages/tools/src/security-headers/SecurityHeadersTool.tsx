import { useMemo, useState } from "react";

type Level = "ok" | "warn" | "bad" | "info";
interface Finding {
  header: string;
  level: Level;
  title: string;
  detail: string;
  fix?: string;
}

const EXAMPLE = `HTTP/2 200
content-type: text/html; charset=utf-8
strict-transport-security: max-age=31536000
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
server: nginx/1.18.0
x-powered-by: Express
set-cookie: session=abc123; Path=/; HttpOnly
access-control-allow-origin: *`;

function parseHeaders(raw: string): { name: string; value: string }[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^HTTP\/\S+\s+\d+/i.test(l) && l.includes(":"))
    .map((l) => {
      const i = l.indexOf(":");
      return { name: l.slice(0, i).trim().toLowerCase(), value: l.slice(i + 1).trim() };
    });
}

function analyze(headers: { name: string; value: string }[]): Finding[] {
  const get = (n: string) => headers.find((h) => h.name === n)?.value;
  const all = (n: string) => headers.filter((h) => h.name === n).map((h) => h.value);
  const f: Finding[] = [];

  const hsts = get("strict-transport-security");
  if (!hsts) f.push({ header: "Strict-Transport-Security", level: "bad", title: "HSTS absent", detail: "Le navigateur peut être redirigé vers HTTP (attaque de type SSL stripping).", fix: "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload" });
  else {
    const age = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0);
    if (age < 15552000) f.push({ header: "Strict-Transport-Security", level: "warn", title: `max-age trop court (${age} s)`, detail: "Recommandé : au moins 6 mois (15552000), idéalement 1 an.", fix: "Strict-Transport-Security: max-age=31536000; includeSubDomains" });
    else if (!/includesubdomains/i.test(hsts)) f.push({ header: "Strict-Transport-Security", level: "warn", title: "includeSubDomains manquant", detail: "Les sous-domaines ne sont pas protégés par HSTS.", fix: `Strict-Transport-Security: ${hsts}; includeSubDomains` });
    else f.push({ header: "Strict-Transport-Security", level: "ok", title: "HSTS correctement configuré", detail: hsts });
  }

  const csp = get("content-security-policy");
  if (!csp) f.push({ header: "Content-Security-Policy", level: "bad", title: "CSP absente", detail: "Aucune protection contre l'injection de scripts (XSS) au niveau du navigateur.", fix: "Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" });
  else {
    const issues: string[] = [];
    if (/'unsafe-inline'/.test(csp) && /script-src|default-src/.test(csp)) issues.push("'unsafe-inline' autorise les scripts inline et annule l'essentiel de la protection XSS");
    if (/'unsafe-eval'/.test(csp)) issues.push("'unsafe-eval' autorise eval()");
    if (/(script-src|default-src)[^;]*\s\*(\s|;|$)/.test(csp)) issues.push("joker * pour les scripts");
    if (/(script-src|default-src)[^;]*(https?:|data:)(\s|;|$)/.test(csp)) issues.push("schéma entier autorisé (https: ou data:)");
    if (!/object-src/.test(csp) && !/default-src\s+'none'/.test(csp)) issues.push("object-src non restreint (plugins)");
    if (!/frame-ancestors/.test(csp)) issues.push("frame-ancestors absent (clickjacking géré seulement par X-Frame-Options)");
    if (issues.length) f.push({ header: "Content-Security-Policy", level: issues.length > 2 ? "bad" : "warn", title: `${issues.length} faiblesse${issues.length > 1 ? "s" : ""} dans la CSP`, detail: issues.join(" · "), fix: "Remplacer 'unsafe-inline' par des nonces ou des hash, et ajouter object-src 'none'; frame-ancestors 'self'" });
    else f.push({ header: "Content-Security-Policy", level: "ok", title: "CSP stricte", detail: csp });
  }

  const xcto = get("x-content-type-options");
  f.push(xcto?.toLowerCase() === "nosniff" ? { header: "X-Content-Type-Options", level: "ok", title: "nosniff activé", detail: "Le navigateur ne devine pas le type MIME." } : { header: "X-Content-Type-Options", level: "warn", title: "nosniff absent", detail: "Le navigateur peut interpréter un fichier comme un autre type (MIME sniffing).", fix: "X-Content-Type-Options: nosniff" });

  const xfo = get("x-frame-options");
  if (!xfo && !/frame-ancestors/.test(csp ?? "")) f.push({ header: "X-Frame-Options", level: "bad", title: "Protection anti-clickjacking absente", detail: "La page peut être intégrée dans une iframe par n'importe quel site.", fix: "X-Frame-Options: DENY (ou CSP frame-ancestors 'self')" });
  else if (xfo) f.push({ header: "X-Frame-Options", level: /deny|sameorigin/i.test(xfo) ? "ok" : "warn", title: `X-Frame-Options: ${xfo}`, detail: /allow-from/i.test(xfo) ? "ALLOW-FROM n'est plus pris en charge ; utilisez CSP frame-ancestors." : "Intégration en iframe restreinte." });

  const rp = get("referrer-policy");
  f.push(rp ? { header: "Referrer-Policy", level: /unsafe-url|no-referrer-when-downgrade/i.test(rp) ? "warn" : "ok", title: `Referrer-Policy: ${rp}`, detail: /unsafe-url/i.test(rp) ? "L'URL complète (avec paramètres) fuit vers les autres sites." : "Fuite d'URL limitée." } : { header: "Referrer-Policy", level: "warn", title: "Referrer-Policy absente", detail: "Le défaut du navigateur s'applique (strict-origin-when-cross-origin sur les navigateurs récents).", fix: "Referrer-Policy: strict-origin-when-cross-origin" });

  const pp = get("permissions-policy");
  f.push(pp ? { header: "Permissions-Policy", level: "ok", title: "Permissions-Policy définie", detail: pp } : { header: "Permissions-Policy", level: "info", title: "Permissions-Policy absente", detail: "Recommandé pour désactiver caméra, micro, géolocalisation… si non utilisés.", fix: "Permissions-Policy: camera=(), microphone=(), geolocation=()" });

  const coop = get("cross-origin-opener-policy");
  f.push(coop ? { header: "Cross-Origin-Opener-Policy", level: "ok", title: `COOP: ${coop}`, detail: "Isolation des fenêtres ouvertes." } : { header: "Cross-Origin-Opener-Policy", level: "info", title: "COOP absent", detail: "Protège contre les attaques via window.opener (XS-Leaks).", fix: "Cross-Origin-Opener-Policy: same-origin" });

  const acao = get("access-control-allow-origin");
  if (acao) {
    const creds = get("access-control-allow-credentials") === "true";
    if (acao === "*" && creds) f.push({ header: "Access-Control-Allow-Origin", level: "bad", title: "CORS * avec credentials", detail: "Combinaison refusée par les navigateurs et signe d'une mauvaise configuration." });
    else if (acao === "*") f.push({ header: "Access-Control-Allow-Origin", level: "warn", title: "CORS ouvert à tous les sites", detail: "Acceptable pour une API publique, à éviter pour des données privées." });
    else f.push({ header: "Access-Control-Allow-Origin", level: "ok", title: `CORS limité à ${acao}`, detail: "Origine explicite." });
  }

  for (const [name, label] of [["server", "Server"], ["x-powered-by", "X-Powered-By"], ["x-aspnet-version", "X-AspNet-Version"]] as const) {
    const v = get(name);
    if (v) f.push({ header: label, level: /\d/.test(v) ? "warn" : "info", title: `Divulgation : ${v}`, detail: /\d/.test(v) ? "La version exacte facilite le ciblage de failles connues." : "Indique la technologie utilisée.", fix: `Supprimer l'en-tête ${label} ou masquer la version` });
  }

  if (get("x-xss-protection")) f.push({ header: "X-XSS-Protection", level: "info", title: "En-tête obsolète", detail: "Ignoré par les navigateurs modernes ; peut même introduire des failles. Préférez une CSP.", fix: "Supprimer X-XSS-Protection (ou X-XSS-Protection: 0)" });

  for (const cookie of all("set-cookie")) {
    const name = cookie.split("=")[0];
    const missing = [!/;\s*secure/i.test(cookie) && "Secure", !/;\s*httponly/i.test(cookie) && "HttpOnly", !/;\s*samesite=/i.test(cookie) && "SameSite"].filter(Boolean) as string[];
    f.push(missing.length ? { header: `Set-Cookie (${name})`, level: missing.includes("Secure") || missing.includes("HttpOnly") ? "bad" : "warn", title: `Attributs manquants : ${missing.join(", ")}`, detail: "Secure : jamais envoyé en HTTP. HttpOnly : inaccessible au JavaScript. SameSite : protège du CSRF.", fix: `Set-Cookie: ${cookie.split(";")[0]}; Path=/; Secure; HttpOnly; SameSite=Lax` } : { header: `Set-Cookie (${name})`, level: "ok", title: "Cookie correctement protégé", detail: cookie });
  }
  return f;
}

const WEIGHT: Record<Level, number> = { ok: 0, info: 0, warn: 1, bad: 3 };
const ICON: Record<Level, string> = { ok: "✓", warn: "!", bad: "✗", info: "i" };

export function SecurityHeadersTool() {
  const [raw, setRaw] = useState(EXAMPLE);
  const headers = useMemo(() => parseHeaders(raw), [raw]);
  const findings = useMemo(() => (headers.length ? analyze(headers) : []), [headers]);
  const penalty = findings.reduce((n, f) => n + WEIGHT[f.level], 0);
  const score = Math.max(0, 100 - penalty * 8);
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  const order: Level[] = ["bad", "warn", "info", "ok"];

  return (
    <div>
      <div className="panel mb-lg" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">En-têtes de réponse</span>
          <span className="meta">{headers.length} en-têtes</span>
        </div>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false} style={{ minHeight: 170 }} placeholder="Collez la sortie de curl -I https://exemple.com ou l'onglet Réseau des DevTools…" />
        <p className="row-head hint" style={{ margin: 0 }}>
          Astuce : <code>curl -sI https://votre-site.fr</code>, puis collez le résultat. Rien n'est envoyé : l'analyse se fait dans le navigateur.
        </p>
      </div>

      {findings.length > 0 && (
        <>
          <div className="sec-score mb-lg">
            <span className={`sec-grade grade-${grade}`}>{grade}</span>
            <div>
              <strong>Score : {score} / 100</strong>
              <span>
                {findings.filter((f) => f.level === "bad").length} problème(s) grave(s) · {findings.filter((f) => f.level === "warn").length} avertissement(s) · {findings.filter((f) => f.level === "ok").length} point(s) OK
              </span>
            </div>
          </div>
          <div className="sec-list">
            {[...findings]
              .sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))
              .map((f, i) => (
                <div className={`sec-item sec-${f.level}`} key={i}>
                  <span className="sec-icon" aria-hidden="true">
                    {ICON[f.level]}
                  </span>
                  <div className="sec-body">
                    <div className="sec-head">
                      <code>{f.header}</code>
                      <strong>{f.title}</strong>
                    </div>
                    <p>{f.detail}</p>
                    {f.fix && <code className="sec-fix">{f.fix}</code>}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
