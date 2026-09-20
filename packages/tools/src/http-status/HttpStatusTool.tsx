import { useState } from "react";

const CODES: [number, string, string][] = [
  [100, "Continue", "Le serveur a reçu les en-têtes, le client peut continuer."],
  [101, "Switching Protocols", "Le serveur change de protocole à la demande du client."],
  [200, "OK", "Requête traitée avec succès."],
  [201, "Created", "La ressource a été créée."],
  [202, "Accepted", "Requête acceptée mais pas encore traitée."],
  [204, "No Content", "Succès, aucun contenu à renvoyer."],
  [206, "Partial Content", "Contenu partiel renvoyé (pagination/range)."],
  [301, "Moved Permanently", "Ressource déplacée définitivement."],
  [302, "Found", "Ressource déplacée temporairement."],
  [303, "See Other", "Voir une autre ressource via GET."],
  [304, "Not Modified", "Ressource non modifiée depuis la dernière requête."],
  [307, "Temporary Redirect", "Redirection temporaire, méthode conservée."],
  [308, "Permanent Redirect", "Redirection permanente, méthode conservée."],
  [400, "Bad Request", "Requête mal formée."],
  [401, "Unauthorized", "Authentification requise."],
  [402, "Payment Required", "Réservé pour usage futur."],
  [403, "Forbidden", "Accès refusé."],
  [404, "Not Found", "Ressource introuvable."],
  [405, "Method Not Allowed", "Méthode HTTP non autorisée."],
  [406, "Not Acceptable", "Format demandé non disponible."],
  [408, "Request Timeout", "Le serveur a attendu trop longtemps."],
  [409, "Conflict", "Conflit avec l'état actuel de la ressource."],
  [410, "Gone", "Ressource définitivement supprimée."],
  [411, "Length Required", "En-tête Content-Length manquant."],
  [413, "Payload Too Large", "Corps de requête trop volumineux."],
  [414, "URI Too Long", "URI trop longue."],
  [415, "Unsupported Media Type", "Type de contenu non supporté."],
  [418, "I'm a teapot", "Blague historique de l'IETF (RFC 2324)."],
  [422, "Unprocessable Entity", "Requête comprise mais sémantiquement invalide."],
  [425, "Too Early", "La requête risque d'être rejouée."],
  [429, "Too Many Requests", "Trop de requêtes envoyées (rate limiting)."],
  [431, "Request Header Fields Too Large", "En-têtes trop volumineux."],
  [451, "Unavailable For Legal Reasons", "Indisponible pour raisons légales."],
  [500, "Internal Server Error", "Erreur générique du serveur."],
  [501, "Not Implemented", "Fonctionnalité non implémentée."],
  [502, "Bad Gateway", "Réponse invalide d'un serveur en amont."],
  [503, "Service Unavailable", "Serveur temporairement indisponible."],
  [504, "Gateway Timeout", "Délai d'attente d'un serveur en amont dépassé."],
  [505, "HTTP Version Not Supported", "Version HTTP non supportée."],
];

function colorFor(code: number): string {
  if (code < 300) return "var(--success)";
  if (code < 400) return "var(--text-secondary)";
  return "var(--danger)";
}

export function HttpStatusTool() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = CODES.filter(([code, reason, desc]) => !q || String(code).includes(q) || reason.toLowerCase().includes(q) || desc.toLowerCase().includes(q));

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Rechercher</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="404, not found, redirection…" />
        </div>
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
