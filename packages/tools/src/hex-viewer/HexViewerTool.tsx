import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CopyButton, SegmentedControl } from "@toolbox/ui";

const PAGE_ROWS = 256;
type Source = "text" | "file";
type Width = "8" | "16" | "32";

// A few magic numbers worth recognising at a glance.
const SIGNATURES: [number[], string][] = [
  [[0x89, 0x50, 0x4e, 0x47], "Image PNG"],
  [[0xff, 0xd8, 0xff], "Image JPEG"],
  [[0x47, 0x49, 0x46, 0x38], "Image GIF"],
  [[0x52, 0x49, 0x46, 0x46], "RIFF (WEBP / WAV / AVI)"],
  [[0x25, 0x50, 0x44, 0x46], "Document PDF"],
  [[0x50, 0x4b, 0x03, 0x04], "Archive ZIP (ou DOCX / XLSX / JAR / APK)"],
  [[0x1f, 0x8b], "Archive GZIP"],
  [[0x42, 0x5a, 0x68], "Archive BZIP2"],
  [[0x37, 0x7a, 0xbc, 0xaf], "Archive 7-Zip"],
  [[0x7f, 0x45, 0x4c, 0x46], "Exécutable ELF"],
  [[0x4d, 0x5a], "Exécutable Windows (PE / MZ)"],
  [[0xca, 0xfe, 0xba, 0xbe], "Classe Java / binaire Mach-O universel"],
  [[0xcf, 0xfa, 0xed, 0xfe], "Exécutable Mach-O 64 bits"],
  [[0x00, 0x61, 0x73, 0x6d], "Module WebAssembly"],
  [[0x53, 0x51, 0x4c, 0x69, 0x74, 0x65], "Base SQLite"],
  [[0xef, 0xbb, 0xbf], "Texte UTF-8 avec BOM"],
  [[0xff, 0xfe], "Texte UTF-16 LE (BOM)"],
  [[0xfe, 0xff], "Texte UTF-16 BE (BOM)"],
  [[0x49, 0x44, 0x33], "Audio MP3 (ID3)"],
  [[0x4f, 0x67, 0x67, 0x53], "Conteneur OGG"],
  [[0x1a, 0x45, 0xdf, 0xa3], "Vidéo Matroska / WebM"],
];

function detect(bytes: Uint8Array): string | null {
  for (const [sig, name] of SIGNATURES) if (sig.every((b, i) => bytes[i] === b)) return name;
  if (bytes.length > 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "Vidéo MP4 / MOV (ftyp)";
  return null;
}

function formatSize(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} Kio`;
  return `${(n / 1024 ** 2).toFixed(2)} Mio`;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function HexViewerTool() {
  const [source, setSource] = useState<Source>("text");
  const [text, setText] = useState("Toolbox — le couteau suisse 🔧\nHex, ASCII et UTF-8.");
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [width, setWidth] = useState<Width>("16");
  const [page, setPage] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [sha, setSha] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const bytes = useMemo(() => (source === "file" ? (file?.bytes ?? new Uint8Array()) : new TextEncoder().encode(text)), [source, file, text]);
  const cols = Number(width);
  const rows = Math.ceil(bytes.length / cols);
  const pages = Math.max(1, Math.ceil(rows / PAGE_ROWS));
  const kind = detect(bytes);

  useEffect(() => setPage(0), [bytes, cols]);

  useEffect(() => {
    let cancelled = false;
    if (!bytes.length) return setSha("");
    crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>).then((d) => !cancelled && setSha(toHex(d)));
    return () => {
      cancelled = true;
    };
  }, [bytes]);

  function load(f: File) {
    f.arrayBuffer().then((buf) => {
      setFile({ name: f.name, bytes: new Uint8Array(buf) });
      setSource("file");
    });
  }

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

  const start = page * PAGE_ROWS;
  const lines = [];
  for (let r = start; r < Math.min(rows, start + PAGE_ROWS); r++) {
    const off = r * cols;
    const slice = bytes.subarray(off, off + cols);
    lines.push(
      <div className="hex-line" key={r}>
        <span className="hex-offset">{off.toString(16).padStart(8, "0")}</span>
        <span className="hex-bytes">
          {Array.from({ length: cols }, (_, i) => {
            const idx = off + i;
            const b = slice[i];
            return (
              <span
                key={i}
                className={"hex-byte" + (b === undefined ? " empty" : b === 0 ? " zero" : "") + (hover === idx ? " hl" : "") + (i > 0 && i % 8 === 0 ? " gap" : "")}
                onMouseEnter={() => b !== undefined && setHover(idx)}
              >
                {b === undefined ? "  " : b.toString(16).padStart(2, "0")}
              </span>
            );
          })}
        </span>
        <span className="hex-ascii">
          {Array.from(slice, (b, i) => (
            <span key={i} className={(b < 32 || b > 126 ? "np" : "") + (hover === off + i ? " hl" : "")} onMouseEnter={() => setHover(off + i)}>
              {b >= 32 && b <= 126 ? String.fromCharCode(b) : "·"}
            </span>
          ))}
        </span>
      </div>,
    );
  }

  const hb = hover !== null ? bytes[hover] : undefined;

  return (
    <div>
      <div className="panel-tools mb-md">
        <SegmentedControl<Source>
          value={source}
          onChange={setSource}
          options={[
            { value: "text", label: "Texte (UTF-8)" },
            { value: "file", label: file ? `Fichier : ${file.name}` : "Fichier" },
          ]}
        />
        <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
          Ouvrir un fichier…
        </button>
        <input ref={inputRef} type="file" hidden onChange={onPick} />
        <SegmentedControl<Width>
          value={width}
          onChange={setWidth}
          options={[
            { value: "8", label: "8 / ligne" },
            { value: "16", label: "16 / ligne" },
            { value: "32", label: "32 / ligne" },
          ]}
        />
      </div>

      {source === "text" ? (
        <div className="panel mb-lg" style={{ minHeight: 0 }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} style={{ minHeight: 90 }} />
        </div>
      ) : (
        !file && (
          <div
            className={"drop-zone mb-lg" + (dragging ? " active" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            Déposez un fichier ici, ou utilisez « Ouvrir un fichier… ». Il est lu localement, rien n'est envoyé.
          </div>
        )
      )}

      <div className="hash-rows mb-lg">
        <div className="hash-row">
          <span className="alg">Taille</span>
          <span className="val">
            {bytes.length.toLocaleString("fr-FR")} octets ({formatSize(bytes.length)}){kind ? ` · ${kind}` : ""}
          </span>
          <span />
        </div>
        <div className="hash-row">
          <span className="alg">SHA-256</span>
          <span className="val">{sha || "—"}</span>
          <CopyButton variant="mini" getText={() => sha} />
        </div>
        <div className="hash-row">
          <span className="alg">Octet survolé</span>
          <span className="val">
            {hb === undefined
              ? "Survolez un octet pour le détailler."
              : `offset 0x${hover!.toString(16)} (${hover}) · hex ${hb.toString(16).padStart(2, "0")} · déc ${hb} · bin ${hb.toString(2).padStart(8, "0")}${hb >= 32 && hb <= 126 ? ` · « ${String.fromCharCode(hb)} »` : ""}`}
          </span>
          <span />
        </div>
      </div>

      {bytes.length > 0 && (
        <div className="hex-view" onMouseLeave={() => setHover(null)}>
          {lines}
        </div>
      )}
      {pages > 1 && (
        <div className="panel-tools" style={{ marginTop: ".75rem" }}>
          <button type="button" className="btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Précédent
          </button>
          <span className="row-head hint" style={{ margin: 0 }}>
            Page {page + 1} / {pages} · {PAGE_ROWS * cols} octets par page
          </span>
          <button type="button" className="btn" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
