import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import exifr from "exifr";
import { JsonTree } from "../shared/JsonTree";

interface Loaded {
  file: File;
  url: string;
  data: Record<string, unknown> | null;
  gps: { latitude: number; longitude: number } | null;
}

const HIGHLIGHT: [string, string][] = [
  ["Make", "Fabricant"],
  ["Model", "Appareil"],
  ["LensModel", "Objectif"],
  ["DateTimeOriginal", "Prise de vue"],
  ["ExposureTime", "Exposition"],
  ["FNumber", "Ouverture"],
  ["ISO", "ISO"],
  ["FocalLength", "Focale"],
  ["Software", "Logiciel"],
  ["Artist", "Auteur"],
  ["Copyright", "Copyright"],
  ["ImageWidth", "Largeur"],
  ["ImageHeight", "Hauteur"],
  ["Orientation", "Orientation"],
];

function fmt(key: string, v: unknown): string {
  if (v instanceof Date) return v.toLocaleString("fr-FR");
  if (key === "ExposureTime" && typeof v === "number") return v < 1 ? `1/${Math.round(1 / v)} s` : `${v} s`;
  if (key === "FNumber" && typeof v === "number") return `f/${v}`;
  if (key === "FocalLength" && typeof v === "number") return `${v} mm`;
  return String(v);
}

/** Drops EXIF/XMP (APP1), IPTC (APP13) and comments from a JPEG without re-encoding the pixels. */
function stripJpeg(b: Uint8Array): Uint8Array<ArrayBuffer> {
  if (b[0] !== 0xff || b[1] !== 0xd8) throw new Error("JPEG invalide.");
  const out: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) throw new Error("Structure JPEG inattendue.");
    const marker = b[i + 1];
    if (marker === 0xda) {
      out.push(b.subarray(i));
      break;
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    const seg = b.subarray(i, i + 2 + len);
    // Keep APP0 (JFIF), APP2 (ICC colour profile) and APP14 (Adobe: needed to decode CMYK JPEGs correctly).
    const drop = marker === 0xe1 || marker === 0xed || marker === 0xfe || (marker >= 0xe3 && marker <= 0xef && marker !== 0xee);
    if (!drop) out.push(seg);
    i += 2 + len;
  }
  const total = out.reduce((n, s) => n + s.length, 0);
  const res = new Uint8Array(total);
  let o = 0;
  for (const s of out) {
    res.set(s, o);
    o += s.length;
  }
  return res;
}

/** Keeps only the PNG chunks needed to render the image (drops tEXt, iTXt, zTXt, eXIf, tIME…). */
function stripPng(b: Uint8Array): Uint8Array<ArrayBuffer> {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!sig.every((v, i) => b[i] === v)) throw new Error("PNG invalide.");
  const keep = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "pHYs", "acTL", "fcTL", "fdAT"]);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const out: Uint8Array[] = [b.subarray(0, 8)];
  let i = 8;
  while (i < b.length) {
    const len = dv.getUint32(i);
    const type = String.fromCharCode(...b.subarray(i + 4, i + 8));
    const end = i + 12 + len;
    if (keep.has(type)) out.push(b.subarray(i, end));
    i = end;
  }
  const res = new Uint8Array(out.reduce((n, s) => n + s.length, 0));
  let o = 0;
  for (const s of out) {
    res.set(s, o);
    o += s.length;
  }
  return res;
}

async function reencode(url: string, type: string): Promise<Blob> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Ré-encodage impossible."))), type === "image/png" ? "image/png" : "image/jpeg", 0.95));
}

export function ExifTool() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stripInfo, setStripInfo] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function load(file: File) {
    setError("");
    setStripInfo("");
    if (loaded) URL.revokeObjectURL(loaded.url);
    try {
      const data = (await exifr.parse(file, { tiff: true, exif: true, gps: true, xmp: true, iptc: true, icc: false, jfif: true, ihdr: true, translateValues: true, reviveValues: true })) ?? null;
      const gps = await exifr.gps(file).catch(() => null);
      setLoaded({ file, url: URL.createObjectURL(file), data, gps: gps && Number.isFinite(gps.latitude) ? gps : null });
    } catch (e) {
      setLoaded({ file, url: URL.createObjectURL(file), data: null, gps: null });
      setError(e instanceof Error ? `Métadonnées illisibles : ${e.message}` : "Métadonnées illisibles.");
    }
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void load(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) void load(f);
  }

  async function strip() {
    if (!loaded) return;
    const bytes = new Uint8Array(await loaded.file.arrayBuffer());
    let blob: Blob;
    let how: string;
    const orientation = loaded.data?.Orientation;
    // Dropping EXIF also drops the rotation flag: bake the rotation in by re-encoding instead.
    const rotated = orientation !== undefined && orientation !== 1 && orientation !== "Horizontal (normal)";
    try {
      if (rotated) throw new Error("rotated");
      if (loaded.file.type === "image/jpeg") {
        blob = new Blob([stripJpeg(bytes)], { type: "image/jpeg" });
        how = "sans perte (segments EXIF, XMP, IPTC et commentaires retirés)";
      } else if (loaded.file.type === "image/png") {
        blob = new Blob([stripPng(bytes)], { type: "image/png" });
        how = "sans perte (blocs texte et EXIF retirés)";
      } else {
        blob = await reencode(loaded.url, loaded.file.type);
        how = "par ré-encodage (format sans nettoyage sans perte disponible)";
      }
    } catch {
      blob = await reencode(loaded.url, loaded.file.type);
      how = rotated ? "par ré-encodage, pour conserver le sens de la photo (orientation EXIF)" : "par ré-encodage";
    }
    const name = loaded.file.name.replace(/(\.[^.]+)?$/, (ext) => `-sans-metadonnees${ext || (blob.type === "image/png" ? ".png" : ".jpg")}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStripInfo(`${name} : ${Math.round(loaded.file.size / 1024)} Ko → ${Math.round(blob.size / 1024)} Ko, ${how}.`);
  }

  const data = loaded?.data;
  const count = data ? Object.keys(data).length : 0;
  const sensitive = data ? [loaded?.gps && "position GPS", (data.SerialNumber || data.BodySerialNumber) && "numéro de série de l'appareil", (data.Artist || data.Creator) && "nom de l'auteur", data.OwnerName && "nom du propriétaire"].filter(Boolean) : [];

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
        {loaded ? `${loaded.file.name} · ${Math.round(loaded.file.size / 1024)} Ko — cliquez ou déposez pour changer` : "Déposez une photo (JPEG, PNG, HEIC, TIFF, WEBP…) ou cliquez pour la choisir. Elle est lue localement."}
      </div>
      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" hidden onChange={onPick} />
      {error && <p className="validation warn">{error}</p>}

      {loaded && (
        <>
          {sensitive.length > 0 ? (
            <p className="validation bad">Cette image révèle : {sensitive.join(", ")}. Supprimez les métadonnées avant de la partager.</p>
          ) : (
            count > 0 && <p className="validation ok">Aucune donnée sensible évidente (pas de GPS ni de numéro de série).</p>
          )}
          <div className="bench bench-2 mb-lg">
            <div className="panel">
              <div className="panel-head">
                <span className="label">Aperçu</span>
                <span className="meta">{loaded.file.type || "type inconnu"}</span>
              </div>
              <div className="img-preview">
                <img src={loaded.url} alt="Image analysée" />
              </div>
              <div className="panel-tools">
                <button type="button" className="btn is-active" onClick={strip}>
                  Télécharger sans métadonnées
                </button>
              </div>
              {stripInfo && <p className="row-head hint" style={{ margin: 0 }}>{stripInfo}</p>}
            </div>
            <div className="panel">
              <div className="panel-head">
                <span className="label">Essentiel</span>
                <span className="meta">{count} champ(s)</span>
              </div>
              <div className="hash-rows">
                {loaded.gps && (
                  <div className="hash-row hash-row-2 is-current">
                    <span className="alg">Position GPS</span>
                    <span className="val">
                      {loaded.gps.latitude.toFixed(6)}, {loaded.gps.longitude.toFixed(6)}{" "}
                      <a href={`https://www.openstreetmap.org/?mlat=${loaded.gps.latitude}&mlon=${loaded.gps.longitude}#map=16/${loaded.gps.latitude}/${loaded.gps.longitude}`} target="_blank" rel="noopener noreferrer">
                        voir sur la carte ↗
                      </a>
                    </span>
                  </div>
                )}
                {HIGHLIGHT.filter(([k]) => data?.[k] !== undefined).map(([k, label]) => (
                  <div className="hash-row hash-row-2" key={k}>
                    <span className="alg">{label}</span>
                    <span className="val">{fmt(k, data![k])}</span>
                  </div>
                ))}
                {count === 0 && <p className="empty-state">Aucune métadonnée trouvée dans ce fichier.</p>}
              </div>
            </div>
          </div>
          {data && count > 0 && (
            <div className="panel" style={{ minHeight: 0 }}>
              <div className="panel-head">
                <span className="label">Toutes les métadonnées</span>
              </div>
              <JsonTree data={JSON.parse(JSON.stringify(data, (_k, v) => (v instanceof Uint8Array ? `<${v.length} octets>` : v)))} defaultDepth={1} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
