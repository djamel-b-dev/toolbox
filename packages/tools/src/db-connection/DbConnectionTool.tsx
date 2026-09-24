import { useMemo, useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Engine = "postgres" | "mysql" | "sqlserver" | "oracle" | "mongodb" | "redis" | "sqlite";
type Ssl = "disable" | "prefer" | "require" | "verify-full";

interface Conn {
  engine: Engine;
  hosts: { host: string; port: string }[];
  user: string;
  password: string;
  database: string;
  ssl: Ssl;
  srv: boolean;
  params: [string, string][];
}

const ENGINES: { id: Engine; label: string; port: string; dbLabel: string }[] = [
  { id: "postgres", label: "PostgreSQL", port: "5432", dbLabel: "Base" },
  { id: "mysql", label: "MySQL / MariaDB", port: "3306", dbLabel: "Base" },
  { id: "sqlserver", label: "SQL Server", port: "1433", dbLabel: "Base" },
  { id: "oracle", label: "Oracle", port: "1521", dbLabel: "Service" },
  { id: "mongodb", label: "MongoDB", port: "27017", dbLabel: "Base" },
  { id: "redis", label: "Redis", port: "6379", dbLabel: "N° de base" },
  { id: "sqlite", label: "SQLite", port: "", dbLabel: "Fichier" },
];
const defPort = (e: Engine) => ENGINES.find((x) => x.id === e)!.port;

const DEFAULT: Conn = { engine: "postgres", hosts: [{ host: "db.exemple.fr", port: "5432" }], user: "app", password: "p@ss:w/rd#2026", database: "production", ssl: "require", srv: false, params: [["application_name", "toolbox"]] };

// ---------- parsing ----------
function engineFromScheme(s: string): Engine | null {
  const x = s.toLowerCase().replace(/^jdbc:/, "").replace(/\+.*$/, "");
  if (/^postgres(ql)?$|^pgsql$|^psql$/.test(x)) return "postgres";
  if (/^mysql$|^mariadb$|^mysqlx$/.test(x)) return "mysql";
  if (/^sqlserver$|^mssql$|^jtds$/.test(x)) return "sqlserver";
  if (/^oracle$/.test(x)) return "oracle";
  if (/^mongodb$/.test(x)) return "mongodb";
  if (/^rediss?$/.test(x)) return "redis";
  if (/^sqlite3?$/.test(x)) return "sqlite";
  return null;
}

const dec = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

function sslFrom(params: [string, string][], scheme = ""): Ssl {
  const get = (k: string) => params.find(([n]) => n.toLowerCase() === k)?.[1]?.toLowerCase();
  if (/^rediss/i.test(scheme)) return "require";
  const mode = get("sslmode") ?? get("ssl-mode") ?? get("ssl mode");
  if (mode) return mode.startsWith("verify") ? "verify-full" : mode === "disable" || mode === "disabled" ? "disable" : mode === "prefer" || mode === "preferred" ? "prefer" : "require";
  if (get("tls") === "true" || get("ssl") === "true" || get("encrypt") === "true" || get("usessl") === "true") return "require";
  if (get("tls") === "false" || get("ssl") === "false" || get("encrypt") === "false") return "disable";
  return "prefer";
}

const SSL_KEYS = /^(sslmode|ssl-mode|ssl mode|ssl|tls|encrypt|usessl|requiressl)$/i;

function parse(input: string): Conn {
  // Accept a pasted env line (DATABASE_URL="…"), but only strip quotes that really wrap the value.
  const s = input.trim().replace(/^[A-Z_][A-Z0-9_]*=(["']?)(.*)\1$/s, "$2");
  // Oracle EZConnect: user/pass@//host:port/service  or  user/pass@host:port/service
  const ez = s.includes("://") ? null : s.match(/^([^/@\s]+)\/([^@\s]*)@\/?\/?([^:/\s]+)(?::(\d+))?\/(\S+)$/);
  if (ez) return { engine: "oracle", hosts: [{ host: ez[3], port: ez[4] ?? "1521" }], user: ez[1], password: ez[2], database: ez[5], ssl: "prefer", srv: false, params: [] };
  // JDBC SQL Server: jdbc:sqlserver://host:1433;databaseName=x;user=y;password=z
  const jss = s.match(/^jdbc:sqlserver:\/\/([^;:]+)(?::(\d+))?;?(.*)$/i);
  if (jss) {
    const kv = jss[3].split(";").filter(Boolean).map((p) => p.split("=") as [string, string]);
    const get = (k: string) => kv.find(([n]) => n.toLowerCase() === k)?.[1] ?? "";
    return { engine: "sqlserver", hosts: [{ host: jss[1], port: jss[2] ?? "1433" }], user: get("user"), password: get("password"), database: get("databasename") || get("database"), ssl: sslFrom(kv), srv: false, params: kv.filter(([k]) => !/^(user|password|databasename|database)$/i.test(k) && !SSL_KEYS.test(k)) };
  }
  // JDBC Oracle thin: jdbc:oracle:thin:@//host:port/service  or  @host:port:SID
  const jora = s.match(/^jdbc:oracle:thin:(?:([^/@]+)\/([^@]*))?@\/?\/?([^:/]+)(?::(\d+))?[/:](.+)$/i);
  if (jora) return { engine: "oracle", hosts: [{ host: jora[3], port: jora[4] ?? "1521" }], user: jora[1] ?? "", password: jora[2] ?? "", database: jora[5], ssl: "prefer", srv: false, params: [] };
  // URI (optionally jdbc: prefixed), including multi-host MongoDB lists.
  const uri = s.match(/^(?:jdbc:)?([a-z][\w+.-]*):\/\/(?:([^:@/]*)(?::([^@]*))?@)?([^/?]*)(?:\/([^?]*))?(?:\?(.*))?$/i);
  if (uri) {
    const engine = engineFromScheme(uri[1]);
    if (!engine) throw new Error(`Schéma « ${uri[1]} » non reconnu.`);
    const params = (uri[6] ?? "").split("&").filter(Boolean).map((p) => {
      const i = p.indexOf("=");
      return [dec(i < 0 ? p : p.slice(0, i)), dec(i < 0 ? "" : p.slice(i + 1))] as [string, string];
    });
    const hosts = uri[4]
      .split(",")
      .filter(Boolean)
      .map((h) => {
        const m = h.match(/^\[?([^\]]+?)\]?(?::(\d+))?$/)!;
        return { host: dec(m[1]), port: m[2] ?? (/\+srv/i.test(uri[1]) ? "" : defPort(engine)) };
      });
    const user = dec(uri[2] ?? "") || (params.find(([k]) => k.toLowerCase() === "user")?.[1] ?? "");
    const password = dec(uri[3] ?? "") || (params.find(([k]) => k.toLowerCase() === "password")?.[1] ?? "");
    return {
      engine,
      hosts: engine === "sqlite" ? [] : hosts.length ? hosts : [{ host: "localhost", port: defPort(engine) }],
      user,
      password,
      // SQLite URLs: three slashes = relative path (sqlite:///data/app.db), four = absolute (sqlite:////var/app.db).
      database: engine === "sqlite" ? dec(uri[4] ? `${uri[4]}/${uri[5] ?? ""}` : (uri[5] ?? "")) : dec(uri[5] ?? ""),
      ssl: sslFrom(params, uri[1]),
      srv: /\+srv/i.test(uri[1]),
      params: params.filter(([k]) => !/^(user|password)$/i.test(k) && !SSL_KEYS.test(k)),
    };
  }
  if (/^jdbc:sqlite:/i.test(s)) return { ...DEFAULT, engine: "sqlite", hosts: [], user: "", password: "", database: s.replace(/^jdbc:sqlite:/i, ""), ssl: "disable", params: [] };
  // key=value;key=value (ADO.NET) or key=value key=value (libpq)
  if (/=/.test(s)) {
    const semi = s.includes(";");
    const kv: [string, string][] = semi
      ? // ADO.NET: values may be quoted with "…", '…' or {…} (ODBC) to contain ";" — doubled quotes escape.
        [...s.matchAll(/\s*([^=;]+?)\s*=\s*("(?:[^"]|"")*"|'(?:[^']|'')*'|\{(?:[^}]|\}\})*\}|[^;]*)\s*(?:;|$)/g)]
          .filter((m) => m[1])
          .map((m) => {
            const v = m[2].trim();
            const unq = /^".*"$/s.test(v) ? v.slice(1, -1).replace(/""/g, '"') : /^'.*'$/s.test(v) ? v.slice(1, -1).replace(/''/g, "'") : /^\{.*\}$/s.test(v) ? v.slice(1, -1).replace(/\}\}/g, "}") : v;
            return [m[1].trim(), unq] as [string, string];
          })
      : [...s.matchAll(/(\w+)\s*=\s*('(?:[^'\\]|\\.)*'|\S+)/g)].map((m) => [m[1], m[2].replace(/^'|'$/g, "").replace(/\\'/g, "'")]);
    const get = (...keys: string[]) => kv.find(([k]) => keys.includes(k.toLowerCase().replace(/\s/g, "")))?.[1] ?? "";
    let host = get("server", "host", "datasource", "address", "addr", "networkaddress", "hostaddr");
    let port = get("port");
    host = host.replace(/^tcp:/i, "");
    const comma = host.match(/^(.+?),(\d+)$/);
    if (comma) [host, port] = [comma[1], comma[2]];
    const hp = host.match(/^([^:]+):(\d+)$/);
    if (hp) [host, port] = [hp[1], hp[2]];
    const isPg = !semi || /username|sslmode|ssl mode|search path/i.test(s) || /^host=/i.test(s);
    const isMysql = /uid=|pwd=|sslmode=required/i.test(s) && !/initial catalog|trusted_connection|encrypt=/i.test(s);
    const engine: Engine = isPg && !/initial catalog|encrypt=/i.test(s) ? "postgres" : isMysql ? "mysql" : /\.db$|\.sqlite3?$/i.test(host) ? "sqlite" : "sqlserver";
    const known = /^(server|host|datasource|data source|address|addr|port|database|dbname|initialcatalog|initial catalog|user|userid|user id|uid|username|password|pwd)$/i;
    return {
      engine,
      hosts: engine === "sqlite" ? [] : [{ host: host || "localhost", port: port || defPort(engine) }],
      user: get("userid", "user", "uid", "username"),
      password: get("password", "pwd"),
      database: engine === "sqlite" ? host : get("database", "dbname", "initialcatalog"),
      ssl: sslFrom(kv),
      srv: false,
      params: kv.filter(([k]) => !known.test(k.trim()) && !SSL_KEYS.test(k.trim())),
    };
  }
  throw new Error("Format non reconnu : essayez une URI (postgres://…), JDBC, ADO.NET (Server=…;) ou libpq (host=… dbname=…).");
}

// ---------- rendering ----------
const enc = (s: string) => encodeURIComponent(s);
const hostList = (c: Conn, withPort = true) => c.hosts.map((h) => (h.host.includes(":") && !h.host.startsWith("[") ? `[${h.host}]` : h.host) + (withPort && h.port ? `:${h.port}` : "")).join(",");
const first = (c: Conn) => c.hosts[0] ?? { host: "localhost", port: defPort(c.engine) };
const query = (pairs: [string, string][]) => (pairs.length ? "?" + pairs.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&") : "");
const auth = (c: Conn, pwd: string) => (c.user || pwd ? `${enc(c.user)}${pwd ? ":" + enc(pwd) : ""}@` : "");

function formats(c: Conn, pwd: string): { id: string; label: string; value: string; note?: string }[] {
  const h = first(c);
  const p = c.params;
  const out: { id: string; label: string; value: string; note?: string }[] = [];
  const kvQuote = (v: string) => (/[\s'\\]/.test(v) || v === "" ? `'${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'` : v);
  const adoQuote = (v: string) => (/[;'"=]/.test(v) || /^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  switch (c.engine) {
    case "postgres": {
      const ssl: [string, string][] = c.ssl === "prefer" ? [] : [["sslmode", c.ssl]];
      const uri = `postgresql://${auth(c, pwd)}${hostList(c)}/${enc(c.database)}${query([...ssl, ...p])}`;
      out.push({ id: "uri", label: "URI (libpq, psql, Prisma, Heroku, DATABASE_URL)", value: uri });
      out.push({ id: "kv", label: "Mots-clés libpq (psql, pg_dump)", value: [["host", c.hosts.map((x) => x.host).join(",")], ["port", c.hosts.map((x) => x.port).join(",")], ["dbname", c.database], ["user", c.user], ["password", pwd], ...ssl, ...p].filter(([, v]) => v !== "").map(([k, v]) => `${k}=${kvQuote(v)}`).join(" ") });
      out.push({ id: "jdbc", label: "JDBC", value: `jdbc:postgresql://${hostList(c)}/${enc(c.database)}${query(([["user", c.user], ["password", pwd], ...(c.ssl === "prefer" ? [] : [["sslmode", c.ssl]]), ...p] as [string, string][]).filter(([, v]) => v !== ""))}` });
      out.push({ id: "npgsql", label: "ADO.NET (Npgsql)", value: [["Host", c.hosts.map((x) => x.host).join(",")], ["Port", h.port], ["Database", c.database], ["Username", c.user], ["Password", pwd], ["SSL Mode", { disable: "Disable", prefer: "Prefer", require: "Require", "verify-full": "VerifyFull" }[c.ssl]]].filter(([, v]) => v).map(([k, v]) => `${k}=${adoQuote(v!)}`).join(";") + ";" });
      out.push({ id: "sqlalchemy", label: "SQLAlchemy / Django (dj-database-url)", value: uri.replace(/^postgresql:/, "postgresql+psycopg:") });
      out.push({ id: "docker", label: "Variables de l'image Docker officielle", value: `POSTGRES_USER=${c.user}\nPOSTGRES_PASSWORD=${pwd}\nPOSTGRES_DB=${c.database}` });
      out.push({ id: "spring", label: "Spring Boot (application.properties)", value: `spring.datasource.url=jdbc:postgresql://${hostList(c)}/${c.database}${c.ssl !== "prefer" ? `?sslmode=${c.ssl}` : ""}\nspring.datasource.username=${c.user}\nspring.datasource.password=${pwd}` });
      out.push({ id: "laravel", label: "Laravel (.env)", value: `DB_CONNECTION=pgsql\nDB_HOST=${h.host}\nDB_PORT=${h.port}\nDB_DATABASE=${c.database}\nDB_USERNAME=${c.user}\nDB_PASSWORD=${pwd}` });
      out.push({ id: "cli", label: "Ligne de commande", value: `PGPASSWORD=${kvQuote(pwd)} psql -h ${h.host} -p ${h.port} -U ${c.user} -d ${c.database}` });
      break;
    }
    case "mysql": {
      const ssl: [string, string][] = c.ssl === "prefer" ? [] : [["ssl-mode", { disable: "DISABLED", prefer: "PREFERRED", require: "REQUIRED", "verify-full": "VERIFY_IDENTITY" }[c.ssl]]];
      out.push({ id: "uri", label: "URI (mysql2, Prisma, DATABASE_URL)", value: `mysql://${auth(c, pwd)}${hostList(c)}/${enc(c.database)}${query([...ssl, ...p])}` });
      out.push({ id: "jdbc", label: "JDBC (Connector/J)", value: `jdbc:mysql://${hostList(c)}/${enc(c.database)}${query(([["user", c.user], ["password", pwd], ...(c.ssl === "prefer" ? [] : [["sslMode", ssl[0][1]]]), ...p] as [string, string][]).filter(([, v]) => v !== ""))}` });
      out.push({ id: "ado", label: "ADO.NET (MySqlConnector)", value: [["Server", h.host], ["Port", h.port], ["Database", c.database], ["User ID", c.user], ["Password", pwd], ["SslMode", { disable: "None", prefer: "Preferred", require: "Required", "verify-full": "VerifyFull" }[c.ssl]]].filter(([, v]) => v).map(([k, v]) => `${k}=${adoQuote(v!)}`).join(";") + ";" });
      out.push({ id: "pdo", label: "PHP PDO (DSN)", value: `mysql:host=${h.host};port=${h.port};dbname=${c.database};charset=utf8mb4`, note: "Utilisateur et mot de passe se passent en 2ᵉ et 3ᵉ arguments de new PDO()." });
      out.push({ id: "sqlalchemy", label: "SQLAlchemy / Django", value: `mysql+pymysql://${auth(c, pwd)}${hostList(c)}/${enc(c.database)}${query([["charset", "utf8mb4"], ...p])}` });
      out.push({ id: "docker", label: "Variables de l'image Docker officielle", value: `MYSQL_USER=${c.user}\nMYSQL_PASSWORD=${pwd}\nMYSQL_DATABASE=${c.database}` });
      out.push({ id: "laravel", label: "Laravel (.env)", value: `DB_CONNECTION=mysql\nDB_HOST=${h.host}\nDB_PORT=${h.port}\nDB_DATABASE=${c.database}\nDB_USERNAME=${c.user}\nDB_PASSWORD=${pwd}` });
      out.push({ id: "cli", label: "Ligne de commande", value: `mysql -h ${h.host} -P ${h.port} -u ${c.user} -p ${c.database}`, note: "-p sans valeur : le mot de passe est demandé, il n'apparaît pas dans l'historique du shell." });
      break;
    }
    case "sqlserver": {
      const encrypt = c.ssl === "disable" ? "False" : "True";
      const trust = c.ssl === "verify-full" ? "False" : c.ssl === "disable" ? "" : "True";
      out.push({ id: "ado", label: "ADO.NET (Microsoft.Data.SqlClient)", value: [["Server", `tcp:${h.host},${h.port}`], ["Database", c.database], ["User Id", c.user], ["Password", pwd], ["Encrypt", encrypt], ["TrustServerCertificate", trust], ...p].filter(([, v]) => v).map(([k, v]) => `${k}=${adoQuote(v)}`).join(";") + ";", note: trust === "True" ? "TrustServerCertificate=True accepte un certificat non vérifié : à réserver au dev." : undefined });
      out.push({ id: "jdbc", label: "JDBC (mssql-jdbc)", value: `jdbc:sqlserver://${h.host}:${h.port};databaseName=${c.database};user=${c.user};password={${pwd.replace(/}/g, "}}")}};encrypt=${encrypt.toLowerCase()}${trust ? `;trustServerCertificate=${trust.toLowerCase()}` : ""}` });
      out.push({ id: "uri", label: "URI (Prisma, node-mssql)", value: `sqlserver://${h.host}:${h.port};database=${c.database};user=${c.user};password={${pwd}};encrypt=${encrypt.toLowerCase()}${trust ? `;trustServerCertificate=${trust.toLowerCase()}` : ""}` });
      out.push({ id: "odbc", label: "ODBC", value: `Driver={ODBC Driver 18 for SQL Server};Server=tcp:${h.host},${h.port};Database=${c.database};Uid=${c.user};Pwd={${pwd.replace(/}/g, "}}")}};Encrypt=${encrypt === "True" ? "yes" : "no"};TrustServerCertificate=${trust === "True" ? "yes" : "no"};` });
      out.push({ id: "sqlalchemy", label: "SQLAlchemy", value: `mssql+pyodbc://${auth(c, pwd)}${h.host}:${h.port}/${enc(c.database)}?driver=ODBC+Driver+18+for+SQL+Server${c.ssl === "disable" ? "&Encrypt=no" : ""}` });
      out.push({ id: "docker", label: "Variables de l'image Docker officielle", value: `ACCEPT_EULA=Y\nMSSQL_SA_PASSWORD=${pwd}` });
      out.push({ id: "cli", label: "Ligne de commande", value: `sqlcmd -S tcp:${h.host},${h.port} -d ${c.database} -U ${c.user}${c.ssl === "disable" ? "" : " -N"}${trust === "True" ? " -C" : ""}` });
      break;
    }
    case "oracle": {
      const desc = `(DESCRIPTION=(ADDRESS=(PROTOCOL=${c.ssl === "disable" || c.ssl === "prefer" ? "TCP" : "TCPS"})(HOST=${h.host})(PORT=${h.port}))(CONNECT_DATA=(SERVICE_NAME=${c.database})))`;
      out.push({ id: "ez", label: "EZConnect (sqlplus, SQLcl)", value: `${c.user}/${pwd}@//${h.host}:${h.port}/${c.database}` });
      out.push({ id: "jdbc", label: "JDBC thin", value: `jdbc:oracle:thin:@//${h.host}:${h.port}/${c.database}`, note: "Utilisateur et mot de passe se passent séparément (propriétés user/password)." });
      out.push({ id: "tns", label: "Descripteur TNS (tnsnames.ora)", value: `${c.database.toUpperCase().replace(/\W/g, "_")} =\n  ${desc}` });
      out.push({ id: "odp", label: "ADO.NET (ODP.NET)", value: `User Id=${c.user};Password=${adoQuote(pwd)};Data Source=${h.host}:${h.port}/${c.database};` });
      out.push({ id: "sqlalchemy", label: "SQLAlchemy (python-oracledb)", value: `oracle+oracledb://${auth(c, pwd)}${h.host}:${h.port}/?service_name=${enc(c.database)}` });
      break;
    }
    case "mongodb": {
      const tls: [string, string][] = c.ssl === "prefer" ? [] : [["tls", c.ssl === "disable" ? "false" : "true"]];
      const uri = `mongodb${c.srv ? "+srv" : ""}://${auth(c, pwd)}${hostList(c, !c.srv)}/${enc(c.database)}${query([...tls, ...p])}`;
      out.push({ id: "uri", label: c.srv ? "URI SRV (Atlas, DNS seedlist)" : "URI standard", value: uri, note: c.srv ? "Avec +srv, un seul nom d'hôte, sans port : la liste des serveurs et TLS viennent du DNS." : undefined });
      out.push({ id: "shell", label: "mongosh", value: `mongosh "${uri}"` });
      out.push({ id: "docker", label: "Variables de l'image Docker officielle", value: `MONGO_INITDB_ROOT_USERNAME=${c.user}\nMONGO_INITDB_ROOT_PASSWORD=${pwd}\nMONGO_INITDB_DATABASE=${c.database}` });
      out.push({ id: "spring", label: "Spring Boot", value: `spring.data.mongodb.uri=${uri}` });
      break;
    }
    case "redis": {
      const scheme = c.ssl === "disable" || c.ssl === "prefer" ? "redis" : "rediss";
      const redisAuth = c.user || pwd ? `${c.user ? enc(c.user) : ""}${pwd ? ":" + enc(pwd) : ""}@` : "";
      out.push({ id: "uri", label: "URI (redis-py, ioredis, Sidekiq, REDIS_URL)", value: `${scheme}://${redisAuth}${h.host}:${h.port}/${c.database || "0"}` });
      out.push({ id: "cli", label: "redis-cli", value: `redis-cli -h ${h.host} -p ${h.port}${c.user ? ` --user ${c.user}` : ""}${pwd ? " --askpass" : ""}${scheme === "rediss" ? " --tls" : ""} -n ${c.database || "0"}` });
      out.push({ id: "spring", label: "Spring Boot", value: `spring.data.redis.url=${scheme}://${redisAuth}${h.host}:${h.port}/${c.database || "0"}` });
      out.push({ id: "stackexchange", label: ".NET (StackExchange.Redis)", value: `${h.host}:${h.port}${c.user ? `,user=${c.user}` : ""}${pwd ? `,password=${pwd}` : ""}${scheme === "rediss" ? ",ssl=True" : ""},defaultDatabase=${c.database || "0"}` });
      break;
    }
    case "sqlite": {
      const file = c.database || "./data/app.db";
      out.push({ id: "sqlalchemy", label: "SQLAlchemy / Django", value: `sqlite:///${file}`, note: "Trois barres pour un chemin relatif, quatre pour un chemin absolu (sqlite:////var/data/app.db)." });
      out.push({ id: "jdbc", label: "JDBC", value: `jdbc:sqlite:${file}` });
      out.push({ id: "ado", label: "ADO.NET (Microsoft.Data.Sqlite)", value: `Data Source=${file};` });
      out.push({ id: "prisma", label: "Prisma", value: `file:${file}` });
      out.push({ id: "cli", label: "Ligne de commande", value: `sqlite3 ${file}` });
      break;
    }
  }
  return out;
}

const EXAMPLES = [
  "postgres://admin:S3cr%40t@pg.exemple.fr:5432/shop?sslmode=verify-full",
  'Server=tcp:sql.exemple.fr,1433;Initial Catalog=crm;User ID=app;Password="Pa;ss=1";Encrypt=True;',
  "jdbc:mysql://mysql.exemple.fr:3306/blog?user=wp&password=secret&useSSL=true",
  "mongodb+srv://atlas-user:mdp@cluster0.abcde.mongodb.net/analytics?retryWrites=true&w=majority",
  "rediss://default:token@cache.exemple.fr:6380/2",
  "host=localhost port=5433 dbname=test user=postgres password='mot de passe'",
  "system/oracle@//ora.exemple.fr:1521/ORCLPDB1",
];

export function DbConnectionTool() {
  const [conn, setConn] = useState<Conn>(DEFAULT);
  const [raw, setRaw] = useState("");
  const [parseError, setParseError] = useState("");
  const [mask, setMask] = useState(true);

  const pwd = conn.password;
  const outs = useMemo(() => formats(conn, pwd), [conn, pwd]);
  const shown = (v: string) => (mask && pwd ? v.split(pwd).join("••••••").split(encodeURIComponent(pwd)).join("••••••") : v);
  const needsEncoding = pwd !== encodeURIComponent(pwd);
  const engineMeta = ENGINES.find((e) => e.id === conn.engine)!;

  function onRaw(value: string) {
    setRaw(value);
    if (!value.trim()) return setParseError("");
    try {
      setConn(parse(value));
      setParseError("");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Chaîne illisible.");
    }
  }

  const set = (patch: Partial<Conn>) => setConn((c) => ({ ...c, ...patch }));
  const setHost = (i: number, patch: Partial<{ host: string; port: string }>) => set({ hosts: conn.hosts.map((h, k) => (k === i ? { ...h, ...patch } : h)) });

  return (
    <div>
      <div className="panel mb-md" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Analyser une chaîne existante</span>
          <span className="meta">URI, JDBC, ADO.NET, libpq, EZConnect…</span>
        </div>
        <textarea value={raw} onChange={(e) => onRaw(e.target.value)} spellCheck={false} style={{ minHeight: 64 }} placeholder="Collez une chaîne de connexion : elle est décomposée ci-dessous et convertie dans tous les formats." />
        <div className="emoji-groups">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="btn" onClick={() => onRaw(ex)} title={ex}>
              {ex.split(/[:;=]/)[0].replace(/^jdbc$/, "JDBC").replace(/^host$/, "libpq").replace(/^Server$/, "ADO.NET").replace(/^system\/oracle@\/\/ora.exemple.fr$/, "EZConnect")}
            </button>
          ))}
        </div>
        {parseError && <p className="validation bad" style={{ margin: 0 }}>{parseError}</p>}
      </div>

      <div className="panel mb-lg" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">Paramètres</span>
        </div>
        <div className="emoji-groups">
          {ENGINES.map((e) => (
            <button
              key={e.id}
              type="button"
              className={"btn" + (e.id === conn.engine ? " is-active" : "")}
              onClick={() => set({ engine: e.id, hosts: e.id === "sqlite" ? [] : (conn.hosts.length ? conn.hosts : [{ host: "localhost", port: e.port }]).map((h) => ({ ...h, port: e.port })), srv: e.id === "mongodb" && conn.srv })}
            >
              {e.label}
            </button>
          ))}
        </div>
        {conn.engine !== "sqlite" && (
          <>
            {conn.hosts.map((h, i) => (
              <div className="field-row" key={i} style={{ marginBottom: ".5rem" }}>
                <div className="field" style={{ flex: 3 }}>
                  <span className="field-label">Hôte{conn.hosts.length > 1 ? ` ${i + 1}` : ""}</span>
                  <input className="input" value={h.host} onChange={(e) => setHost(i, { host: e.target.value })} />
                </div>
                {!conn.srv && (
                  <div className="field" style={{ flex: 1, minWidth: 90 }}>
                    <span className="field-label">Port</span>
                    <input className="input" value={h.port} onChange={(e) => setHost(i, { port: e.target.value.replace(/\D/g, "") })} placeholder={engineMeta.port} />
                  </div>
                )}
                {conn.hosts.length > 1 && (
                  <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
                    <button type="button" className="icon-btn" aria-label="Retirer cet hôte" onClick={() => set({ hosts: conn.hosts.filter((_, k) => k !== i) })}>
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
            {(conn.engine === "postgres" || conn.engine === "mongodb" || conn.engine === "mysql") && (
              <div className="panel-tools" style={{ marginBottom: ".75rem" }}>
                <button type="button" className="btn" onClick={() => set({ hosts: [...conn.hosts, { host: "", port: engineMeta.port }] })}>
                  + Hôte (réplica / basculement)
                </button>
                {conn.engine === "mongodb" && (
                  <label className="check-row">
                    <input type="checkbox" checked={conn.srv} onChange={(e) => set({ srv: e.target.checked, hosts: e.target.checked ? conn.hosts.slice(0, 1) : conn.hosts })} />
                    mongodb+srv (Atlas)
                  </label>
                )}
              </div>
            )}
          </>
        )}
        <div className="field-row">
          {conn.engine !== "sqlite" && (
            <>
              <div className="field">
                <span className="field-label">Utilisateur</span>
                <input className="input" value={conn.user} onChange={(e) => set({ user: e.target.value })} autoComplete="off" />
              </div>
              <div className="field">
                <span className="field-label">Mot de passe</span>
                <input className="input" type={mask ? "password" : "text"} value={conn.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
              </div>
            </>
          )}
          <div className="field">
            <span className="field-label">{engineMeta.dbLabel}</span>
            <input className="input" value={conn.database} onChange={(e) => set({ database: e.target.value })} />
          </div>
        </div>
        {conn.engine !== "sqlite" && (
          <div className="panel-tools">
            <span className="field-label" style={{ margin: 0 }}>
              TLS
            </span>
            <SegmentedControl<Ssl>
              value={conn.ssl}
              onChange={(ssl) => set({ ssl })}
              options={[
                { value: "disable", label: "Désactivé" },
                { value: "prefer", label: "Par défaut" },
                { value: "require", label: "Obligatoire" },
                { value: "verify-full", label: "Vérifier le certificat" },
              ]}
            />
            <label className="check-row">
              <input type="checkbox" checked={mask} onChange={(e) => setMask(e.target.checked)} />
              Masquer le mot de passe
            </label>
          </div>
        )}
        {conn.params.length > 0 && (
          <p className="row-head hint" style={{ margin: ".5rem 0 0" }}>
            Paramètres supplémentaires conservés : {conn.params.map(([k, v]) => `${k}=${v}`).join(", ")}{" "}
            <button type="button" className="btn" onClick={() => set({ params: [] })}>
              Retirer
            </button>
          </p>
        )}
      </div>

      {needsEncoding && conn.engine !== "sqlite" && (
        <p className="validation warn">
          Le mot de passe contient des caractères réservés ({[...new Set(pwd.match(/[^A-Za-z0-9\-_.~]/g) ?? [])].join(" ")}) : dans les URI ils sont encodés (ex. « @ » → %40). Un mot de passe non encodé est la première cause de « could not parse connection string ».
        </p>
      )}
      {conn.ssl === "disable" && conn.engine !== "sqlite" && !conn.hosts.every((h) => /^(localhost|127\.|::1|\[::1\])/.test(h.host)) && (
        <p className="validation bad">TLS désactivé vers un hôte distant : identifiants et données circulent en clair sur le réseau.</p>
      )}

      <div className="hash-rows">
        {outs.map((o) => (
          <div className="db-format" key={o.id}>
            <div className="db-format-head">
              <strong>{o.label}</strong>
              <CopyButton variant="mini" getText={() => o.value} ariaLabel={`Copier : ${o.label}`} />
            </div>
            <pre className="pre-compact">{shown(o.value)}</pre>
            {o.note && <p className="row-head hint" style={{ margin: 0 }}>{o.note}</p>}
          </div>
        ))}
      </div>
      <p className="row-head hint" style={{ margin: "1rem 0 0" }}>
        Tout est calculé localement : la chaîne et le mot de passe ne quittent jamais le navigateur. Le masquage ne concerne que l'affichage ; le bouton copier copie la vraie valeur.
      </p>
    </div>
  );
}
