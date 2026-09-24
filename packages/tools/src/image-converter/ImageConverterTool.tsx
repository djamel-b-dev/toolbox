import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

type Format = "image/png" | "image/jpeg" | "image/webp";
const EXT: Record<Format, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

interface Source {
  name: string;
  type: string;
  size: number;
  url: string;
  width: number;
  height: number;
  img: HTMLImageElement;
}

function formatSize(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / 1024 ** 2).toFixed(2)} Mo`;
}

export function ImageConverterTool() {
  const [src, setSrc] = useState<Source | null>(null);
  const [format, setFormat] = useState<Format>("image/webp");
  const [quality, setQuality] = useState(0.85);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [background, setBackground] = useState("#ffffff");
  const [out, setOut] = useState<{ blob: Blob; url: string } | null>(null);
  const [dataUrl, setDataUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function load(file: File) {
    if (!file.type.startsWith("image/")) return setError("Ce fichier n'est pas une image.");
    setError("");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { name: file.name, type: file.type, size: file.size, url, width: img.naturalWidth, height: img.naturalHeight, img };
      });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };
    img.onerror = () => setError("Impossible de lire cette image.");
    img.src = url;
  }

  useEffect(() => {
    if (!src || !width || !height) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      // JPEG has no alpha channel: paint a background instead of letting transparency turn black.
      if (format === "image/jpeg") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src.img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (cancelled || !blob) return;
          setOut((prev) => {
            if (prev) URL.revokeObjectURL(prev.url);
            return { blob, url: URL.createObjectURL(blob) };
          });
          const reader = new FileReader();
          reader.onload = () => !cancelled && setDataUrl(reader.result as string);
          reader.readAsDataURL(blob);
        },
        format,
        quality,
      );
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [src, width, height, format, quality, background]);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) load(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) load(f);
  }

  function setW(w: number) {
    setWidth(w);
    if (keepRatio && src) setHeight(Math.max(1, Math.round((w * src.height) / src.width)));
  }
  function setH(h: number) {
    setHeight(h);
    if (keepRatio && src) setWidth(Math.max(1, Math.round((h * src.width) / src.height)));
  }

  function download() {
    if (!out || !src) return;
    const a = document.createElement("a");
    a.href = out.url;
    a.download = `${src.name.replace(/\.[^.]+$/, "")}-${width}x${height}.${EXT[format]}`;
    a.click();
  }

  const saved = src && out ? 1 - out.blob.size / src.size : 0;

  return (
    <div>
      <div
        className={"drop-zone mb-lg" + (dragging ? " active" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      >
        {src ? `${src.name} · ${src.width}×${src.height} · ${formatSize(src.size)} — cliquez ou déposez pour changer` : "Déposez une image ici ou cliquez pour en choisir une (PNG, JPEG, WEBP, GIF, SVG, AVIF…). Traitement 100 % local."}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
      {error && <p className="empty-state text-danger mb-lg">{error}</p>}

      {src && (
        <>
          <div className="panel-tools mb-md">
            <SegmentedControl<Format>
              value={format}
              onChange={setFormat}
              options={[
                { value: "image/webp", label: "WEBP" },
                { value: "image/jpeg", label: "JPEG" },
                { value: "image/png", label: "PNG" },
              ]}
            />
            {format !== "image/png" && (
              <label className="check-row">
                Qualité {Math.round(quality * 100)} %
                <input type="range" min={0.1} max={1} step={0.01} value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={{ width: 140 }} />
              </label>
            )}
            {format === "image/jpeg" && (
              <label className="check-row">
                Fond
                <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} />
              </label>
            )}
          </div>
          <div className="field-row">
            <div className="field">
              <span className="field-label">Largeur (px)</span>
              <input className="input" type="number" min={1} max={16384} value={width} onChange={(e) => setW(Math.max(1, Number(e.target.value)))} />
            </div>
            <div className="field">
              <span className="field-label">Hauteur (px)</span>
              <input className="input" type="number" min={1} max={16384} value={height} onChange={(e) => setH(Math.max(1, Number(e.target.value)))} />
            </div>
            <div className="field" style={{ flex: "none", justifyContent: "flex-end", gap: ".4rem" }}>
              <label className="check-row">
                <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
                Garder les proportions
              </label>
              <div className="panel-tools">
                {[0.25, 0.5, 1, 2].map((f) => (
                  <button key={f} type="button" className="btn" onClick={() => setW(Math.round(src.width * f))}>
                    {f * 100} %
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bench bench-2">
            <div className="panel">
              <div className="panel-head">
                <span className="label">Original</span>
                <span className="meta">
                  {src.width}×{src.height} · {formatSize(src.size)}
                </span>
              </div>
              <div className="img-preview">
                <img src={src.url} alt="Original" />
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <span className="label">Résultat</span>
                <span className="meta">
                  {width}×{height}
                  {out && ` · ${formatSize(out.blob.size)}`}
                  {out && saved !== 0 && (
                    <span className={saved > 0 ? "text-success" : "text-danger"}> ({saved > 0 ? "−" : "+"}{Math.abs(Math.round(saved * 100))} %)</span>
                  )}
                </span>
              </div>
              <div className="img-preview">{out && <img src={out.url} alt="Résultat" />}</div>
              <div className="panel-tools">
                <button type="button" className="btn" onClick={download} disabled={!out}>
                  Télécharger .{EXT[format]}
                </button>
                <CopyButton getText={() => dataUrl} label="Copier en data URI" />
                <CopyButton getText={() => (dataUrl ? `background-image: url("${dataUrl}");` : "")} label="Copier en CSS" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
