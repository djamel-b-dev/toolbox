import type { ReactNode } from "react";
import { Icon } from "./icons";
import { StatusPill } from "./StatusPill";

interface ToolPageHeaderProps {
  title: string;
  description: string;
  onBack: () => void;
  statusLabel?: ReactNode;
  statusTone?: "success" | "neutral";
}

export function ToolPageHeader({ title, description, onBack, statusLabel, statusTone }: ToolPageHeaderProps) {
  return (
    <div className="tool-head">
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="arrow-left" /> Workbench
      </button>
      <h1>{title}</h1>
      <p>{description}</p>
      {statusLabel && <StatusPill tone={statusTone}>{statusLabel}</StatusPill>}
    </div>
  );
}
