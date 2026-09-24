import { useMemo, useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Program = "openssl" | "ssh" | "curl";
type Field = { id: string; label: string; default: string; kind?: "text" | "select" | "check"; options?: string[] };
interface Task {
  id: string;
  label: string;
  fields: Field[];
  build: (v: Record<string, string>) => string;
  explain: string;
}

function q(s: string): string {
  return /^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`;
}

const TASKS: Record<Program, Task[]> = {
  openssl: [
    {
      id: "key-csr",
      label: "Clé privée + CSR",
      fields: [
        { id: "name", label: "Nom de fichier", default: "exemple.fr" },
        { id: "cn", label: "Common Name (CN)", default: "exemple.fr" },
        { id: "san", label: "SAN (séparés par des virgules)", default: "exemple.fr,www.exemple.fr" },
        { id: "algo", label: "Algorithme", default: "EC P-256", kind: "select", options: ["EC P-256", "RSA 2048", "RSA 4096"] },
      ],
      build: (v) => {
        const key = v.algo.startsWith("EC") ? "-newkey ec -pkeyopt ec_paramgen_curve:P-256" : `-newkey rsa:${v.algo.split(" ")[1]}`;
        const san = v.san.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (/^[\d.]+$|:/.test(s) ? `IP:${s}` : `DNS:${s}`)).join(",");
        return `openssl req -new ${key} -nodes \\\n  -keyout ${q(v.name)}.key -out ${q(v.name)}.csr \\\n  -subj ${q(`/CN=${v.cn}`)}${san ? ` \\\n  -addext ${q(`subjectAltName=${san}`)}` : ""}`;
      },
      explain: "Génère une clé privée non chiffrée (-nodes) et la demande de signature à envoyer à l'autorité de certification.",
    },
    {
      id: "self-signed",
      label: "Certificat auto-signé",
      fields: [
        { id: "name", label: "Nom de fichier", default: "localhost" },
        { id: "cn", label: "Common Name (CN)", default: "localhost" },
        { id: "san", label: "SAN", default: "localhost,127.0.0.1" },
        { id: "days", label: "Validité (jours)", default: "365" },
      ],
      build: (v) => {
        const san = v.san.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (/^[\d.]+$|:/.test(s) ? `IP:${s}` : `DNS:${s}`)).join(",");
        return `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes \\\n  -days ${v.days} -keyout ${q(v.name)}.key -out ${q(v.name)}.crt \\\n  -subj ${q(`/CN=${v.cn}`)} \\\n  -addext ${q(`subjectAltName=${san}`)}`;
      },
      explain: "Certificat de développement signé par sa propre clé. Les navigateurs exigent le SAN, pas seulement le CN.",
    },
    {
      id: "inspect-cert",
      label: "Lire un certificat",
      fields: [{ id: "file", label: "Fichier", default: "certificat.crt" }],
      build: (v) => `openssl x509 -in ${q(v.file)} -noout -text`,
      explain: "Affiche sujet, émetteur, dates de validité, SAN, extensions et empreinte.",
    },
    {
      id: "remote-cert",
      label: "Certificat d'un serveur",
      fields: [
        { id: "host", label: "Hôte", default: "exemple.fr" },
        { id: "port", label: "Port", default: "443" },
      ],
      build: (v) => `openssl s_client -connect ${q(v.host)}:${v.port} -servername ${q(v.host)} -showcerts </dev/null 2>/dev/null \\\n  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName`,
      explain: "Se connecte en TLS (avec SNI) et résume le certificat présenté : utile pour vérifier une date d'expiration.",
    },
    {
      id: "pfx",
      label: "PEM → PFX / PKCS#12",
      fields: [
        { id: "cert", label: "Certificat", default: "exemple.fr.crt" },
        { id: "key", label: "Clé privée", default: "exemple.fr.key" },
        { id: "chain", label: "Chaîne (optionnel)", default: "chaine.pem" },
        { id: "out", label: "Sortie", default: "exemple.fr.pfx" },
      ],
      build: (v) => `openssl pkcs12 -export -out ${q(v.out)} \\\n  -inkey ${q(v.key)} -in ${q(v.cert)}${v.chain ? ` -certfile ${q(v.chain)}` : ""}`,
      explain: "Regroupe certificat, clé et chaîne dans un fichier protégé par mot de passe (IIS, Azure, Java…).",
    },
    {
      id: "match",
      label: "Clé ↔ certificat correspondent ?",
      fields: [
        { id: "cert", label: "Certificat", default: "exemple.fr.crt" },
        { id: "key", label: "Clé privée", default: "exemple.fr.key" },
      ],
      build: (v) => `diff <(openssl x509 -in ${q(v.cert)} -noout -pubkey) \\\n     <(openssl pkey -in ${q(v.key)} -pubout) && echo "OK : même paire de clés"`,
      explain: "Compare les clés publiques : aucune différence = le certificat a bien été émis pour cette clé.",
    },
    {
      id: "rand",
      label: "Secret aléatoire",
      fields: [
        { id: "bytes", label: "Octets", default: "32" },
        { id: "enc", label: "Encodage", default: "base64", kind: "select", options: ["base64", "hex"] },
      ],
      build: (v) => `openssl rand -${v.enc} ${v.bytes}`,
      explain: "Octets aléatoires cryptographiques, par exemple pour une clé d'API ou un secret JWT.",
    },
  ],
  ssh: [
    {
      id: "ed25519",
      label: "Nouvelle clé ed25519",
      fields: [
        { id: "comment", label: "Commentaire", default: "moi@exemple.fr" },
        { id: "file", label: "Fichier", default: "~/.ssh/id_ed25519" },
        { id: "rounds", label: "Rounds KDF", default: "100" },
      ],
      build: (v) => `ssh-keygen -t ed25519 -a ${v.rounds} -C ${q(v.comment)} -f ${v.file}`,
      explain: "Algorithme recommandé aujourd'hui : clés courtes, rapides et sûres. -a renforce la phrase de passe.",
    },
    {
      id: "rsa",
      label: "Nouvelle clé RSA 4096",
      fields: [
        { id: "comment", label: "Commentaire", default: "moi@exemple.fr" },
        { id: "file", label: "Fichier", default: "~/.ssh/id_rsa" },
      ],
      build: (v) => `ssh-keygen -t rsa -b 4096 -C ${q(v.comment)} -f ${v.file}`,
      explain: "À réserver aux serveurs anciens qui ne gèrent pas ed25519.",
    },
    {
      id: "copy",
      label: "Installer sa clé sur un serveur",
      fields: [
        { id: "user", label: "Utilisateur", default: "deploy" },
        { id: "host", label: "Hôte", default: "serveur.exemple.fr" },
        { id: "file", label: "Clé publique", default: "~/.ssh/id_ed25519.pub" },
        { id: "port", label: "Port", default: "22" },
      ],
      build: (v) => `ssh-copy-id -i ${v.file}${v.port !== "22" ? ` -p ${v.port}` : ""} ${q(`${v.user}@${v.host}`)}`,
      explain: "Ajoute la clé publique à ~/.ssh/authorized_keys sur le serveur, avec les bonnes permissions.",
    },
    {
      id: "fingerprint",
      label: "Empreinte d'une clé",
      fields: [{ id: "file", label: "Clé publique", default: "~/.ssh/id_ed25519.pub" }],
      build: (v) => `ssh-keygen -lf ${v.file}`,
      explain: "Affiche l'empreinte SHA256 à comparer avec celle affichée par GitHub, GitLab ou le serveur.",
    },
    {
      id: "passphrase",
      label: "Changer la phrase de passe",
      fields: [{ id: "file", label: "Clé privée", default: "~/.ssh/id_ed25519" }],
      build: (v) => `ssh-keygen -p -f ${v.file}`,
      explain: "Modifie (ou ajoute) la phrase de passe sans changer la clé.",
    },
    {
      id: "tunnel",
      label: "Tunnel (redirection de port)",
      fields: [
        { id: "local", label: "Port local", default: "5433" },
        { id: "target", label: "Cible vue du serveur", default: "localhost:5432" },
        { id: "user", label: "Utilisateur", default: "deploy" },
        { id: "host", label: "Serveur rebond", default: "bastion.exemple.fr" },
      ],
      build: (v) => `ssh -N -L ${v.local}:${v.target} ${q(`${v.user}@${v.host}`)}`,
      explain: "Rend un service distant (ex. PostgreSQL) accessible sur localhost:port local, via le serveur.",
    },
    {
      id: "jump",
      label: "Passer par un bastion",
      fields: [
        { id: "bastion", label: "Bastion", default: "admin@bastion.exemple.fr" },
        { id: "target", label: "Cible", default: "admin@10.0.1.20" },
      ],
      build: (v) => `ssh -J ${q(v.bastion)} ${q(v.target)}`,
      explain: "Connexion à une machine privée en rebondissant par un bastion (ProxyJump).",
    },
  ],
  curl: [
    {
      id: "json-post",
      label: "POST JSON",
      fields: [
        { id: "url", label: "URL", default: "https://api.exemple.fr/v1/users" },
        { id: "body", label: "Corps JSON", default: '{"name":"Djamel","role":"admin"}' },
        { id: "token", label: "Jeton Bearer (optionnel)", default: "" },
      ],
      build: (v) => `curl -sS -X POST ${q(v.url)} \\\n  -H 'Content-Type: application/json'${v.token ? ` \\\n  -H ${q(`Authorization: Bearer ${v.token}`)}` : ""} \\\n  -d ${q(v.body)}`,
      explain: "Envoie un corps JSON. -sS cache la barre de progression mais garde les erreurs.",
    },
    {
      id: "headers",
      label: "Voir les en-têtes",
      fields: [{ id: "url", label: "URL", default: "https://exemple.fr" }],
      build: (v) => `curl -sSIL ${q(v.url)}`,
      explain: "HEAD en suivant les redirections (-L) : pratique pour vérifier cache, HSTS, redirections…",
    },
    {
      id: "timing",
      label: "Mesurer les temps",
      fields: [{ id: "url", label: "URL", default: "https://exemple.fr" }],
      build: (v) => `curl -o /dev/null -sS -w 'DNS %{time_namelookup}s\\nConnexion %{time_connect}s\\nTLS %{time_appconnect}s\\nPremier octet %{time_starttransfer}s\\nTotal %{time_total}s\\nHTTP %{http_code}\\n' ${q(v.url)}`,
      explain: "Détaille où passe le temps : résolution DNS, connexion TCP, poignée de main TLS, réponse du serveur.",
    },
    {
      id: "upload",
      label: "Envoyer un fichier",
      fields: [
        { id: "url", label: "URL", default: "https://api.exemple.fr/upload" },
        { id: "file", label: "Fichier", default: "rapport.pdf" },
        { id: "field", label: "Nom du champ", default: "file" },
      ],
      build: (v) => `curl -sS -F ${q(`${v.field}=@${v.file}`)} ${q(v.url)}`,
      explain: "Formulaire multipart/form-data, comme un <input type=file>.",
    },
    {
      id: "download",
      label: "Télécharger avec reprise",
      fields: [{ id: "url", label: "URL", default: "https://exemple.fr/image.iso" }],
      build: (v) => `curl -L -C - -O --retry 3 ${q(v.url)}`,
      explain: "Reprend un téléchargement interrompu (-C -) et garde le nom distant (-O).",
    },
    {
      id: "resolve",
      label: "Tester un serveur sans DNS",
      fields: [
        { id: "host", label: "Domaine", default: "exemple.fr" },
        { id: "ip", label: "IP du nouveau serveur", default: "203.0.113.10" },
      ],
      build: (v) => `curl -sSI --resolve ${q(`${v.host}:443:${v.ip}`)} ${q(`https://${v.host}/`)}`,
      explain: "Force le domaine vers une IP précise, avec le bon SNI et le bon certificat : idéal avant une migration DNS.",
    },
  ],
};

export function CliBuilderTool() {
  const [program, setProgram] = useState<Program>("openssl");
  const [taskId, setTaskId] = useState(TASKS.openssl[0].id);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const task = TASKS[program].find((t) => t.id === taskId) ?? TASKS[program][0];
  const v = useMemo(() => Object.fromEntries(task.fields.map((f) => [f.id, values[task.id]?.[f.id] ?? f.default])), [task, values]);
  const command = task.build(v);

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Program>
          value={program}
          onChange={(p) => {
            setProgram(p);
            setTaskId(TASKS[p][0].id);
          }}
          options={[
            { value: "openssl", label: "openssl" },
            { value: "ssh", label: "ssh / ssh-keygen" },
            { value: "curl", label: "curl" },
          ]}
        />
      </div>
      <div className="emoji-groups mb-lg">
        {TASKS[program].map((t) => (
          <button key={t.id} type="button" className={"btn" + (t.id === task.id ? " is-active" : "")} onClick={() => setTaskId(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="field-row">
        {task.fields.map((f) => (
          <div className="field" key={f.id}>
            <span className="field-label">{f.label}</span>
            {f.kind === "select" ? (
              <select className="input" value={v[f.id]} onChange={(e) => setValues((s) => ({ ...s, [task.id]: { ...s[task.id], [f.id]: e.target.value } }))}>
                {f.options!.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input className="input" value={v[f.id]} onChange={(e) => setValues((s) => ({ ...s, [task.id]: { ...s[task.id], [f.id]: e.target.value } }))} spellCheck={false} />
            )}
          </div>
        ))}
      </div>
      <div className="panel" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Commande</span>
        </div>
        <pre className="cli-command">{command}</pre>
        <p className="row-head hint" style={{ margin: 0 }}>
          {task.explain}
        </p>
        <div className="panel-tools">
          <CopyButton getText={() => command} />
        </div>
      </div>
    </div>
  );
}
