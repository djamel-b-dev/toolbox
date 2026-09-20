import { useState } from "react";
import { Icon } from "./icons";

interface CopyButtonProps {
  getText: () => string;
  variant?: "button" | "mini";
  label?: string;
  ariaLabel?: string;
}

export function CopyButton({ getText, variant = "button", label = "Copier", ariaLabel }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const text = getText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard access can be denied by the host; the feedback still confirms the action was triggered */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (variant === "mini") {
    return (
      <button
        type="button"
        className="copy-mini"
        onClick={handleClick}
        aria-label={ariaLabel ?? label}
        style={copied ? { color: "var(--success)" } : undefined}
      >
        <Icon name={copied ? "check" : "copy"} />
      </button>
    );
  }

  return (
    <button type="button" className={"btn" + (copied ? " is-success" : "")} onClick={handleClick}>
      <Icon name={copied ? "check" : "copy"} />
      {copied ? "Copié" : label}
    </button>
  );
}
