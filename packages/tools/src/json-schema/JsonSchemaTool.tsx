import { useMemo, useState } from "react";
import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { CopyButton } from "@toolbox/ui";

const EXAMPLE_SCHEMA = JSON.stringify(
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Utilisateur",
    type: "object",
    required: ["id", "email", "roles"],
    properties: {
      id: { type: "integer", minimum: 1 },
      email: { type: "string", format: "email" },
      name: { type: "string", minLength: 2 },
      roles: { type: "array", items: { enum: ["admin", "dev", "ops"] }, minItems: 1, uniqueItems: true },
      website: { type: "string", format: "uri" },
      createdAt: { type: "string", format: "date-time" },
    },
    additionalProperties: false,
  },
  null,
  2,
);

const EXAMPLE_DATA = JSON.stringify(
  { id: 0, email: "pas-un-email", name: "D", roles: ["admin", "root"], createdAt: "2026-09-24T08:00:00Z", age: 42 },
  null,
  2,
);

function inferSchema(value: unknown): Record<string, unknown> {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    if (!value.length) return { type: "array" };
    const items = value.map(inferSchema);
    const same = items.every((s) => JSON.stringify(s) === JSON.stringify(items[0]));
    return { type: "array", items: same ? items[0] : { anyOf: [...new Map(items.map((s) => [JSON.stringify(s), s])).values()] } };
  }
  if (typeof value === "object") {
    const props = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, inferSchema(v)]));
    return { type: "object", properties: props, required: Object.keys(props) };
  }
  if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return { type: "string", format: "date-time" };
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { type: "string", format: "date" };
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return { type: "string", format: "email" };
    if (/^https?:\/\//.test(value)) return { type: "string", format: "uri" };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return { type: "string", format: "uuid" };
    return { type: "string" };
  }
  return { type: typeof value };
}

const MESSAGES: Record<string, (p: Record<string, unknown>) => string> = {
  required: (p) => `propriété obligatoire manquante : « ${p.missingProperty} »`,
  type: (p) => `type attendu : ${p.type}`,
  minimum: (p) => `doit être ≥ ${p.limit}`,
  maximum: (p) => `doit être ≤ ${p.limit}`,
  exclusiveMinimum: (p) => `doit être > ${p.limit}`,
  exclusiveMaximum: (p) => `doit être < ${p.limit}`,
  minLength: (p) => `au moins ${p.limit} caractère(s)`,
  maxLength: (p) => `au plus ${p.limit} caractère(s)`,
  minItems: (p) => `au moins ${p.limit} élément(s)`,
  maxItems: (p) => `au plus ${p.limit} élément(s)`,
  uniqueItems: (p) => `éléments en double (positions ${p.j} et ${p.i})`,
  enum: (p) => `valeur autorisée : ${(p.allowedValues as unknown[]).map((v) => JSON.stringify(v)).join(", ")}`,
  const: (p) => `doit valoir ${JSON.stringify(p.allowedValue)}`,
  format: (p) => `format « ${p.format} » invalide`,
  pattern: (p) => `doit respecter le motif ${p.pattern}`,
  additionalProperties: (p) => `propriété non autorisée : « ${p.additionalProperty} »`,
};

export function JsonSchemaTool() {
  const [schema, setSchema] = useState(EXAMPLE_SCHEMA);
  const [data, setData] = useState(EXAMPLE_DATA);

  const result = useMemo(() => {
    let s: Record<string, unknown>;
    let d: unknown;
    try {
      s = JSON.parse(schema);
    } catch (e) {
      return { status: "schema-json" as const, message: e instanceof Error ? e.message : "" };
    }
    try {
      d = JSON.parse(data);
    } catch (e) {
      return { status: "data-json" as const, message: e instanceof Error ? e.message : "" };
    }
    try {
      const draft2020 = typeof s.$schema === "string" && /2019-09|2020-12/.test(s.$schema);
      const ajv = draft2020 ? new Ajv2020({ allErrors: true, strict: false }) : new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);
      const validate = ajv.compile(s);
      const valid = validate(d) as boolean;
      return { status: valid ? ("valid" as const) : ("invalid" as const), draft: draft2020 ? "2020-12" : "draft-07", errors: validate.errors ?? [] };
    } catch (e) {
      return { status: "schema-invalid" as const, message: e instanceof Error ? e.message : "" };
    }
  }, [schema, data]);

  return (
    <div>
      <div className="bench bench-2 mb-lg">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Schéma JSON</span>
            {"draft" in result && <span className="meta">{result.draft}</span>}
          </div>
          <textarea value={schema} onChange={(e) => setSchema(e.target.value)} spellCheck={false} style={{ minHeight: 300 }} />
          <div className="panel-tools">
            <button
              type="button"
              className="btn"
              onClick={() => {
                try {
                  setSchema(JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", ...inferSchema(JSON.parse(data)) }, null, 2));
                } catch {
                  /* the data panel already shows the JSON error */
                }
              }}
            >
              Générer depuis les données
            </button>
            <CopyButton getText={() => schema} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Document à valider</span>
          </div>
          <textarea value={data} onChange={(e) => setData(e.target.value)} spellCheck={false} style={{ minHeight: 300 }} />
        </div>
      </div>

      {result.status === "valid" && <div className="validation ok">✓ Document valide selon le schéma.</div>}
      {result.status === "schema-json" && <div className="validation bad">Le schéma n'est pas du JSON valide : {result.message}</div>}
      {result.status === "data-json" && <div className="validation bad">Le document n'est pas du JSON valide : {result.message}</div>}
      {result.status === "schema-invalid" && <div className="validation bad">Schéma invalide : {result.message}</div>}
      {result.status === "invalid" && (
        <>
          <div className="validation bad">
            ✗ {result.errors.length} erreur{result.errors.length > 1 ? "s" : ""} de validation
          </div>
          <div className="hash-rows mt-lg">
            {result.errors.map((e, i) => (
              <div className="hash-row" key={i} style={{ gridTemplateColumns: "minmax(90px, 200px) 1fr auto" }}>
                <span className="alg">{e.instancePath || "(racine)"}</span>
                <span className="val" style={{ fontFamily: "var(--font-body)" }}>
                  {MESSAGES[e.keyword]?.(e.params as Record<string, unknown>) ?? e.message}
                </span>
                <span className="port-tags">
                  <span>{e.keyword}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
