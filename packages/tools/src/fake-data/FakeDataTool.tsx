import { useMemo, useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";
import { JsonTree } from "../shared/JsonTree";
import { CodeView, StructuredOutput } from "../shared/CodeView";

type Kind =
  | "id" | "uuid" | "firstName" | "lastName" | "fullName" | "email" | "username" | "phone" | "street" | "city" | "zip" | "country"
  | "company" | "job" | "iban" | "ipv4" | "ipv6" | "mac" | "url" | "color" | "date" | "datetime" | "int" | "float" | "bool" | "sentence" | "status";
type Output = "json" | "csv" | "sql" | "ndjson";

const KINDS: { id: Kind; label: string }[] = [
  { id: "id", label: "ID auto-incrément" }, { id: "uuid", label: "UUID v4" }, { id: "firstName", label: "Prénom" }, { id: "lastName", label: "Nom" },
  { id: "fullName", label: "Nom complet" }, { id: "email", label: "Email" }, { id: "username", label: "Identifiant" }, { id: "phone", label: "Téléphone (FR)" },
  { id: "street", label: "Adresse" }, { id: "city", label: "Ville" }, { id: "zip", label: "Code postal" }, { id: "country", label: "Pays" },
  { id: "company", label: "Entreprise" }, { id: "job", label: "Poste" }, { id: "iban", label: "IBAN FR (valide)" }, { id: "ipv4", label: "IPv4" },
  { id: "ipv6", label: "IPv6" }, { id: "mac", label: "Adresse MAC" }, { id: "url", label: "URL" }, { id: "color", label: "Couleur hex" },
  { id: "date", label: "Date" }, { id: "datetime", label: "Date et heure ISO" }, { id: "int", label: "Entier (1–1000)" }, { id: "float", label: "Décimal (prix)" },
  { id: "bool", label: "Booléen" }, { id: "sentence", label: "Phrase" }, { id: "status", label: "Statut" },
];

const FIRST = ["Camille", "Léa", "Manon", "Chloé", "Inès", "Sarah", "Emma", "Jade", "Yasmine", "Nora", "Lucas", "Hugo", "Louis", "Nathan", "Adam", "Karim", "Mehdi", "Thomas", "Julien", "Antoine", "Sofia", "Amir", "Lina", "Rayan", "Élise", "Mathis", "Zoé", "Ethan", "Aïcha", "Théo"];
const LAST = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "Benali", "Nguyen", "Haddad", "Rossi", "Lopez", "Mercier", "Blanc", "Faure"];
const CITIES: [string, string][] = [["Paris", "75"], ["Lyon", "69"], ["Marseille", "13"], ["Toulouse", "31"], ["Nantes", "44"], ["Bordeaux", "33"], ["Lille", "59"], ["Strasbourg", "67"], ["Montpellier", "34"], ["Rennes", "35"], ["Nice", "06"], ["Grenoble", "38"], ["Dijon", "21"], ["Angers", "49"], ["Tours", "37"]];
const STREETS = ["rue de la République", "avenue Jean Jaurès", "boulevard Victor Hugo", "rue du Moulin", "place de la Mairie", "rue Pasteur", "allée des Tilleuls", "chemin des Vignes", "rue Voltaire", "impasse des Lilas"];
const COUNTRIES = ["France", "Belgique", "Suisse", "Canada", "Maroc", "Espagne", "Allemagne", "Italie", "Portugal", "Luxembourg"];
const COMPANY_A = ["Nova", "Axion", "Blue", "Hexa", "Opti", "Data", "Cloud", "Neo", "Quantum", "Pixel", "Alpha", "Terra"];
const COMPANY_B = ["Systems", "Labs", "Solutions", "Tech", "Conseil", "Digital", "Services", "Logiciels", "Réseaux", "Studio"];
const JOBS = ["Développeuse backend", "Ingénieur DevOps", "Administrateur système", "Cheffe de projet", "Architecte cloud", "Data engineer", "Analyste sécurité", "Développeur front-end", "SRE", "Product owner", "Technicien support", "DBA"];
const WORDS = "le serveur répond rapidement mais la base de données reste lente pendant les sauvegardes nocturnes du week-end et les journaux montrent plusieurs erreurs de connexion au cluster principal".split(" ");
const STATUSES = ["actif", "inactif", "en attente", "suspendu", "archivé"];
const DOMAINS = ["example.com", "example.org", "example.net", "mail.test", "corp.example"];

function rand(n: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % n;
}
const pick = <T,>(a: T[]) => a[rand(a.length)];
const digits = (n: number) => Array.from({ length: n }, () => rand(10)).join("");
const slug = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

function iban(): string {
  const bban = digits(5) + digits(5) + digits(11) + digits(2);
  const numeric = (bban + "FR00").replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const d of numeric) rem = (rem * 10 + Number(d)) % 97;
  return `FR${String(98 - rem).padStart(2, "0")}${bban}`;
}

type Row = Record<string, string | number | boolean>;
function makeRow(fields: { name: string; kind: Kind }[], i: number): Row {
  const first = pick(FIRST);
  const last = pick(LAST);
  const [city, dept] = pick(CITIES);
  const row: Row = {};
  for (const f of fields) {
    let v: string | number | boolean;
    switch (f.kind) {
      case "id": v = i + 1; break;
      case "uuid": v = crypto.randomUUID(); break;
      case "firstName": v = first; break;
      case "lastName": v = last; break;
      case "fullName": v = `${first} ${last}`; break;
      case "email": v = `${slug(first)}.${slug(last)}${rand(3) ? "" : rand(99)}@${pick(DOMAINS)}`; break;
      case "username": v = `${slug(first).slice(0, 1)}${slug(last)}${rand(100)}`; break;
      case "phone": v = `+33 ${pick(["6", "7"])} ${digits(2)} ${digits(2)} ${digits(2)} ${digits(2)}`; break;
      case "street": v = `${1 + rand(180)} ${pick(STREETS)}`; break;
      case "city": v = city; break;
      case "zip": v = `${dept}${digits(3)}`; break;
      case "country": v = pick(COUNTRIES); break;
      case "company": v = `${pick(COMPANY_A)}${pick(COMPANY_B)}`; break;
      case "job": v = pick(JOBS); break;
      case "iban": v = iban(); break;
      case "ipv4": v = `${10 + rand(180)}.${rand(256)}.${rand(256)}.${1 + rand(254)}`; break;
      case "ipv6": v = ["2001", "db8", ...Array.from({ length: 6 }, () => rand(65536).toString(16))].join(":"); break;
      case "mac": v = Array.from({ length: 6 }, (_, k) => (k === 0 ? (rand(64) * 4) | 2 : rand(256)).toString(16).padStart(2, "0")).join(":"); break;
      case "url": v = `https://${slug(pick(COMPANY_A))}.${pick(DOMAINS)}/${pick(["docs", "blog", "api", "shop", "app"])}`; break;
      case "color": v = `#${rand(0xffffff).toString(16).padStart(6, "0")}`; break;
      case "date": v = new Date(Date.now() - rand(3 * 365 * 86400) * 1000).toISOString().slice(0, 10); break;
      case "datetime": v = new Date(Date.now() - rand(3 * 365 * 86400) * 1000).toISOString().replace(/\.\d+Z$/, "Z"); break;
      case "int": v = 1 + rand(1000); break;
      case "float": v = (1 + rand(50000)) / 100; break;
      case "bool": v = rand(2) === 1; break;
      case "sentence": {
        const n = 6 + rand(8);
        const start = rand(WORDS.length - n);
        const s = WORDS.slice(start, start + n).join(" ");
        v = s[0].toUpperCase() + s.slice(1) + ".";
        break;
      }
      case "status": v = pick(STATUSES); break;
    }
    row[f.name] = v;
  }
  return row;
}

function sqlValue(v: string | number | boolean): string {
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return `'${v.replace(/'/g, "''")}'`;
}

function csvCell(v: string | number | boolean): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const DEFAULT_FIELDS: { name: string; kind: Kind }[] = [
  { name: "id", kind: "id" },
  { name: "prenom", kind: "firstName" },
  { name: "nom", kind: "lastName" },
  { name: "email", kind: "email" },
  { name: "telephone", kind: "phone" },
  { name: "ville", kind: "city" },
  { name: "poste", kind: "job" },
  { name: "actif", kind: "bool" },
  { name: "cree_le", kind: "datetime" },
];

export function FakeDataTool() {
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [count, setCount] = useState(10);
  const [output, setOutput] = useState<Output>("json");
  const [table, setTable] = useState("utilisateurs");
  const [seed, setSeed] = useState(0);

  const rows = useMemo(() => Array.from({ length: Math.min(5000, Math.max(1, count)) }, (_, i) => makeRow(fields, i)), [fields, count, seed]);

  const text = useMemo(() => {
    if (output === "json") return JSON.stringify(rows, null, 2);
    if (output === "ndjson") return rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
    const cols = fields.map((f) => f.name);
    if (output === "csv") return [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n";
    const quote = (c: string) => (/^[a-z_][a-z0-9_]*$/.test(c) ? c : `"${c}"`);
    return `INSERT INTO ${quote(table)} (${cols.map(quote).join(", ")}) VALUES\n` + rows.map((r) => `  (${cols.map((c) => sqlValue(r[c])).join(", ")})`).join(",\n") + ";\n";
  }, [rows, output, fields, table]);

  const update = (i: number, patch: Partial<{ name: string; kind: Kind }>) => setFields((fs) => fs.map((f, k) => (k === i ? { ...f, ...patch } : f)));

  function download() {
    const ext = output === "ndjson" ? "ndjson" : output;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `donnees.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div>
      <div className="panel mb-lg" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Champs</span>
          <span className="meta">{fields.length}</span>
        </div>
        <div className="fake-fields">
          {fields.map((f, i) => (
            <div className="fake-field" key={i}>
              <input className="input" value={f.name} onChange={(e) => update(i, { name: e.target.value })} aria-label="Nom de la colonne" />
              <select className="input" value={f.kind} onChange={(e) => update(i, { kind: e.target.value as Kind })} aria-label="Type de donnée">
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
              <button type="button" className="icon-btn" aria-label={`Retirer ${f.name}`} onClick={() => setFields((fs) => fs.filter((_, k) => k !== i))}>
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="panel-tools">
          <button type="button" className="btn" onClick={() => setFields((fs) => [...fs, { name: `champ_${fs.length + 1}`, kind: "sentence" }])}>
            + Ajouter un champ
          </button>
        </div>
      </div>

      <div className="panel-tools mb-md">
        <label className="check-row">
          Lignes
          <input className="input" type="number" min={1} max={5000} value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ width: 90 }} />
        </label>
        <SegmentedControl<Output>
          value={output}
          onChange={setOutput}
          options={[
            { value: "json", label: "JSON" },
            { value: "ndjson", label: "NDJSON" },
            { value: "csv", label: "CSV" },
            { value: "sql", label: "SQL INSERT" },
          ]}
        />
        {output === "sql" && (
          <label className="check-row">
            Table
            <input className="input" value={table} onChange={(e) => setTable(e.target.value)} style={{ width: 140 }} />
          </label>
        )}
        <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>
          ↻ Régénérer
        </button>
      </div>

      <div className="panel" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Résultat</span>
          <span className="meta">
            {rows.length} ligne{rows.length > 1 ? "s" : ""} · {text.length.toLocaleString("fr-FR")} car.
          </span>
        </div>
        {output === "json" ? (
          <StructuredOutput text={text} language="json" tree={<JsonTree data={rows} defaultDepth={1} />} />
        ) : (
          <CodeView code={text} language={output === "sql" ? "sql" : output === "csv" ? "csv" : "json"} />
        )}
        <div className="panel-tools">
          <CopyButton getText={() => text} />
          <button type="button" className="btn" onClick={download}>
            Télécharger
          </button>
        </div>
      </div>
      <p className="row-head hint" style={{ margin: "0.85rem 0 0" }}>
        Données fictives : les domaines email sont réservés aux tests (example.com, .test…) et les IBAN, bien que valides, ne correspondent à aucun compte.
      </p>
    </div>
  );
}
