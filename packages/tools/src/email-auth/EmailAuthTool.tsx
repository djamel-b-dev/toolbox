import { useMemo, useState } from "react";
import { SegmentedControl } from "@toolbox/ui";

type Kind = "spf" | "dmarc" | "dkim";
type Level = "ok" | "warn" | "bad" | "info";
interface Part {
  token: string;
  meaning: string;
}
interface Note {
  level: Level;
  text: string;
}

const EXAMPLES: Record<Kind, string> = {
  spf: "v=spf1 ip4:203.0.113.0/24 include:_spf.google.com include:mailgun.org a mx ~all",
  dmarc: "v=DMARC1; p=quarantine; sp=reject; pct=50; rua=mailto:dmarc@exemple.fr; ruf=mailto:forensic@exemple.fr; adkim=s; aspf=r; fo=1",
  dkim: "v=DKIM1; k=rsa; t=y; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArMbI15o3+39ZQcvNceg2u3l4emMKSBS951j+2G1mu6mKXj0eO1G7tZVqbG9n2pHMmWD/zI7Z2fSBBo/tmF1LtIlwU5tLCAq6faZV2bE3V+K5yMXU3g3HT2DSojXt18OprcgwT/fkXseDqcNcRiD/81KH7dDMYXZK9XSD/2lUl+R6lO5vqAVS/dCbZj6i0pMXBZOhMb238zCsOxpJ8YxYn36vQ1Uh5VomfJTZihTfjkzPZFcUi7ngk843s/hfZPq3SSzEmiAsu/QKqmb5iw5OVh0TpfnalaZ1Y5XLa2zIryRxHoMRI8kvy80qffAFPI/NGB6EAft3+uk6TFjr1mNYfQIDAQAB",
};

const QUALIFIERS: Record<string, string> = { "+": "autoriser (pass)", "-": "rejeter (fail)", "~": "accepter en marquant suspect (softfail)", "?": "neutre" };

function analyzeSpf(rec: string): { parts: Part[]; notes: Note[] } {
  const tokens = rec.trim().split(/\s+/);
  const parts: Part[] = [];
  const notes: Note[] = [];
  let lookups = 0;
  let all: string | null = null;
  if (tokens[0]?.toLowerCase() !== "v=spf1") notes.push({ level: "bad", text: "Un enregistrement SPF doit commencer par « v=spf1 »." });
  for (const tok of tokens) {
    if (/^v=spf1$/i.test(tok)) {
      parts.push({ token: tok, meaning: "Version SPF 1." });
      continue;
    }
    const m = tok.match(/^([+\-~?]?)(all|ip4|ip6|a|mx|ptr|exists|include)(?::(.+?))?(\/\d+)?$/i);
    const mod = tok.match(/^(redirect|exp)=(.+)$/i);
    if (mod) {
      if (mod[1].toLowerCase() === "redirect") lookups++;
      parts.push({ token: tok, meaning: mod[1].toLowerCase() === "redirect" ? `Utiliser la politique SPF de ${mod[2]} à la place.` : `Message d'explication publié en ${mod[2]}.` });
      continue;
    }
    if (!m) {
      parts.push({ token: tok, meaning: "Mécanisme inconnu : il invalide tout l'enregistrement (permerror)." });
      notes.push({ level: "bad", text: `« ${tok} » n'est pas un mécanisme SPF valide.` });
      continue;
    }
    const q = QUALIFIERS[m[1] || "+"];
    const mech = m[2].toLowerCase();
    const arg = m[3] ?? "";
    if (["a", "mx", "ptr", "exists", "include"].includes(mech)) lookups++;
    const meaning =
      mech === "all" ? `Tous les autres serveurs : ${q}.`
      : mech === "ip4" || mech === "ip6" ? `${q[0].toUpperCase() + q.slice(1)} l'adresse ou la plage ${arg}${m[4] ?? ""}.`
      : mech === "a" ? `${q[0].toUpperCase() + q.slice(1)} les IP de l'enregistrement A/AAAA de ${arg || "ce domaine"}.`
      : mech === "mx" ? `${q[0].toUpperCase() + q.slice(1)} les serveurs MX de ${arg || "ce domaine"}.`
      : mech === "include" ? `${q[0].toUpperCase() + q.slice(1)} les serveurs autorisés par le SPF de ${arg}.`
      : mech === "ptr" ? "Vérification par DNS inverse (déconseillé par la RFC 7208)."
      : `${q} si ${arg} existe dans le DNS.`;
    parts.push({ token: tok, meaning });
    if (mech === "all") all = m[1] || "+";
    if (mech === "ptr") notes.push({ level: "warn", text: "ptr est lent, peu fiable et déconseillé : remplacez-le par ip4/ip6 ou include." });
  }
  if (lookups > 10) notes.push({ level: "bad", text: `${lookups} requêtes DNS (include, a, mx, ptr, exists, redirect) : la limite est 10, au-delà l'enregistrement échoue (permerror). Aplatissez certains include.` });
  else notes.push({ level: lookups >= 8 ? "warn" : "ok", text: `${lookups} / 10 requêtes DNS au premier niveau (les include imbriqués comptent aussi).` });
  if (all === null) notes.push({ level: "warn", text: "Pas de mécanisme « all » final : le résultat par défaut est neutre. Terminez par ~all ou -all." });
  else if (all === "+") notes.push({ level: "bad", text: "+all autorise n'importe quel serveur à envoyer pour votre domaine : SPF devient inutile." });
  else if (all === "?") notes.push({ level: "warn", text: "?all ne protège pas : préférez ~all puis -all." });
  else if (all === "~") notes.push({ level: "info", text: "~all (softfail) est courant pendant une phase de test ; avec DMARC en place, -all est plus strict." });
  else notes.push({ level: "ok", text: "-all : tout serveur non listé est rejeté." });
  if (rec.length > 255) notes.push({ level: "info", text: "Plus de 255 caractères : l'enregistrement TXT doit être découpé en plusieurs chaînes entre guillemets." });
  return { parts, notes };
}

function tags(rec: string): [string, string][] {
  return rec
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const i = t.indexOf("=");
      return [t.slice(0, i).trim().toLowerCase(), t.slice(i + 1).trim()] as [string, string];
    });
}

function analyzeDmarc(rec: string): { parts: Part[]; notes: Note[] } {
  const t = tags(rec);
  const get = (k: string) => t.find(([n]) => n === k)?.[1];
  const policy: Record<string, string> = { none: "aucune action (surveillance uniquement)", quarantine: "mettre en quarantaine (courrier indésirable)", reject: "rejeter le message" };
  const DESC: Record<string, (v: string) => string> = {
    v: () => "Version DMARC 1.",
    p: (v) => `Politique pour le domaine : ${policy[v] ?? v}.`,
    sp: (v) => `Politique pour les sous-domaines : ${policy[v] ?? v}.`,
    pct: (v) => `Appliquer la politique à ${v} % des messages en échec.`,
    rua: (v) => `Rapports agrégés (quotidiens) envoyés à ${v}.`,
    ruf: (v) => `Rapports d'échec détaillés envoyés à ${v}.`,
    adkim: (v) => `Alignement DKIM ${v === "s" ? "strict (domaine identique)" : "relâché (sous-domaines acceptés)"}.`,
    aspf: (v) => `Alignement SPF ${v === "s" ? "strict (domaine identique)" : "relâché (sous-domaines acceptés)"}.`,
    fo: (v) => `Options des rapports d'échec : ${{ "0": "si SPF et DKIM échouent", "1": "si SPF ou DKIM échoue", d: "si DKIM échoue", s: "si SPF échoue" }[v] ?? v}.`,
    ri: (v) => `Intervalle des rapports : ${Math.round(Number(v) / 3600)} h.`,
    np: (v) => `Politique pour les sous-domaines inexistants : ${policy[v] ?? v}.`,
  };
  const parts = t.map(([k, v]) => ({ token: `${k}=${v}`, meaning: DESC[k]?.(v) ?? "Tag inconnu (ignoré)." }));
  const notes: Note[] = [];
  if (get("v") !== "DMARC1") notes.push({ level: "bad", text: "Doit commencer par « v=DMARC1 »." });
  const p = get("p");
  if (!p) notes.push({ level: "bad", text: "Le tag p= est obligatoire." });
  else if (p === "none") notes.push({ level: "warn", text: "p=none ne protège pas : il sert à observer. Passez à quarantine puis reject une fois les rapports propres." });
  else if (p === "quarantine") notes.push({ level: "info", text: "p=quarantine : bonne étape intermédiaire avant reject." });
  else notes.push({ level: "ok", text: "p=reject : protection maximale contre l'usurpation." });
  const pct = Number(get("pct") ?? 100);
  if (pct < 100) notes.push({ level: "info", text: `pct=${pct} : seule une partie des messages est concernée par la politique.` });
  if (!get("rua")) notes.push({ level: "warn", text: "Aucun rua= : vous ne recevrez pas de rapports, impossible de savoir qui envoie en votre nom." });
  return { parts, notes };
}

function analyzeDkim(rec: string): { parts: Part[]; notes: Note[] } {
  const t = tags(rec);
  const get = (k: string) => t.find(([n]) => n === k)?.[1];
  const notes: Note[] = [];
  const pkey = (get("p") ?? "").replace(/\s/g, "");
  let bits = 0;
  if (pkey) {
    try {
      const der = atob(pkey);
      // The RSA modulus dominates the SPKI size: ~38 bytes of overhead around it.
      bits = Math.round(((der.length - 38) * 8) / 256) * 256;
    } catch {
      notes.push({ level: "bad", text: "La clé p= n'est pas du base64 valide." });
    }
  }
  const k = get("k") ?? "rsa";
  const DESC: Record<string, (v: string) => string> = {
    v: () => "Version DKIM 1.",
    k: (v) => `Algorithme de clé : ${v}.`,
    p: (v) => (v ? `Clé publique${k === "rsa" && bits ? ` (≈ RSA ${bits} bits)` : ""}.` : "Clé vide : ce sélecteur est révoqué."),
    t: (v) => (v.split(":").includes("y") ? "Mode test : les vérificateurs ne doivent pas pénaliser un échec." : v.split(":").includes("s") ? "Le domaine de signature doit correspondre exactement (pas de sous-domaine)." : `Drapeaux : ${v}.`),
    h: (v) => `Algorithmes de hachage acceptés : ${v}.`,
    s: (v) => `Type de service : ${v}.`,
    n: (v) => `Note : ${v}`,
  };
  const parts = t.map(([key, v]) => ({ token: key === "p" ? `p=${v.slice(0, 24)}…` : `${key}=${v}`, meaning: DESC[key]?.(v) ?? "Tag inconnu." }));
  if (get("v") && get("v") !== "DKIM1") notes.push({ level: "bad", text: "v= doit valoir DKIM1." });
  if (!pkey) notes.push({ level: "warn", text: "Clé publique vide : les messages signés avec ce sélecteur échoueront (révocation volontaire ?)." });
  else if (k === "rsa" && bits && bits < 1024) notes.push({ level: "bad", text: `Clé RSA d'environ ${bits} bits : trop faible, beaucoup de destinataires la rejettent.` });
  else if (k === "rsa" && bits && bits < 2048) notes.push({ level: "warn", text: `Clé RSA d'environ ${bits} bits : passez à 2048 bits.` });
  else if (k === "rsa" && bits) notes.push({ level: "ok", text: `Clé RSA d'environ ${bits} bits.` });
  else if (k === "ed25519") notes.push({ level: "info", text: "Ed25519 : moderne, mais tous les destinataires ne le vérifient pas encore ; doublez-le d'une signature RSA." });
  if ((get("t") ?? "").split(":").includes("y")) notes.push({ level: "warn", text: "t=y (mode test) : pensez à le retirer une fois la configuration validée." });
  return { parts, notes };
}

function detect(rec: string): Kind | null {
  if (/^\s*"?v=spf1/i.test(rec)) return "spf";
  if (/^\s*"?v=DMARC1/i.test(rec)) return "dmarc";
  if (/^\s*"?v=DKIM1/i.test(rec) || /\bp=[A-Za-z0-9+/]{40,}/.test(rec)) return "dkim";
  return null;
}

const ICON: Record<Level, string> = { ok: "✓", warn: "!", bad: "✗", info: "i" };

export function EmailAuthTool() {
  const [kind, setKind] = useState<Kind>("spf");
  const [domain, setDomain] = useState("exemple.fr");
  const [record, setRecord] = useState(EXAMPLES.spf);

  // Joins the quoted chunks DNS tools print for long TXT records: "abc" "def" → abcdef.
  const clean = record.trim().replace(/"\s*"/g, "").replace(/^"|"$/g, "");
  const detected = detect(clean);
  const result = useMemo(() => (kind === "spf" ? analyzeSpf(clean) : kind === "dmarc" ? analyzeDmarc(clean) : analyzeDkim(clean)), [kind, clean]);
  const lookup = kind === "spf" ? `dig +short TXT ${domain}` : kind === "dmarc" ? `dig +short TXT _dmarc.${domain}` : `dig +short TXT selecteur._domainkey.${domain}`;

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Kind>
          value={kind}
          onChange={(k) => {
            setKind(k);
            setRecord(EXAMPLES[k]);
          }}
          options={[
            { value: "spf", label: "SPF" },
            { value: "dmarc", label: "DMARC" },
            { value: "dkim", label: "DKIM" },
          ]}
        />
        <label className="check-row">
          Domaine
          <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ width: 170 }} />
        </label>
      </div>
      <div className="panel mb-md" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Enregistrement TXT</span>
          {detected && detected !== kind && (
            <button type="button" className="btn" onClick={() => setKind(detected)}>
              Ça ressemble à du {detected.toUpperCase()} : analyser comme tel
            </button>
          )}
        </div>
        <textarea value={record} onChange={(e) => setRecord(e.target.value)} spellCheck={false} style={{ minHeight: 90 }} />
        <p className="row-head hint" style={{ margin: 0 }}>
          Pour le récupérer : <code>{lookup}</code>
        </p>
      </div>

      <div className="sec-list mb-lg">
        {result.notes.map((n, i) => (
          <div className={`sec-item sec-${n.level}`} key={i}>
            <span className="sec-icon" aria-hidden="true">
              {ICON[n.level]}
            </span>
            <div className="sec-body">
              <p style={{ margin: 0 }}>{n.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="row-head">
        <h2>Décomposition</h2>
      </div>
      <div className="hash-rows">
        {result.parts.map((p, i) => (
          <div className="hash-row hash-row-2" key={i} style={{ gridTemplateColumns: "minmax(120px, 280px) 1fr" }}>
            <span className="val" style={{ color: "var(--accent)" }}>
              {p.token}
            </span>
            <span style={{ color: "var(--text-secondary)" }}>{p.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
