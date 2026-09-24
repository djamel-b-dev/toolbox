import { useState } from "react";
import { SegmentedControl } from "@toolbox/ui";

type Proto = "TCP" | "UDP" | "TCP/UDP";
type Cat = "Web" | "Accès distant" | "Mail" | "Fichiers" | "Bases de données" | "Infra & réseau" | "Messagerie & files" | "Conteneurs & orchestration" | "Supervision" | "Annuaire & sécurité" | "Temps réel & médias" | "Dev";

const PORTS: [number, Proto, string, string, Cat][] = [
  [20, "TCP", "FTP (données)", "Transfert de fichiers, canal de données en mode actif.", "Fichiers"],
  [21, "TCP", "FTP", "Transfert de fichiers, canal de contrôle.", "Fichiers"],
  [22, "TCP", "SSH / SFTP / SCP", "Shell distant chiffré et transfert de fichiers.", "Accès distant"],
  [23, "TCP", "Telnet", "Shell distant non chiffré (à éviter).", "Accès distant"],
  [25, "TCP", "SMTP", "Envoi de mail entre serveurs.", "Mail"],
  [53, "TCP/UDP", "DNS", "Résolution de noms de domaine.", "Infra & réseau"],
  [67, "UDP", "DHCP (serveur)", "Attribution automatique d'adresses IP.", "Infra & réseau"],
  [68, "UDP", "DHCP (client)", "Réponse DHCP côté client.", "Infra & réseau"],
  [69, "UDP", "TFTP", "Transfert de fichiers simple (boot PXE, firmwares).", "Fichiers"],
  [80, "TCP", "HTTP", "Web non chiffré.", "Web"],
  [88, "TCP/UDP", "Kerberos", "Authentification (Active Directory).", "Annuaire & sécurité"],
  [110, "TCP", "POP3", "Relève de mail.", "Mail"],
  [111, "TCP/UDP", "RPCbind / portmapper", "Annuaire des services RPC (NFS).", "Fichiers"],
  [123, "UDP", "NTP", "Synchronisation de l'heure.", "Infra & réseau"],
  [135, "TCP", "MS RPC", "Appels de procédure distants Windows.", "Infra & réseau"],
  [137, "UDP", "NetBIOS (noms)", "Résolution de noms NetBIOS.", "Fichiers"],
  [139, "TCP", "NetBIOS (session)", "Partage de fichiers Windows historique.", "Fichiers"],
  [143, "TCP", "IMAP", "Accès aux boîtes mail.", "Mail"],
  [161, "UDP", "SNMP", "Supervision d'équipements réseau.", "Supervision"],
  [162, "UDP", "SNMP trap", "Alertes SNMP.", "Supervision"],
  [179, "TCP", "BGP", "Routage entre systèmes autonomes.", "Infra & réseau"],
  [389, "TCP/UDP", "LDAP", "Annuaire (non chiffré ou STARTTLS).", "Annuaire & sécurité"],
  [443, "TCP/UDP", "HTTPS / HTTP/3 (QUIC)", "Web chiffré (TLS), QUIC en UDP.", "Web"],
  [445, "TCP", "SMB / CIFS", "Partage de fichiers Windows.", "Fichiers"],
  [465, "TCP", "SMTPS", "SMTP sur TLS implicite.", "Mail"],
  [500, "UDP", "IKE (IPsec)", "Négociation des tunnels VPN IPsec.", "Annuaire & sécurité"],
  [514, "UDP", "Syslog", "Envoi de journaux.", "Supervision"],
  [515, "TCP", "LPD", "Impression réseau.", "Infra & réseau"],
  [587, "TCP", "SMTP (soumission)", "Envoi de mail authentifié par les clients.", "Mail"],
  [636, "TCP", "LDAPS", "LDAP sur TLS.", "Annuaire & sécurité"],
  [853, "TCP", "DNS over TLS", "DNS chiffré (DoT).", "Infra & réseau"],
  [873, "TCP", "rsync", "Synchronisation de fichiers.", "Fichiers"],
  [990, "TCP", "FTPS", "FTP sur TLS implicite.", "Fichiers"],
  [993, "TCP", "IMAPS", "IMAP sur TLS.", "Mail"],
  [995, "TCP", "POP3S", "POP3 sur TLS.", "Mail"],
  [1080, "TCP", "SOCKS", "Proxy SOCKS.", "Infra & réseau"],
  [1194, "UDP", "OpenVPN", "VPN OpenVPN.", "Annuaire & sécurité"],
  [1433, "TCP", "Microsoft SQL Server", "Base de données MSSQL.", "Bases de données"],
  [1521, "TCP", "Oracle", "Listener Oracle Database.", "Bases de données"],
  [1883, "TCP", "MQTT", "Messagerie IoT.", "Messagerie & files"],
  [2049, "TCP/UDP", "NFS", "Partage de fichiers Unix.", "Fichiers"],
  [2375, "TCP", "Docker (non chiffré)", "API du démon Docker, à ne jamais exposer.", "Conteneurs & orchestration"],
  [2376, "TCP", "Docker (TLS)", "API du démon Docker avec TLS.", "Conteneurs & orchestration"],
  [2379, "TCP", "etcd (client)", "Stockage clé-valeur de Kubernetes.", "Conteneurs & orchestration"],
  [2380, "TCP", "etcd (pairs)", "Réplication entre membres etcd.", "Conteneurs & orchestration"],
  [3000, "TCP", "Grafana / dev Node", "Tableaux de bord Grafana, serveurs de dev.", "Dev"],
  [3268, "TCP", "Catalogue global AD", "Recherche LDAP dans la forêt Active Directory.", "Annuaire & sécurité"],
  [3306, "TCP", "MySQL / MariaDB", "Base de données MySQL.", "Bases de données"],
  [3389, "TCP/UDP", "RDP", "Bureau à distance Windows.", "Accès distant"],
  [3478, "TCP/UDP", "STUN / TURN", "Traversée de NAT pour WebRTC.", "Temps réel & médias"],
  [4222, "TCP", "NATS", "Messagerie NATS.", "Messagerie & files"],
  [4369, "TCP", "EPMD (Erlang)", "Découverte des nœuds RabbitMQ / Erlang.", "Messagerie & files"],
  [5000, "TCP", "Registre Docker / Flask", "Registre d'images local, serveur Flask.", "Dev"],
  [5060, "TCP/UDP", "SIP", "Signalisation VoIP.", "Temps réel & médias"],
  [5061, "TCP", "SIP TLS", "Signalisation VoIP chiffrée.", "Temps réel & médias"],
  [5173, "TCP", "Vite", "Serveur de dev Vite.", "Dev"],
  [5222, "TCP", "XMPP", "Messagerie instantanée (clients).", "Messagerie & files"],
  [5353, "UDP", "mDNS", "Découverte de services locaux (Bonjour).", "Infra & réseau"],
  [5432, "TCP", "PostgreSQL", "Base de données PostgreSQL.", "Bases de données"],
  [5601, "TCP", "Kibana", "Interface d'Elasticsearch.", "Supervision"],
  [5672, "TCP", "AMQP (RabbitMQ)", "Files de messages.", "Messagerie & files"],
  [5900, "TCP", "VNC", "Partage d'écran.", "Accès distant"],
  [5985, "TCP", "WinRM (HTTP)", "Administration Windows à distance.", "Accès distant"],
  [5986, "TCP", "WinRM (HTTPS)", "Administration Windows à distance, chiffrée.", "Accès distant"],
  [6379, "TCP", "Redis", "Cache / base clé-valeur.", "Bases de données"],
  [6443, "TCP", "API Kubernetes", "kube-apiserver.", "Conteneurs & orchestration"],
  [6514, "TCP", "Syslog TLS", "Journaux sur TLS.", "Supervision"],
  [8000, "TCP", "HTTP alternatif", "Serveurs de dev (Django…).", "Dev"],
  [8080, "TCP", "HTTP alternatif / proxy", "Tomcat, Jenkins, proxys.", "Web"],
  [8086, "TCP", "InfluxDB", "Base de séries temporelles.", "Bases de données"],
  [8443, "TCP", "HTTPS alternatif", "Consoles d'administration.", "Web"],
  [8500, "TCP", "Consul", "Découverte de services HashiCorp.", "Conteneurs & orchestration"],
  [8883, "TCP", "MQTT TLS", "MQTT chiffré.", "Messagerie & files"],
  [9000, "TCP", "MinIO / SonarQube / PHP-FPM", "Stockage objet, analyse de code.", "Dev"],
  [9042, "TCP", "Cassandra", "Protocole CQL.", "Bases de données"],
  [9090, "TCP", "Prometheus", "Serveur Prometheus.", "Supervision"],
  [9092, "TCP", "Kafka", "Broker Apache Kafka.", "Messagerie & files"],
  [9093, "TCP", "Alertmanager", "Alertes Prometheus.", "Supervision"],
  [9100, "TCP", "Node exporter / imprimantes", "Métriques système, impression RAW (JetDirect).", "Supervision"],
  [9200, "TCP", "Elasticsearch (HTTP)", "API REST d'Elasticsearch / OpenSearch.", "Bases de données"],
  [9300, "TCP", "Elasticsearch (nœuds)", "Communication entre nœuds.", "Bases de données"],
  [9418, "TCP", "Git", "Protocole git://.", "Dev"],
  [10250, "TCP", "Kubelet", "API du kubelet sur chaque nœud.", "Conteneurs & orchestration"],
  [11211, "TCP/UDP", "Memcached", "Cache mémoire distribué.", "Bases de données"],
  [15672, "TCP", "RabbitMQ (admin)", "Interface web de RabbitMQ.", "Messagerie & files"],
  [27017, "TCP", "MongoDB", "Base de documents MongoDB.", "Bases de données"],
  [51820, "UDP", "WireGuard", "VPN WireGuard.", "Annuaire & sécurité"],
];

const CATS = ["Toutes", ...Array.from(new Set(PORTS.map((p) => p[4])))];

function range(port: number): string {
  if (port < 1024) return "système";
  if (port < 49152) return "enregistré";
  return "dynamique";
}

export function PortsTool() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Toutes");
  const [proto, setProto] = useState<"all" | "TCP" | "UDP">("all");
  const q = query.trim().toLowerCase();
  const filtered = PORTS.filter(
    ([port, p, name, desc, c]) =>
      (cat === "Toutes" || c === cat) &&
      (proto === "all" || p.includes(proto)) &&
      (!q || String(port) === q || String(port).startsWith(q) || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)),
  );

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Rechercher</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="443, postgres, vpn, kubernetes…" />
        </div>
        <div className="field" style={{ flex: "none" }}>
          <span className="field-label">Protocole</span>
          <SegmentedControl
            value={proto}
            onChange={(v) => setProto(v as typeof proto)}
            options={[
              { value: "all", label: "Tous" },
              { value: "TCP", label: "TCP" },
              { value: "UDP", label: "UDP" },
            ]}
          />
        </div>
      </div>
      <div className="emoji-groups mb-md">
        {CATS.map((c) => (
          <button key={c} type="button" className={"btn" + (c === cat ? " is-active" : "")} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <p className="row-head hint" style={{ margin: "0 0 .75rem" }}>
        {filtered.length} / {PORTS.length} ports · 0–1023 système, 1024–49151 enregistrés, 49152–65535 dynamiques
      </p>
      <div className="hash-rows">
        {filtered.map(([port, p, name, desc, c]) => (
          <div className="hash-row" key={port + name} style={{ gridTemplateColumns: "84px 1fr auto" }}>
            <span className="alg" style={{ color: "var(--accent)", fontSize: ".95rem" }}>
              {port}
            </span>
            <span className="val" style={{ display: "flex", flexDirection: "column", gap: ".15rem" }}>
              <strong style={{ color: "var(--text)" }}>{name}</strong>
              <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{desc}</span>
            </span>
            <span className="port-tags">
              <span>{p}</span>
              <span>{c}</span>
              <span>{range(port)}</span>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-state">Aucun port ne correspond.</p>}
      </div>
    </div>
  );
}
