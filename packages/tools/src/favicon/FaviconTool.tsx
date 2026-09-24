import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";
import { zipStore } from "../shared/zip";

type Source = "text" | "image";
const SIZES = [
  { size: 16, file: "favicon-16x16.png" },
  { size: 32, file: "favicon-32x32.png" },
  { size: 48, file: "favicon-48x48.png" },
  { size: 180, file: "apple-touch-icon.png" },
  { size: 192, file: "android-chrome-192x192.png" },
  { size: 512, file: "android-chrome-512x512.png" },
];

function canvasBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Rendu impossible."))), "image/png"));
}

/** ICO container holding PNG-compressed images (supported by every browser since IE11). */
function buildIco(pngs: { size: number; data: Uint8Array }[]): Uint8Array {
  const header = 6 + 16 * pngs.length;
  const total = header + pngs.reduce((n, p) => n + p.data.length, 0);
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint16(2, 1, true);
  dv.setUint16(4, pngs.length, true);
  let offset = header;
  pngs.forEach((p, i) => {
    const e = 6 + i * 16;
    out[e] = p.size >= 256 ? 0 : p.size;
    out[e + 1] = p.size >= 256 ? 0 : p.size;
    dv.setUint16(e + 4, 1, true);
    dv.setUint16(e + 6, 32, true);
    dv.setUint32(e + 8, p.data.length, true);
    dv.setUint32(e + 12, offset, true);
    out.set(p.data, offset);
    offset += p.data.length;
  });
  return out;
}

export function FaviconTool() {
  const [source, setSource] = useState<Source>("text");
  const [text, setText] = useState("TB");
  const [bg, setBg] = useState("#4f46e5");
  const [fg, setFg] = useState("#ffffff");
  const [radius, setRadius] = useState(22);
  const [font, setFont] = useState("system-ui, sans-serif");
  const [padding, setPadding] = useState(10);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [appName, setAppName] = useState("Mon application");
  const [themeColor, setThemeColor] = useState("#4f46e5");
  const [previews, setPreviews] = useState<{ size: number; url: string; blob: Blob }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function draw(size: number): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const r = (radius / 100) * size;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, r);
    ctx.clip();
    if (source === "text" || bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
    }
    const inner = size * (1 - (2 * padding) / 100);
    if (source === "image" && image) {
      const ratio = Math.min(inner / image.naturalWidth, inner / image.naturalHeight);
      const w = image.naturalWidth * ratio;
      const h = image.naturalHeight * ratio;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
    } else if (source === "text") {
      ctx.fillStyle = fg;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      let fontSize = inner;
      ctx.font = `700 ${fontSize}px ${font}`;
      const w = ctx.measureText(text).width;
      if (w > inner) fontSize = (fontSize * inner) / w;
      ctx.font = `700 ${fontSize}px ${font}`;
      const m = ctx.measureText(text);
      // Centre on the glyphs' real ink box, not the font's line box, so letters and emoji sit in the middle.
      ctx.fillText(text, size / 2, size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    }
    return c;
  }

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const out = await Promise.all(SIZES.map(async ({ size }) => ({ size, blob: await canvasBlob(draw(size)) })));
      if (cancelled) return;
      setPreviews((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return out.map((o) => ({ ...o, url: URL.createObjectURL(o.blob) }));
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, text, bg, fg, radius, font, padding, image]);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setSource("image");
    };
    img.src = URL.createObjectURL(f);
  }

  const manifest = JSON.stringify(
    {
      name: appName,
      short_name: appName.slice(0, 12),
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: themeColor,
      background_color: themeColor,
      display: "standalone",
    },
    null,
    2,
  );
  const html = `<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${themeColor}">`;

  async function downloadZip() {
    const files = await Promise.all(previews.map(async (p) => ({ name: SIZES.find((s) => s.size === p.size)!.file, data: new Uint8Array(await p.blob.arrayBuffer()) })));
    const ico = buildIco(files.filter((f) => /16x16|32x32|48x48/.test(f.name)).map((f) => ({ size: Number(f.name.match(/(\d+)x/)![1]), data: f.data })));
    const enc = new TextEncoder();
    const zip = zipStore([...files, { name: "favicon.ico", data: ico }, { name: "site.webmanifest", data: enc.encode(manifest) }, { name: "favicon-snippet.html", data: enc.encode(html + "\n") }]);
    const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "favicons.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Source>
          value={source}
          onChange={setSource}
          options={[
            { value: "text", label: "Texte / emoji" },
            { value: "image", label: image ? "Image importée" : "Image" },
          ]}
        />
        <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
          Importer une image…
        </button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
      </div>

      <div className="field-row">
        {source === "text" && (
          <>
            <div className="field">
              <span className="field-label">Texte ou emoji</span>
              <input className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={4} />
            </div>
            <div className="field">
              <span className="field-label">Police</span>
              <select className="input" value={font} onChange={(e) => setFont(e.target.value)}>
                <option value="system-ui, sans-serif">Sans-serif système</option>
                <option value="Georgia, serif">Serif</option>
                <option value="'IBM Plex Mono', monospace">Monospace</option>
                <option value="'Big Shoulders Display', sans-serif">Condensée</option>
              </select>
            </div>
            <div className="field" style={{ flex: "none" }}>
              <span className="field-label">Texte</span>
              <input type="color" className="pixel-color-input" value={fg} onChange={(e) => setFg(e.target.value)} />
            </div>
          </>
        )}
        <div className="field" style={{ flex: "none" }}>
          <span className="field-label">Fond</span>
          <input type="color" className="pixel-color-input" value={bg === "transparent" ? "#ffffff" : bg} onChange={(e) => setBg(e.target.value)} />
        </div>
        {source === "image" && (
          <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
            <label className="check-row" style={{ height: 36 }}>
              <input type="checkbox" checked={bg === "transparent"} onChange={(e) => setBg(e.target.checked ? "transparent" : "#ffffff")} />
              Fond transparent
            </label>
          </div>
        )}
      </div>
      <div className="panel-tools mb-lg">
        <label className="check-row">
          Arrondi {radius} %
          <input type="range" min={0} max={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
        <label className="check-row">
          Marge {padding} %
          <input type="range" min={0} max={30} value={padding} onChange={(e) => setPadding(Number(e.target.value))} />
        </label>
      </div>

      <div className="fav-previews mb-lg">
        {previews.map((p) => (
          <figure key={p.size}>
            <img src={p.url} alt={`Favicon ${p.size}×${p.size}`} style={{ width: Math.min(p.size, 128), height: Math.min(p.size, 128), imageRendering: p.size <= 48 ? "pixelated" : "auto" }} />
            <figcaption>
              {p.size}×{p.size}
            </figcaption>
          </figure>
        ))}
        <div className="fav-tab" aria-hidden="true">
          {previews[1] && <img src={previews[1].url} alt="" width={16} height={16} />}
          <span>{appName}</span>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">Nom de l'application (manifest)</span>
          <input className="input" value={appName} onChange={(e) => setAppName(e.target.value)} />
        </div>
        <div className="field" style={{ flex: "none" }}>
          <span className="field-label">theme-color</span>
          <input type="color" className="pixel-color-input" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
        </div>
        <div className="field" style={{ flex: "none", justifyContent: "flex-end" }}>
          <button type="button" className="btn is-active" onClick={downloadZip} disabled={!previews.length}>
            Télécharger le pack (.zip)
          </button>
        </div>
      </div>
      <div className="panel" style={{ minHeight: 0 }}>
        <div className="panel-head">
          <span className="label">À coller dans le &lt;head&gt;</span>
        </div>
        <pre className="pre-compact">{html}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => html} />
        </div>
      </div>
    </div>
  );
}
