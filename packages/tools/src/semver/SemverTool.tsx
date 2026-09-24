import { useMemo, useState } from "react";
import * as semver from "semver";

const DIFF_LABELS: Record<string, string> = {
  major: "majeure",
  premajor: "pré-majeure",
  minor: "mineure",
  preminor: "pré-mineure",
  patch: "correctif",
  prepatch: "pré-correctif",
  prerelease: "pré-version",
};

const EXAMPLE_VERSIONS = "1.2.3\n1.10.0\n2.0.0-beta.2\n2.0.0-rc.1\n2.0.0\n0.9.12\n1.2.10";

function describeRange(range: string): string {
  try {
    const r = new semver.Range(range);
    return r.set.map((comparators) => comparators.map((c) => c.value || "*").join(" ")).join("  ||  ");
  } catch {
    return "";
  }
}

export function SemverTool() {
  const [a, setA] = useState("1.4.2");
  const [b, setB] = useState("1.10.0-beta.1");
  const [range, setRange] = useState("^1.4.0");
  const [list, setList] = useState(EXAMPLE_VERSIONS);

  const cmp = useMemo(() => {
    const va = semver.valid(a.trim());
    const vb = semver.valid(b.trim());
    if (!va || !vb) return null;
    const c = semver.compare(va, vb);
    return { c, diff: semver.diff(va, vb) };
  }, [a, b]);

  const parsed = semver.parse(a.trim());
  const rangeValid = semver.validRange(range.trim());
  const versions = list
    .split(/[\s,]+/)
    .map((v) => v.trim())
    .filter(Boolean);
  const sorted = [...versions].filter((v) => semver.valid(v)).sort(semver.compare);
  const invalid = versions.filter((v) => !semver.valid(v));
  const max = rangeValid ? semver.maxSatisfying(sorted, range) : null;

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Version A</span>
          <input className="input" value={a} onChange={(e) => setA(e.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">Version B</span>
          <input className="input" value={b} onChange={(e) => setB(e.target.value)} />
        </div>
      </div>

      <div className="hash-rows mb-lg">
        <div className="hash-row hash-row-2">
          <span className="alg">Comparaison</span>
          <span className="val">
            {cmp ? (
              <strong>
                {a.trim()} {cmp.c === 0 ? "=" : cmp.c < 0 ? "<" : ">"} {b.trim()}
              </strong>
            ) : (
              <span className="text-danger">Version invalide (format attendu : MAJEUR.MINEUR.CORRECTIF[-pré-version][+build])</span>
            )}
          </span>
        </div>
        {cmp && (
          <div className="hash-row hash-row-2">
            <span className="alg">Différence</span>
            <span className="val">{cmp.diff ? (DIFF_LABELS[cmp.diff] ?? cmp.diff) : "aucune"}</span>
          </div>
        )}
        {parsed && (
          <>
            <div className="hash-row hash-row-2">
              <span className="alg">Détail A</span>
              <span className="val">
                majeur {parsed.major} · mineur {parsed.minor} · correctif {parsed.patch}
                {parsed.prerelease.length > 0 && ` · pré-version ${parsed.prerelease.join(".")}`}
                {parsed.build.length > 0 && ` · build ${parsed.build.join(".")}`}
              </span>
            </div>
            <div className="hash-row hash-row-2">
              <span className="alg">Suivantes</span>
              <span className="val">
                {(["patch", "minor", "major"] as const).map((t) => `${t} → ${semver.inc(parsed.version, t)}`).join("   ·   ")}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <span className="field-label">Plage (npm)</span>
          <input className="input" value={range} onChange={(e) => setRange(e.target.value)} placeholder="^1.2.0, ~2.1, >=1.0 <2.0, 1.x || 3.x" />
        </div>
      </div>
      <p className="row-head hint mb-md" style={{ margin: "0 0 1rem" }}>
        {rangeValid ? (
          <>
            Équivaut à <code>{describeRange(range)}</code>
          </>
        ) : (
          <span className="text-danger">Plage invalide.</span>
        )}
      </p>

      <div className="bench bench-2">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Versions à tester</span>
            <span className="meta">{versions.length}</span>
          </div>
          <textarea value={list} onChange={(e) => setList(e.target.value)} spellCheck={false} />
        </div>
        <div className="panel">
          <div className="panel-head">
            <span className="label">Triées · correspondance</span>
            <span className="meta">{max ? `max : ${max}` : "aucune"}</span>
          </div>
          <div className="hash-rows">
            {sorted.map((v, i) => {
              const ok = rangeValid ? semver.satisfies(v, range, { includePrerelease: false }) : false;
              return (
                <div className="hash-row hash-row-2" key={v + i}>
                  <span className="val" style={{ fontWeight: v === max ? 700 : 400 }}>
                    {v}
                  </span>
                  <span className={ok ? "text-success" : "text-danger"}>{ok ? "✓ satisfait" : "✗ hors plage"}</span>
                </div>
              );
            })}
            {invalid.length > 0 && <p className="text-danger" style={{ fontSize: ".8rem" }}>Ignorées (invalides) : {invalid.join(", ")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
