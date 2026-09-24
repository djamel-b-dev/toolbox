import { useState } from "react";
import { CopyButton, Icon } from "@toolbox/ui";
import { XmlTree } from "../shared/XmlTree";
import { StructuredOutput } from "../shared/CodeView";

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

function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error("XML invalide : " + (err.textContent?.split("\n").find((l) => l.trim()) ?? ""));
  return doc;
}

export function XmlFormatterTool() {
  const [input, setInput] = useState("<root><item id=\"1\">First</item><item id=\"2\">Second</item></root>");

  let output = "";
  let error = "";
  let doc: Document | undefined;
  if (input.trim()) {
    try {
      doc = parseXml(input);
      output = serialize(doc.documentElement, 0, "  ");
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
        <StructuredOutput text={output} language="xml" error={error} tree={doc ? <XmlTree doc={doc} /> : undefined} />
        <div className="panel-tools">
          <CopyButton getText={() => output} />
        </div>
      </div>
    </div>
  );
}
