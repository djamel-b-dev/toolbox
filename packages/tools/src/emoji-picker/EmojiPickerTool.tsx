import { useEffect, useMemo, useState } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

interface Emoji {
  unicode: string;
  label: string;
  hexcode: string;
  group?: number;
  order?: number;
  tags?: string[];
  skins?: { unicode: string; hexcode: string; label: string }[];
}

type Mode = "emoji" | "kaomoji";

const GROUPS: { id: number; label: string }[] = [
  { id: 0, label: "Smileys et émotions" },
  { id: 1, label: "Personnes et corps" },
  { id: 3, label: "Animaux et nature" },
  { id: 4, label: "Nourriture et boissons" },
  { id: 5, label: "Voyages et lieux" },
  { id: 6, label: "Activités" },
  { id: 7, label: "Objets" },
  { id: 8, label: "Symboles" },
  { id: 9, label: "Drapeaux" },
];

// Order matches emojibase's skins array: light → dark.
const SKIN_TONES = [
  { value: "0", label: "✋" },
  { value: "1", label: "✋🏻" },
  { value: "2", label: "✋🏼" },
  { value: "3", label: "✋🏽" },
  { value: "4", label: "✋🏾" },
  { value: "5", label: "✋🏿" },
];

const KAOMOJIS: [string, string][] = [
  ["¯\\_(ツ)_/¯", "haussement épaules bof"],
  ["(╯°□°)╯︵ ┻━┻", "colère table flip"],
  ["┬─┬ノ( º _ ºノ)", "remettre table calme"],
  ["( ͡° ͜ʖ ͡°)", "lenny malicieux"],
  ["ಠ_ಠ", "regard désapprobation"],
  ["(•_•) ( •_•)>⌐■-■ (⌐■_■)", "lunettes cool deal with it"],
  ["(ノಠ益ಠ)ノ彡┻━┻", "rage table"],
  ["(づ｡◕‿‿◕｡)づ", "câlin"],
  ["ʕ•ᴥ•ʔ", "ours mignon"],
  ["(=^･ω･^=)", "chat"],
  ["ᕦ(ò_óˇ)ᕤ", "muscle force"],
  ["(ง'̀-'́)ง", "bagarre combat"],
  ["(ᵔᴥᵔ)", "content mignon"],
  ["(◕‿◕✿)", "sourire fleur"],
  ["(✿◠‿◠)", "sourire heureux"],
  ["^_^", "sourire content"],
  ["(^_^;)", "gêné sueur"],
  ["(>_<)", "douleur frustration"],
  ["(T_T)", "pleurer triste"],
  ["(ಥ﹏ಥ)", "pleurer larmes"],
  ["(°o°)", "surprise choc"],
  ["(⊙_☉)", "confus"],
  ["(¬_¬)", "méfiant suspicion"],
  ["(￣▽￣)ノ", "salut coucou"],
  ["(^_^)/", "salut bonjour"],
  ["\\(^o^)/", "joie victoire"],
  ["ヽ(´▽`)/", "joie fête"],
  ["♪~ ᕕ(ᐛ)ᕗ", "danse musique"],
  ["(っ˘ڡ˘ς)", "miam manger"],
  ["(－_－) zzZ", "dormir sommeil"],
  ["(╥﹏╥)", "tristesse"],
  ["(⌐■_■)", "cool lunettes"],
  ["( •_•)>⌐■-■", "mettre lunettes"],
  ["(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "magie étincelles"],
  ["✧*｡٩(ˊᗜˋ*)و✧*｡", "excité joie"],
  ["(☞ﾟヮﾟ)☞", "pointer toi"],
  ["☜(ﾟヮﾟ☜)", "pointer"],
  ["(╬ಠ益ಠ)", "furieux colère"],
  ["(ʘ‿ʘ)", "fixer regard"],
  ["(°ロ°)☝", "idée eureka"],
  ["(ー_ー)!!", "sérieux"],
  ["┐(´д`)┌", "exaspéré"],
  ["(ó﹏ò｡)", "inquiet"],
  ["( ˘▽˘)っ♨", "café thé chaud"],
  ["<(￣︶￣)>", "fier satisfait"],
  ["(*^▽^*)", "rire"],
  ["(≧▽≦)", "rire joie"],
  ["(´• ω •`)", "timide mignon"],
  ["(っ◔◡◔)っ ♥", "amour coeur"],
  ["♥‿♥", "amoureux"],
  ["[¬º-°]¬", "zombie"],
  ["( ˘ ³˘)♥", "bisou"],
];

function matches(e: Emoji, q: string) {
  return e.label.toLowerCase().includes(q) || (e.tags?.some((t) => t.toLowerCase().includes(q)) ?? false);
}

export function EmojiPickerTool() {
  const [mode, setMode] = useState<Mode>("emoji");
  const [emojis, setEmojis] = useState<Emoji[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<number | "all">("all");
  const [skin, setSkin] = useState("0");
  const [selected, setSelected] = useState<{ char: string; label: string; hexcode?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("emojibase-data/fr/compact.json")
      .then((m) => {
        if (cancelled) return;
        // Group 2 is skin-tone/hair components, not emojis anyone picks on their own.
        const list = (m.default as unknown as Emoji[]).filter((e) => e.group !== undefined && e.group !== 2);
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setEmojis(list);
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();

  const sections = useMemo(() => {
    if (!emojis) return [];
    const withSkin = (e: Emoji) => {
      const variant = skin !== "0" ? e.skins?.[Number(skin) - 1] : undefined;
      return variant ? { char: variant.unicode, label: variant.label, hexcode: variant.hexcode } : { char: e.unicode, label: e.label, hexcode: e.hexcode };
    };
    const visible = emojis.filter((e) => (group === "all" || e.group === group) && (!q || matches(e, q)));
    if (q) return [{ id: -1, label: `${visible.length} résultat${visible.length > 1 ? "s" : ""}`, items: visible.map(withSkin) }];
    return GROUPS.filter((g) => group === "all" || g.id === group)
      .map((g) => ({ id: g.id, label: g.label, items: visible.filter((e) => e.group === g.id).map(withSkin) }))
      .filter((s) => s.items.length > 0);
  }, [emojis, group, q, skin]);

  const kaomojis = KAOMOJIS.filter(([k, kw]) => !q || kw.includes(q) || k.includes(q));

  function pick(item: { char: string; label: string; hexcode?: string }) {
    setSelected(item);
    navigator.clipboard?.writeText(item.char).catch(() => {});
  }

  const codepoints = selected?.hexcode?.split("-") ?? [];

  return (
    <div>
      <div className="mb-md">
        <SegmentedControl<Mode>
          value={mode}
          onChange={(m) => {
            setMode(m);
            setSelected(null);
          }}
          options={[
            { value: "emoji", label: emojis ? `Emojis (${emojis.length})` : "Emojis" },
            { value: "kaomoji", label: `Kaomojis (${KAOMOJIS.length})` },
          ]}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">Rechercher</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="chat, coeur, fusée, drapeau…" />
        </div>
        {mode === "emoji" && (
          <div className="field" style={{ flex: "none" }}>
            <span className="field-label">Teinte de peau</span>
            <SegmentedControl value={skin} onChange={setSkin} options={SKIN_TONES} />
          </div>
        )}
      </div>

      {mode === "emoji" && (
        <div className="emoji-groups mb-md" role="group" aria-label="Catégories">
          <button type="button" className={"btn" + (group === "all" ? " is-active" : "")} onClick={() => setGroup("all")}>
            Toutes
          </button>
          {GROUPS.map((g) => (
            <button key={g.id} type="button" className={"btn" + (group === g.id ? " is-active" : "")} onClick={() => setGroup(g.id)}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="emoji-selected mb-md">
          <span className="emoji-selected-char">{selected.char}</span>
          <div className="hash-rows" style={{ flex: 1, minWidth: 0 }}>
            <div className="hash-row">
              <span className="alg">Nom</span>
              <span className="val">{selected.label}</span>
              <CopyButton variant="mini" getText={() => selected.char} ariaLabel="Copier l'emoji" />
            </div>
            {codepoints.length > 0 && (
              <>
                <div className="hash-row">
                  <span className="alg">Unicode</span>
                  <span className="val">{codepoints.map((c) => `U+${c}`).join(" ")}</span>
                  <CopyButton variant="mini" getText={() => codepoints.map((c) => `U+${c}`).join(" ")} ariaLabel="Copier le code Unicode" />
                </div>
                <div className="hash-row">
                  <span className="alg">HTML</span>
                  <span className="val">{codepoints.map((c) => `&#x${c};`).join("")}</span>
                  <CopyButton variant="mini" getText={() => codepoints.map((c) => `&#x${c};`).join("")} ariaLabel="Copier l'entité HTML" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {mode === "emoji" && !emojis && !loadError && <p className="empty-state">Chargement des emojis…</p>}
      {mode === "emoji" && loadError && <p className="empty-state">Impossible de charger la liste des emojis.</p>}

      {mode === "emoji" &&
        sections.map((s) => (
          <section key={s.id}>
            <div className="row-head" style={{ marginTop: "1.25rem" }}>
              <h2>{s.label}</h2>
            </div>
            <div className="emoji-grid">
              {s.items.map((item) => (
                <button
                  key={item.hexcode}
                  type="button"
                  className={"emoji-btn" + (selected?.hexcode === item.hexcode ? " active" : "")}
                  onClick={() => pick(item)}
                  title={item.label}
                  aria-label={item.label}
                >
                  {item.char}
                </button>
              ))}
            </div>
          </section>
        ))}
      {mode === "emoji" && emojis && sections.length === 0 && <p className="empty-state">Aucun emoji ne correspond.</p>}

      {mode === "kaomoji" && (
        <div className="kaomoji-grid">
          {kaomojis.map(([k, kw]) => (
            <button
              key={k}
              type="button"
              className={"emoji-btn kaomoji-btn" + (selected?.char === k ? " active" : "")}
              onClick={() => pick({ char: k, label: kw })}
              title={kw}
            >
              {k}
            </button>
          ))}
          {kaomojis.length === 0 && <p className="empty-state">Aucun kaomoji ne correspond.</p>}
        </div>
      )}

      <p className="row-head hint" style={{ margin: "1rem 0 0" }}>
        Cliquez pour copier dans le presse-papiers.
      </p>
    </div>
  );
}
