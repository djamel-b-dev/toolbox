import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

const FUNCS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  log: Math.log,
  log10: Math.log10,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

function evaluate(expr: string): number {
  const s = expr.replace(/\s+/g, "");
  let pos = 0;
  const peek = () => s[pos];
  const fail = (msg: string): never => {
    throw new Error(msg);
  };

  function parseExpr(): number {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = s[pos++];
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = s[pos++];
      const rhs = parseFactor();
      if (op === "*") value *= rhs;
      else if (op === "/") value /= rhs;
      else value %= rhs;
    }
    return value;
  }

  function parseFactor(): number {
    const value = parseUnary();
    if (peek() === "^") {
      pos++;
      return Math.pow(value, parseFactor());
    }
    return value;
  }

  function parseUnary(): number {
    if (peek() === "-") {
      pos++;
      return -parseUnary();
    }
    if (peek() === "+") {
      pos++;
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    if (peek() === "(") {
      pos++;
      const value = parseExpr();
      if (peek() !== ")") fail("Parenthèse fermante attendue.");
      pos++;
      return value;
    }
    const numMatch = /^\d+(\.\d+)?/.exec(s.slice(pos));
    if (numMatch) {
      pos += numMatch[0].length;
      return Number(numMatch[0]);
    }
    const identMatch = /^[a-zA-Z]+/.exec(s.slice(pos));
    if (identMatch) {
      const name = identMatch[0];
      pos += name.length;
      if (peek() === "(") {
        pos++;
        const args: number[] = [parseExpr()];
        while (peek() === ",") {
          pos++;
          args.push(parseExpr());
        }
        if (peek() !== ")") fail("Parenthèse fermante attendue.");
        pos++;
        if (name in FUNCS) return FUNCS[name](...args);
        fail(`Fonction inconnue : ${name}`);
      }
      if (name in CONSTS) return CONSTS[name];
      fail(`Symbole inconnu : ${name}`);
    }
    return fail("Expression invalide.");
  }

  if (!s) return NaN;
  const result = parseExpr();
  if (pos < s.length) fail("Caractères inattendus en fin d'expression.");
  return result;
}

export function MathEvalTool() {
  const [expr, setExpr] = useState("sqrt(2) * (3 + 4) ^ 2");

  let result = "";
  let error = "";
  if (expr.trim()) {
    try {
      const value = evaluate(expr);
      result = Number.isFinite(value) ? String(value) : "Résultat non défini";
    } catch (e) {
      error = e instanceof Error ? e.message : "Expression invalide.";
    }
  }

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Expression</span>
          <input className="input" value={expr} onChange={(e) => setExpr(e.target.value)} />
        </div>
      </div>
      <p className="row-head hint" style={{ margin: "-0.5rem 0 1rem" }}>
        Opérateurs + − × ÷ % ^, parenthèses, et sqrt, abs, sin, cos, tan, log, log10, floor, ceil, round, min, max, pow, pi, e.
      </p>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Résultat</span>
        </div>
        <pre className={error ? "is-error" : undefined}>{error || result || "—"}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => result} />
        </div>
      </div>
    </div>
  );
}
