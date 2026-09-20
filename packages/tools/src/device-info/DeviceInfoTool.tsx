import { CopyButton } from "@toolbox/ui";

export function DeviceInfoTool() {
  const nav = navigator;
  const scr = window.screen;

  const rows: [string, string][] = [
    ["User-Agent", nav.userAgent],
    ["Plateforme", nav.platform || "—"],
    ["Langue", nav.language],
    ["Langues acceptées", nav.languages?.join(", ") || "—"],
    ["Cœurs logiques (approx.)", String(nav.hardwareConcurrency ?? "—")],
    ["Cookies activés", nav.cookieEnabled ? "Oui" : "Non"],
    ["En ligne", nav.onLine ? "Oui" : "Non"],
    ["Résolution écran", `${scr.width} × ${scr.height}`],
    ["Résolution disponible", `${scr.availWidth} × ${scr.availHeight}`],
    ["Profondeur de couleur", `${scr.colorDepth} bits`],
    ["Ratio de pixels", String(window.devicePixelRatio)],
    ["Fuseau horaire", Intl.DateTimeFormat().resolvedOptions().timeZone],
  ];

  return (
    <div>
      <div className="hash-rows">
        {rows.map(([label, value]) => (
          <div className="hash-row" key={label}>
            <span className="alg">{label}</span>
            <span className="val">{value}</span>
            <CopyButton variant="mini" getText={() => value} ariaLabel={`Copier ${label}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
