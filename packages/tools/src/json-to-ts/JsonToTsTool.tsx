import { useMemo, useState } from "react";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";
import { CodeView, type CodeLanguage } from "../shared/CodeView";
import { Inferrer, emitCs, emitGo, emitJava, emitKotlin, emitPython, emitRust, emitSwift, emitTs, type CsStyle, type JavaStyle, type PyStyle, type TsStyle } from "./codegen";

type Lang = "ts" | "cs" | "python" | "java" | "go" | "rust" | "kotlin" | "swift";

const LANGS: { id: Lang; label: string; hl: CodeLanguage; note: string }[] = [
  { id: "ts", label: "TypeScript", hl: "typescript", note: "" },
  { id: "cs", label: "C#", hl: "csharp", note: "Pensé pour System.Text.Json (.NET 6+) avec JsonSerializerDefaults.Web (camelCase, défaut d'ASP.NET Core) : seules les clés non camelCase reçoivent un [JsonPropertyName]. Dates ISO → DateTimeOffset, UUID → Guid, types mélangés → JsonElement." },
  { id: "python", label: "Python", hl: "python", note: "Python 3.10+. Pydantic v2 : les clés non conformes sont mappées par alias ; les dates ISO et UUID sont validés et convertis automatiquement." },
  { id: "java", label: "Java", hl: "java", note: "Records Java 16+ ou classes Lombok, annotations Jackson. Les valeurs pouvant manquer utilisent les types enveloppes (Integer, Long…) pour accepter null." },
  { id: "go", label: "Go", hl: "go", note: "Tags encoding/json ; omitempty sur les champs optionnels. Les dates ISO 8601 se décodent directement dans time.Time (RFC 3339)." },
  { id: "rust", label: "Rust", hl: "rust", note: "Nécessite serde (feature derive) et serde_json. Les dates restent des String : activez chrono avec sa feature serde pour les typer." },
  { id: "kotlin", label: "Kotlin", hl: "kotlin", note: "kotlinx.serialization (plugin Gradle requis). Les champs pouvant manquer sont nullables avec une valeur par défaut null." },
  { id: "swift", label: "Swift", hl: "swift", note: "Codable : CodingKeys n'est généré que si un nom JSON diffère du nom Swift. Pensez à .iso8601 pour décoder les dates." },
];

const EXAMPLE = JSON.stringify(
  {
    id: 42,
    username: "djamel",
    email: "dj@example.com",
    verified: true,
    balance: 1520.75,
    createdAt: "2026-09-24T08:00:00Z",
    sessionId: "3f2c9a1e-8b7d-4c21-9f0e-5a6b7c8d9e01",
    profile: { displayName: "Djamel", avatar: null, links: [{ label: "GitHub", url: "https://github.com" }] },
    roles: ["admin", "dev"],
    "last-login": 1790000000123,
  },
  null,
  2,
);export function JsonToTsTool() {
  const [input, setInput] = useState(EXAMPLE);
  const [lang, setLang] = useState<Lang>("ts");
  const [rootName, setRootName] = useState("User");
  const [tsStyle, setTsStyle] = useState<TsStyle>("interface");
  const [optionalNull, setOptionalNull] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [csStyle, setCsStyle] = useState<CsStyle>("positional");
  const [namespace, setNamespace] = useState("MonApp.Models");
  const [list, setList] = useState<"List" | "array">("List");
  const [nullable, setNullable] = useState(true);
  const [attributes, setAttributes] = useState(true);
  const [pyStyle, setPyStyle] = useState<PyStyle>("pydantic");
  const [javaStyle, setJavaStyle] = useState<JavaStyle>("record");
  const [pkg, setPkg] = useState("com.exemple.models");
  const [goPkg, setGoPkg] = useState("models");
  const [goPointers, setGoPointers] = useState(true);
  const [swiftVar, setSwiftVar] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      const data = JSON.parse(input);
      const inf = new Inferrer();
      const root = inf.infer(data, rootName || "Root");
      if (lang !== "ts" && !inf.models.size) return { output: "", error: "Aucun objet dans ce JSON : il n'y a pas de classe à générer." };
      const out =
        lang === "ts" ? emitTs(inf, root, rootName, tsStyle, optionalNull, readonly)
        : lang === "cs" ? emitCs(inf, root, rootName, { style: csStyle, namespace, list, nullable, attributes })
        : lang === "python" ? emitPython(inf, pyStyle)
        : lang === "java" ? emitJava(inf, javaStyle, pkg)
        : lang === "go" ? emitGo(inf, goPkg, goPointers)
        : lang === "rust" ? emitRust(inf)
        : lang === "kotlin" ? emitKotlin(inf, pkg)
        : emitSwift(inf, swiftVar);
      return { output: out, error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "JSON invalide." };
    }
  }, [input, lang, rootName, tsStyle, optionalNull, readonly, csStyle, namespace, list, nullable, attributes, pyStyle, javaStyle, pkg, goPkg, goPointers, swiftVar]);

  const meta = LANGS.find((l) => l.id === lang)!;

  return (
    <div>
      <div className="emoji-groups mb-md" role="group" aria-label="Langage">
        {LANGS.map((l) => (
          <button key={l.id} type="button" className={"btn" + (l.id === lang ? " is-active" : "")} aria-pressed={l.id === lang} onClick={() => setLang(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="panel-tools mb-md">
        <label className="check-row">
          Nom du type racine
          <input className="input" style={{ width: 130 }} value={rootName} onChange={(e) => setRootName(e.target.value)} />
        </label>
        {lang === "ts" && (
          <>
            <SegmentedControl<TsStyle> value={tsStyle} onChange={setTsStyle} options={[{ value: "interface", label: "interface" }, { value: "type", label: "type" }]} />
            <label className="check-row">
              <input type="checkbox" checked={optionalNull} onChange={(e) => setOptionalNull(e.target.checked)} />
              null → optionnel
            </label>
            <label className="check-row">
              <input type="checkbox" checked={readonly} onChange={(e) => setReadonly(e.target.checked)} />
              readonly
            </label>
          </>
        )}
        {lang === "cs" && (
          <>
            <SegmentedControl<CsStyle>
              value={csStyle}
              onChange={setCsStyle}
              options={[
                { value: "positional", label: "record positionnel" },
                { value: "record", label: "record { init; }" },
                { value: "class", label: "class { get; set; }" },
              ]}
            />
            <SegmentedControl<"List" | "array"> value={list} onChange={setList} options={[{ value: "List", label: "List<T>" }, { value: "array", label: "T[]" }]} />
            <label className="check-row">
              namespace
              <input className="input" style={{ width: 150 }} value={namespace} onChange={(e) => setNamespace(e.target.value)} />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={nullable} onChange={(e) => setNullable(e.target.checked)} />
              Types référence nullables (?)
            </label>
            <label className="check-row">
              <input type="checkbox" checked={attributes} onChange={(e) => setAttributes(e.target.checked)} />
              [JsonPropertyName]
            </label>
          </>
        )}
        {lang === "python" && <SegmentedControl<PyStyle> value={pyStyle} onChange={setPyStyle} options={[{ value: "pydantic", label: "Pydantic v2" }, { value: "dataclass", label: "@dataclass" }]} />}
        {lang === "java" && <SegmentedControl<JavaStyle> value={javaStyle} onChange={setJavaStyle} options={[{ value: "record", label: "record (Java 16+)" }, { value: "lombok", label: "classe Lombok" }]} />}
        {(lang === "java" || lang === "kotlin") && (
          <label className="check-row">
            package
            <input className="input" style={{ width: 170 }} value={pkg} onChange={(e) => setPkg(e.target.value)} />
          </label>
        )}
        {lang === "go" && (
          <>
            <label className="check-row">
              package
              <input className="input" style={{ width: 110 }} value={goPkg} onChange={(e) => setGoPkg(e.target.value)} />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={goPointers} onChange={(e) => setGoPointers(e.target.checked)} />
              Pointeurs pour les champs nullables
            </label>
          </>
        )}
        {lang === "swift" && (
          <label className="check-row">
            <input type="checkbox" checked={swiftVar} onChange={(e) => setSwiftVar(e.target.checked)} />
            Propriétés modifiables (var)
          </label>
        )}
      </div>
      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">JSON</span>
            <span className="meta">{input.length} car.</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">{meta.label}</span>
          </div>
          <CodeView code={error || output} language={error ? "text" : meta.hl} error={!!error} />
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
      {meta.note && (
        <p className="row-head hint" style={{ margin: "0.85rem 0 0" }}>
          {meta.note}
        </p>
      )}
    </div>
  );
}
