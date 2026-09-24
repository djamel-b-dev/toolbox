import { useEffect, useState } from "react";
import { CopyButton } from "@toolbox/ui";

interface Info {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  modifiers: string[];
  repeat: boolean;
}

const LOCATIONS = ["standard", "gauche", "droite", "pavé numérique"];

function display(key: string): string {
  return key === " " ? "Espace" : key;
}

export function KeycodeTool() {
  const [info, setInfo] = useState<Info | null>(null);
  const [history, setHistory] = useState<Info[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Let the browser keep its shortcuts for tabs, reload and devtools; capture everything else.
      if ((e.metaKey || e.ctrlKey) && ["r", "t", "w", "l", "tab"].includes(e.key.toLowerCase())) return;
      if (e.key === "F5" || e.key === "F12") return;
      const target = e.target instanceof Element ? e.target : document.body;
      if (target.closest("input, textarea, select, .palette")) return;
      // Tab still moves focus so the page stays keyboard-navigable; it's reported all the same.
      const activatesControl = (e.key === "Enter" || e.key === " ") && target.closest("button, a, [role=button]");
      if (e.key !== "Tab" && !activatesControl) e.preventDefault();
      const next: Info = {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        location: e.location,
        modifiers: [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift", e.metaKey && "Meta"].filter(Boolean) as string[],
        repeat: e.repeat,
      };
      setInfo(next);
      setHistory((h) => [next, ...h].slice(0, 12));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const snippet = info ? `if (event.key === ${JSON.stringify(info.key)}) {\n  // …\n}` : "";

  return (
    <div>
      <div className="key-stage mb-lg" aria-live="polite">
        {info ? (
          <>
            <div className="key-cap">{display(info.key)}</div>
            {info.modifiers.length > 0 && <div className="key-mods">{info.modifiers.join(" + ")}</div>}
          </>
        ) : (
          <p>Appuyez sur une touche…</p>
        )}
      </div>

      {info && (
        <>
          <div className="hash-rows mb-lg">
            {(
              [
                ["event.key", JSON.stringify(info.key)],
                ["event.code", JSON.stringify(info.code)],
                ["event.keyCode (obsolète)", String(info.keyCode)],
                ["event.which (obsolète)", String(info.which)],
                ["event.location", `${info.location} (${LOCATIONS[info.location] ?? "?"})`],
                ["Modificateurs", info.modifiers.join(", ") || "aucun"],
                ["Répétition", info.repeat ? "oui (touche maintenue)" : "non"],
              ] as const
            ).map(([label, value]) => (
              <div className="hash-row" key={label}>
                <span className="alg">{label}</span>
                <span className="val">{value}</span>
                <CopyButton variant="mini" getText={() => value.replace(/^"|"$/g, "")} />
              </div>
            ))}
          </div>
          <div className="panel mb-lg" style={{ minHeight: 0 }}>
            <div className="panel-head">
              <span className="label">Exemple</span>
            </div>
            <pre>{snippet}</pre>
            <div className="panel-tools">
              <CopyButton getText={() => snippet} />
            </div>
          </div>
        </>
      )}

      {history.length > 1 && (
        <>
          <div className="row-head">
            <h2>Historique</h2>
          </div>
          <div className="emoji-groups">
            {history.slice(1).map((h, i) => (
              <span key={i} className="btn" style={{ cursor: "default" }}>
                {[...h.modifiers, display(h.key)].join(" + ")} <span style={{ color: "var(--text-tertiary)" }}>{h.code}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
