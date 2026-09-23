import { useState } from "react";
import { SegmentedControl } from "@toolbox/ui";

type StatusClass = "all" | "1" | "2" | "3" | "4" | "5";

const CLASSES: { value: StatusClass; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "1", label: "1xx" },
  { value: "2", label: "2xx" },
  { value: "3", label: "3xx" },
  { value: "4", label: "4xx" },
  { value: "5", label: "5xx" },
];

const CODES: [number, string, string][] = [
  [100, "Continue", "Le serveur a reçu les en-têtes, le client peut continuer."],
  [101, "Switching Protocols", "Le serveur change de protocole à la demande du client."],
  [102, "Processing", "Requête reçue, traitement en cours (WebDAV)."],
  [103, "Early Hints", "En-têtes envoyés en avance pour précharger des ressources."],
  [200, "OK", "Requête traitée avec succès."],
  [201, "Created", "La ressource a été créée."],
  [202, "Accepted", "Requête acceptée mais pas encore traitée."],
  [203, "Non-Authoritative Information", "Succès, mais contenu modifié par un proxy."],
  [204, "No Content", "Succès, aucun contenu à renvoyer."],
  [205, "Reset Content", "Succès, le client doit réinitialiser la vue (formulaire)."],
  [206, "Partial Content", "Contenu partiel renvoyé (pagination/range)."],
  [207, "Multi-Status", "Plusieurs statuts pour plusieurs ressources (WebDAV)."],
  [208, "Already Reported", "Membres déjà listés plus tôt dans la réponse (WebDAV)."],
  [226, "IM Used", "Réponse issue d'une manipulation d'instance (delta encoding)."],
  [300, "Multiple Choices", "Plusieurs représentations possibles, au client de choisir."],
  [301, "Moved Permanently", "Ressource déplacée définitivement."],
  [302, "Found", "Ressource déplacée temporairement."],
  [303, "See Other", "Voir une autre ressource via GET."],
  [304, "Not Modified", "Ressource non modifiée depuis la dernière requête."],
  [305, "Use Proxy", "Obsolète : la ressource doit passer par un proxy."],
  [306, "(Unused)", "Réservé, n'est plus utilisé."],
  [307, "Temporary Redirect", "Redirection temporaire, méthode conservée."],
  [308, "Permanent Redirect", "Redirection permanente, méthode conservée."],
  [400, "Bad Request", "Requête mal formée."],
  [401, "Unauthorized", "Authentification requise."],
  [402, "Payment Required", "Réservé pour usage futur."],
  [403, "Forbidden", "Accès refusé."],
  [404, "Not Found", "Ressource introuvable."],
  [405, "Method Not Allowed", "Méthode HTTP non autorisée."],
  [406, "Not Acceptable", "Format demandé non disponible."],
  [407, "Proxy Authentication Required", "Authentification requise auprès du proxy."],
  [408, "Request Timeout", "Le serveur a attendu trop longtemps."],
  [409, "Conflict", "Conflit avec l'état actuel de la ressource."],
  [410, "Gone", "Ressource définitivement supprimée."],
  [411, "Length Required", "En-tête Content-Length manquant."],
  [412, "Precondition Failed", "Une précondition (If-Match…) n'est pas remplie."],
  [413, "Payload Too Large", "Corps de requête trop volumineux."],
  [414, "URI Too Long", "URI trop longue."],
  [415, "Unsupported Media Type", "Type de contenu non supporté."],
  [416, "Range Not Satisfiable", "La plage demandée (Range) est hors limites."],
  [417, "Expectation Failed", "L'en-tête Expect ne peut pas être satisfait."],
  [418, "I'm a teapot", "Blague historique de l'IETF (RFC 2324)."],
  [421, "Misdirected Request", "Requête envoyée à un serveur qui ne peut pas y répondre."],
  [422, "Unprocessable Entity", "Requête comprise mais sémantiquement invalide."],
  [423, "Locked", "Ressource verrouillée (WebDAV)."],
  [424, "Failed Dependency", "Échec d'une requête dont celle-ci dépendait (WebDAV)."],
  [425, "Too Early", "La requête risque d'être rejouée."],
  [426, "Upgrade Required", "Le client doit passer à un autre protocole."],
  [428, "Precondition Required", "Le serveur exige une requête conditionnelle."],
  [429, "Too Many Requests", "Trop de requêtes envoyées (rate limiting)."],
  [431, "Request Header Fields Too Large", "En-têtes trop volumineux."],
  [451, "Unavailable For Legal Reasons", "Indisponible pour raisons légales."],
  [500, "Internal Server Error", "Erreur générique du serveur."],
  [501, "Not Implemented", "Fonctionnalité non implémentée."],
  [502, "Bad Gateway", "Réponse invalide d'un serveur en amont."],
  [503, "Service Unavailable", "Serveur temporairement indisponible."],
  [504, "Gateway Timeout", "Délai d'attente d'un serveur en amont dépassé."],
  [505, "HTTP Version Not Supported", "Version HTTP non supportée."],
  [506, "Variant Also Negotiates", "Erreur de configuration de la négociation de contenu."],
  [507, "Insufficient Storage", "Espace insuffisant pour stocker la ressource (WebDAV)."],
  [508, "Loop Detected", "Boucle infinie détectée pendant le traitement (WebDAV)."],
  [510, "Not Extended", "Extensions supplémentaires requises (obsolète)."],
  [511, "Network Authentication Required", "Authentification réseau requise (portail captif)."],
];

function colorFor(code: number): string {
  if (code < 300) return "var(--success)";
  if (code < 400) return "var(--text-secondary)";
  return "var(--danger)";
}

export function HttpStatusTool() {
  const [query, setQuery] = useState("");
  const [statusClass, setStatusClass] = useState<StatusClass>("all");
  const q = query.trim().toLowerCase();
  const filtered = CODES.filter(
    ([code, reason, desc]) =>
      (statusClass === "all" || String(code)[0] === statusClass) &&
      (!q || String(code).includes(q) || reason.toLowerCase().includes(q) || desc.toLowerCase().includes(q)),
  );

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Rechercher</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="404, not found, redirection…" />
        </div>
      </div>
      <div className="mb-md" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <SegmentedControl value={statusClass} onChange={setStatusClass} options={CLASSES} />
        <span className="row-head hint" style={{ margin: 0 }}>
          {filtered.length} / {CODES.length} codes
        </span>
      </div>

      <div className="hash-rows">
        {filtered.map(([code, reason, desc]) => (
          <div className="hash-row" key={code} style={{ gridTemplateColumns: "74px 1fr" }}>
            <span className="alg" style={{ color: colorFor(code) }}>
              {code}
            </span>
            <span className="val" style={{ display: "flex", flexDirection: "column", gap: ".15rem" }}>
              <strong style={{ color: "var(--text)" }}>{reason}</strong>
              <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{desc}</span>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-state">Aucun code ne correspond.</p>}
      </div>
    </div>
  );
}
