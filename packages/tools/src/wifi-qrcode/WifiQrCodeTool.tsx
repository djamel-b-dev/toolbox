import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SegmentedControl } from "@toolbox/ui";

type Security = "WPA" | "WEP" | "nopass";

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function WifiQrCodeTool() {
  const [ssid, setSsid] = useState("Workbench-5G");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<Security>("WPA");
  const [hidden, setHidden] = useState(false);
  const [dataUrl, setDataUrl] = useState("");

  const payload = `WIFI:T:${security};S:${escapeWifi(ssid)};${security === "nopass" ? "" : `P:${escapeWifi(password)};`}${hidden ? "H:true;" : ""};`;

  useEffect(() => {
    if (!ssid) {
      setDataUrl("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, scale: 6 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [payload, ssid]);

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Nom du réseau (SSID)</span>
          <input className="input" value={ssid} onChange={(e) => setSsid(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <span className="field-label">Sécurité</span>
          <SegmentedControl<Security>
            value={security}
            onChange={setSecurity}
            options={[
              { value: "WPA", label: "WPA/WPA2" },
              { value: "WEP", label: "WEP" },
              { value: "nopass", label: "Ouvert" },
            ]}
          />
        </div>
      </div>

      {security !== "nopass" && (
        <div className="field-row">
          <div className="field">
            <span className="field-label">Mot de passe</span>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
      )}

      <label className="check-row mb-lg">
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Réseau masqué
      </label>

      {dataUrl && (
        <div className="panel" style={{ alignItems: "center" }}>
          <img src={dataUrl} alt="QR code Wi-Fi" width={220} height={220} style={{ borderRadius: 8 }} />
          <div className="panel-tools">
            <a className="btn" href={dataUrl} download="wifi-qrcode.png">
              Télécharger le PNG
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
