import { useState } from "react";
import { CopyButton, Icon } from "@toolbox/ui";

function serialize(node: Element, depth: number, indent: string): string {
  const pad = indent.repeat(depth);
  const attrs = Array.from(node.attributes)
    .map((a) => ` ${a.name}="${a.value}"`)
    .join("");
  const children = Array.from(node.childNodes).filter((n) => !(n.nodeType === 3 && !n.textContent?.trim()));

  if (children.length === 0) return `${pad}<${node.tagName}${attrs} />`;
  if (children.length === 1 && children[0].nodeType === 3) {
    return `${pad}<${node.tagName}${attrs}>${children[0].textContent?.trim()}</${node.tagName}>`;
  }
  const inner = children
    .filter((n): n is Element => n.nodeType === 1)
    .map((el) => serialize(el, depth + 1, indent))
    .join("\n");
  return `${pad}<${node.tagName}${attrs}>\n${inner}\n${pad}</${node.tagName}>`;
}

function prettyPrintXml(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("XML invalide.");
  return serialize(doc.documentElement, 0, "  ");
}

export function XmlFormatterTool() {
  const [input, setInput] = useState("<root><item id=\"1\">First</item><item id=\"2\">Second</item></root>");

  let output = "";
  let error = "";
  if (input.trim()) {
    try {
      output = prettyPrintXml(input);
    } catch (e) {
      error = e instanceof Error ? e.message : "XML invalide.";
    }
  }

  return (
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
        <pre className={error ? "is-error" : undefined}>{error || output}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => output} />
        </div>
      </div>
    </div>
  );
}
