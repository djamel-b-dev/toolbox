import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SegmentedControl } from "@toolbox/ui";

type Level = "L" | "M" | "Q" | "H";

export function QrCodeTool() {
  const [text, setText] = useState("https://toolbox.dev");
  const [level, setLevel] = useState<Level>("M");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!text) {
      setDataUrl("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(text, { errorCorrectionLevel: level, margin: 1, scale: 6 })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Impossible de générer le QR code.");
      });
    return () => {
      cancelled = true;
    };
  }, [text, level]);

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Contenu</span>
          <span className="meta">{text.length} car.</span>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} style={{ minHeight: 90 }} />
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">Correction d'erreur</span>
          <SegmentedControl<Level>
            value={level}
            onChange={setLevel}
            options={[
              { value: "L", label: "Basse" },
              { value: "M", label: "Moyenne" },
              { value: "Q", label: "Élevée" },
              { value: "H", label: "Maximale" },
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="panel">
          <pre className="is-error">{error}</pre>
        </div>
      )}

      {dataUrl && !error && (
        <div className="panel" style={{ alignItems: "center" }}>
          <img src={dataUrl} alt="QR code généré" width={220} height={220} style={{ borderRadius: 8 }} />
          <div className="panel-tools">
            <a className="btn" href={dataUrl} download="qrcode.png">
              Télécharger le PNG
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
