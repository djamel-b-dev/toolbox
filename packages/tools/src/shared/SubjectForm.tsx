import type { SubjectFields } from "./certSubject";

interface SubjectFormProps {
  fields: SubjectFields;
  onChange: (fields: SubjectFields) => void;
}

export function SubjectForm({ fields, onChange }: SubjectFormProps) {
  function set<K extends keyof SubjectFields>(key: K, value: string) {
    onChange({ ...fields, [key]: value });
  }

  return (
    <>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Nom commun (CN)</span>
          <input className="input" value={fields.cn} onChange={(e) => set("cn", e.target.value)} placeholder="example.com" />
        </div>
        <div className="field" style={{ maxWidth: 90 }}>
          <span className="field-label">Pays</span>
          <input
            className="input"
            value={fields.country}
            onChange={(e) => set("country", e.target.value.toUpperCase().slice(0, 2))}
            placeholder="FR"
          />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Organisation</span>
          <input className="input" value={fields.org} onChange={(e) => set("org", e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Unité organisationnelle</span>
          <input className="input" value={fields.ou} onChange={(e) => set("ou", e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Ville</span>
          <input className="input" value={fields.locality} onChange={(e) => set("locality", e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">État / Région</span>
          <input className="input" value={fields.state} onChange={(e) => set("state", e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Email</span>
          <input className="input" value={fields.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
    </>
  );
}
