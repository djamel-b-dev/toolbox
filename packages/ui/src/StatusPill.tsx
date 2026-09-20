import type { ReactNode } from "react";

export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="status-pill">
      <span className="dot" />
      {children}
    </span>
  );
}
