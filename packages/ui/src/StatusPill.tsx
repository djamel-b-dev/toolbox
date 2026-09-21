import type { ReactNode } from "react";

interface StatusPillProps {
  children: ReactNode;
  tone?: "success" | "neutral";
}

export function StatusPill({ children, tone = "success" }: StatusPillProps) {
  return (
    <span className={"status-pill" + (tone === "neutral" ? " neutral" : "")}>
      <span className="dot" />
      {children}
    </span>
  );
}
