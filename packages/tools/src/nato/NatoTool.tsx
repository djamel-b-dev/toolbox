import { useState } from "react";
import { CopyButton } from "@toolbox/ui";

const NATO: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot",
  G: "Golf", H: "Hotel", I: "India", J: "Juliett", K: "Kilo", L: "Lima",
  M: "Mike", N: "November", O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo",
  S: "Sierra", T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray",
  Y: "Yankee", Z: "Zulu",
  "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four",
  "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine",
};

export function NatoTool() {
  const [input, setInput] = useState("Workbench 2026");

  const words = input
    .toUpperCase()
    .split("")
    .map((c) => (c === " " ? "/" : NATO[c] ?? c));

  const output = words.join(" ");

  return (
    <div>
      <div className="panel mb-lg">
        <div className="panel-head">
          <span className="label">Texte</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ minHeight: 80 }} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="label">Alphabet OTAN</span>
        </div>
        <pre>{output || "—"}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => output} />
        </div>
      </div>
    </div>
  );
}
