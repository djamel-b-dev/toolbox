import { useState } from "react";
import { format, type SqlLanguage } from "sql-formatter";
import { CopyButton, Icon, SegmentedControl } from "@toolbox/ui";
import { CodeView } from "../shared/CodeView";

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: "sql", label: "SQL standard" },
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
];

export function SqlFormatterTool() {
  const [dialect, setDialect] = useState<SqlLanguage>("sql");
  const [input, setInput] = useState(
    "select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = true group by u.id, u.name having count(o.id) > 0 order by orders desc limit 10;",
  );

  let output = "";
  let error = "";
  if (input.trim()) {
    try {
      output = format(input, { language: dialect, keywordCase: "upper" });
    } catch (e) {
      error = e instanceof Error ? e.message : "Requête SQL invalide.";
    }
  }

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Dialecte</span>
          <SegmentedControl<SqlLanguage> value={dialect} onChange={setDialect} options={DIALECTS} />
        </div>
      </div>

      <div className="bench">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Entrée</span>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="rail-connector">
          <Icon name="arrow-right" />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Formaté</span>
          </div>
          <CodeView code={error || output} language="sql" error={!!error} />
          <div className="panel-tools">
            <CopyButton getText={() => output} />
          </div>
        </div>
      </div>
    </div>
  );
}
