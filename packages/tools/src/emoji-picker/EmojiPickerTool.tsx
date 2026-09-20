import { useState } from "react";

const EMOJIS: [string, string][] = [
  ["😀", "sourire content heureux"],
  ["😂", "rire larmes mdr"],
  ["😅", "sourire gêné soulagement"],
  ["😉", "clin d'œil"],
  ["😍", "amour coeurs yeux"],
  ["🤔", "réfléchir pensif"],
  ["😎", "cool lunettes"],
  ["😭", "pleurer triste"],
  ["😱", "choc peur cri"],
  ["🥳", "fête célébration"],
  ["😴", "dormir fatigue"],
  ["🤯", "explosion tête surprise"],
  ["🙄", "yeux au ciel exaspéré"],
  ["😇", "ange innocent"],
  ["🤗", "câlin"],
  ["👍", "pouce en l'air ok"],
  ["👎", "pouce en bas"],
  ["👏", "applaudir bravo"],
  ["🙏", "merci prière svp"],
  ["✋", "stop main"],
  ["👋", "salut au revoir"],
  ["✌️", "victoire paix"],
  ["🤞", "croiser les doigts chance"],
  ["💪", "muscle force"],
  ["🤝", "poignée de main accord"],
  ["👀", "yeux regarder"],
  ["🐶", "chien"],
  ["🐱", "chat"],
  ["🦊", "renard"],
  ["🐻", "ours"],
  ["🐼", "panda"],
  ["🦁", "lion"],
  ["🐸", "grenouille"],
  ["🐵", "singe"],
  ["🦄", "licorne"],
  ["🐝", "abeille"],
  ["🍎", "pomme fruit"],
  ["🍕", "pizza"],
  ["🍔", "burger"],
  ["🍩", "donut beignet"],
  ["☕", "café"],
  ["🍺", "bière"],
  ["🍇", "raisin fruit"],
  ["🥐", "croissant"],
  ["🍰", "gâteau"],
  ["💻", "ordinateur laptop"],
  ["📱", "téléphone mobile"],
  ["⌨️", "clavier"],
  ["🖥️", "écran ordinateur"],
  ["🖱️", "souris"],
  ["📷", "appareil photo"],
  ["🔋", "batterie"],
  ["💡", "idée ampoule"],
  ["🔒", "verrou sécurité"],
  ["🔑", "clé"],
  ["⚙️", "engrenage paramètres"],
  ["🐛", "bug insecte"],
  ["🚀", "fusée lancement"],
  ["🔥", "feu tendance"],
  ["✨", "étincelles magie"],
  ["⭐", "étoile favori"],
  ["✅", "coché validé"],
  ["❌", "croix erreur"],
  ["⚠️", "attention avertissement"],
  ["❓", "question"],
  ["❗", "exclamation important"],
  ["💯", "cent pourcent parfait"],
  ["🎉", "fête confettis"],
  ["🎯", "cible objectif"],
  ["📌", "épingle"],
  ["📎", "trombone pièce jointe"],
  ["🔗", "lien chaîne"],
  ["📅", "calendrier date"],
  ["⏰", "réveil heure"],
  ["⏳", "sablier attente"],
  ["📝", "note mémo"],
  ["📂", "dossier fichiers"],
  ["🗑️", "corbeille supprimer"],
  ["🔍", "loupe rechercher"],
  ["💬", "bulle message"],
  ["📢", "annonce mégaphone"],
  ["🔔", "cloche notification"],
  ["❤️", "coeur rouge amour"],
  ["💙", "coeur bleu"],
  ["💚", "coeur vert"],
  ["💛", "coeur jaune"],
  ["🧡", "coeur orange"],
  ["🌈", "arc-en-ciel"],
  ["☀️", "soleil"],
  ["🌙", "lune"],
  ["⚡", "éclair rapide"],
  ["🌍", "terre monde"],
  ["🚗", "voiture"],
  ["✈️", "avion voyage"],
  ["🏠", "maison"],
  ["🏢", "immeuble bureau"],
  ["🎁", "cadeau"],
  ["🏆", "trophée victoire"],
];

export function EmojiPickerTool() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = EMOJIS.filter(([, kw]) => !q || kw.includes(q));

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Rechercher</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="chat, coeur, fusée…" />
        </div>
      </div>

      <div className="grid">
        {filtered.map(([emoji, keywords]) => (
          <button
            key={emoji}
            type="button"
            className="strip-card"
            style={{ width: "auto", alignItems: "center", textAlign: "center", gap: ".4rem" }}
            onClick={() => navigator.clipboard?.writeText(emoji)}
            title={keywords}
          >
            <span style={{ fontSize: "1.8rem" }}>{emoji}</span>
            <span className="name" style={{ fontSize: ".72rem", color: "var(--text-tertiary)", fontWeight: 400 }}>
              {keywords.split(" ")[0]}
            </span>
          </button>
        ))}
        {filtered.length === 0 && <p className="empty-state">Aucun emoji ne correspond.</p>}
      </div>
      <p className="row-head hint" style={{ margin: "1rem 0 0" }}>
        Cliquez un emoji pour le copier dans le presse-papiers.
      </p>
    </div>
  );
}
