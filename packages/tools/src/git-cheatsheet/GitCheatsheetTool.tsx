import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

const ENTRIES: [string, string, string][] = [
  ["git init", "Bases", "Initialise un nouveau dépôt"],
  ["git clone <url>", "Bases", "Clone un dépôt distant"],
  ["git status", "Bases", "Affiche l'état de l'arbre de travail"],
  ["git add <fichier>", "Bases", "Ajoute des fichiers à l'index"],
  ["git commit -m \"message\"", "Bases", "Crée un commit"],
  ["git diff", "Bases", "Affiche les différences non indexées"],
  ["git branch", "Branches", "Liste les branches"],
  ["git branch <nom>", "Branches", "Crée une branche"],
  ["git checkout -b <nom>", "Branches", "Crée et bascule sur une branche"],
  ["git switch <nom>", "Branches", "Bascule sur une branche existante"],
  ["git merge <branche>", "Branches", "Fusionne une branche dans la courante"],
  ["git rebase <branche>", "Branches", "Rejoue les commits sur une autre base"],
  ["git log", "Historique", "Affiche l'historique des commits"],
  ["git log --oneline --graph", "Historique", "Historique condensé avec graphe"],
  ["git show <commit>", "Historique", "Détails d'un commit"],
  ["git blame <fichier>", "Historique", "Affiche l'auteur de chaque ligne"],
  ["git reset --soft HEAD~1", "Annulation", "Annule le dernier commit, garde les changements indexés"],
  ["git reset --hard HEAD~1", "Annulation", "Annule le dernier commit et les changements"],
  ["git revert <commit>", "Annulation", "Crée un commit qui annule un commit précédent"],
  ["git checkout -- <fichier>", "Annulation", "Annule les modifications non indexées d'un fichier"],
  ["git remote -v", "Remote", "Liste les dépôts distants"],
  ["git fetch", "Remote", "Récupère les changements sans fusionner"],
  ["git pull", "Remote", "Récupère et fusionne les changements"],
  ["git push", "Remote", "Envoie les commits locaux"],
  ["git push -u origin <branche>", "Remote", "Envoie et lie la branche au remote"],
  ["git stash", "Stash", "Range les changements en cours"],
  ["git stash pop", "Stash", "Restaure le dernier stash"],
  ["git stash list", "Stash", "Liste les stashs"],
];

export function GitCheatsheetTool() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = ENTRIES.filter(([cmd, cat, desc]) => !q || cmd.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || desc.toLowerCase().includes(q));

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Rechercher</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="rebase, stash, remote…" />
        </div>
      </div>

      <div className="hash-rows">
        {filtered.map(([cmd, cat, desc], i) => (
          <div className="hash-row" key={cmd + i} style={{ gridTemplateColumns: "minmax(74px, 220px) 1fr auto" }}>
            <span className="alg">{cmd}</span>
            <span className="val" style={{ display: "flex", flexDirection: "column", gap: ".15rem" }}>
              <span>{desc}</span>
              <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{cat}</span>
            </span>
            <CopyButton variant="mini" getText={() => cmd} ariaLabel={`Copier ${cmd}`} />
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-state">Aucune commande ne correspond.</p>}
      </div>
    </div>
  );
}
