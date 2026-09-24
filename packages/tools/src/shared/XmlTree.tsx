import { useState } from "react";
import { TreeToolbar, type ExpandCommand } from "./treeCommon";

const CHUNK = 200;

function significantChildren(el: Element): ChildNode[] {
  return Array.from(el.childNodes).filter((n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim()));
}

function xpathOf(parentPath: string, el: Element): string {
  const parent = el.parentElement;
  if (!parent) return `${parentPath}/${el.tagName}`;
  const same = Array.from(parent.children).filter((c) => c.tagName === el.tagName);
  return same.length > 1 ? `${parentPath}/${el.tagName}[${same.indexOf(el) + 1}]` : `${parentPath}/${el.tagName}`;
}

function Attributes({ el }: { el: Element }) {
  return (
    <>
      {Array.from(el.attributes).map((a) => (
        <span key={a.name}>
          {" "}
          <span className="tk-attr">{a.name}</span>
          <span className="tk-punct">=</span>
          <span className="tk-string">"{a.value}"</span>
        </span>
      ))}
    </>
  );
}

function CopyPath({ path, el }: { path: string; el: Element }) {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(what: "path" | "xml") {
    navigator.clipboard?.writeText(what === "path" ? path : new XMLSerializer().serializeToString(el)).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(null), 1000);
  }
  return (
    <span className="tree-actions">
      <button type="button" onClick={() => copy("path")} title={`Copier le chemin ${path}`}>
        {copied === "path" ? "Copié" : "xpath"}
      </button>
      <button type="button" onClick={() => copy("xml")} title="Copier l'élément">
        {copied === "xml" ? "Copié" : "xml"}
      </button>
    </span>
  );
}

function OtherNode({ node }: { node: ChildNode }) {
  const text = node.textContent ?? "";
  let content;
  if (node.nodeType === Node.COMMENT_NODE) content = <span className="tk-comment">{`<!--${text}-->`}</span>;
  else if (node.nodeType === Node.CDATA_SECTION_NODE) content = <span className="tk-cdata">{`<![CDATA[${text}]]>`}</span>;
  else if (node.nodeType === Node.DOCUMENT_TYPE_NODE) content = <span className="tk-comment">{`<!DOCTYPE ${(node as DocumentType).name}>`}</span>;
  else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE)
    content = <span className="tk-comment">{`<?${(node as ProcessingInstruction).target} ${text}?>`}</span>;
  else content = <span className="tk-text">{text.trim()}</span>;
  return (
    <div className="tree-row">
      <span className="tree-toggle-spacer" />
      {content}
    </div>
  );
}

function XmlNode({ el, path, depth, command }: { el: Element; path: string; depth: number; command: ExpandCommand }) {
  const [open, setOpen] = useState(() => (command.kind === "all" ? true : depth < command.depth));
  const [shown, setShown] = useState(CHUNK);
  const children = significantChildren(el);
  const tag = el.tagName;

  if (children.length === 0) {
    return (
      <div className="tree-row">
        <span className="tree-toggle-spacer" />
        <span className="tk-punct">&lt;</span>
        <span className="tk-tag">{tag}</span>
        <Attributes el={el} />
        <span className="tk-punct"> /&gt;</span>
        <CopyPath path={path} el={el} />
      </div>
    );
  }

  if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
    return (
      <div className="tree-row">
        <span className="tree-toggle-spacer" />
        <span className="tk-punct">&lt;</span>
        <span className="tk-tag">{tag}</span>
        <Attributes el={el} />
        <span className="tk-punct">&gt;</span>
        <span className="tk-text">{children[0].textContent?.trim()}</span>
        <span className="tk-punct">&lt;/</span>
        <span className="tk-tag">{tag}</span>
        <span className="tk-punct">&gt;</span>
        <CopyPath path={path} el={el} />
      </div>
    );
  }

  const elementCount = children.filter((c) => c.nodeType === Node.ELEMENT_NODE).length;
  return (
    <div className="tree-node">
      <div className="tree-row">
        <button type="button" className={"tree-toggle" + (open ? " open" : "")} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Replier" : "Déplier"}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <polyline points="7 5 13 10 7 15" />
          </svg>
        </button>
        <span className="tree-clickable" onClick={() => setOpen((o) => !o)}>
          <span className="tk-punct">&lt;</span>
          <span className="tk-tag">{tag}</span>
          <Attributes el={el} />
          <span className="tk-punct">&gt;</span>
          {!open && (
            <>
              <span className="tree-summary">
                {elementCount} enfant{elementCount > 1 ? "s" : ""}
              </span>
              <span className="tk-punct">&lt;/</span>
              <span className="tk-tag">{tag}</span>
              <span className="tk-punct">&gt;</span>
            </>
          )}
        </span>
        <CopyPath path={path} el={el} />
      </div>
      {open && (
        <>
          <div className="tree-children">
            {children.slice(0, shown).map((c, i) =>
              c.nodeType === Node.ELEMENT_NODE ? (
                <XmlNode key={i} el={c as Element} path={xpathOf(path, c as Element)} depth={depth + 1} command={command} />
              ) : (
                <OtherNode key={i} node={c} />
              ),
            )}
            {children.length > shown && (
              <button type="button" className="tree-more" onClick={() => setShown((s) => s + CHUNK * 5)}>
                Afficher {Math.min(CHUNK * 5, children.length - shown)} de plus ({children.length - shown} restants)
              </button>
            )}
          </div>
          <div className="tree-row">
            <span className="tree-toggle-spacer" />
            <span className="tk-punct">&lt;/</span>
            <span className="tk-tag">{tag}</span>
            <span className="tk-punct">&gt;</span>
          </div>
        </>
      )}
    </div>
  );
}

export function XmlTree({ doc, defaultDepth = 3 }: { doc: Document; defaultDepth?: number }) {
  const [command, setCommand] = useState<ExpandCommand>({ kind: "depth", depth: defaultDepth, token: 0 });
  const count = doc.getElementsByTagName("*").length;
  const root = doc.documentElement;
  return (
    <div className="tree-box">
      <TreeToolbar command={command} onCommand={setCommand} meta={`${count.toLocaleString("fr-FR")} élément${count > 1 ? "s" : ""}`} />
      <div className="tree" key={command.token}>
        {Array.from(doc.childNodes)
          .filter((n) => n !== root)
          .map((n, i) => (
            <OtherNode key={i} node={n} />
          ))}
        <XmlNode el={root} path={xpathOf("", root)} depth={0} command={command} />
      </div>
    </div>
  );
}
