import type { ComponentType, LazyExoticComponent } from "react";

export interface ToolDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "ready" | "planned";
  Component?: ComponentType | LazyExoticComponent<ComponentType>;
  /** True for a tool the user authored themselves (see @toolbox/core's useCustomTools). */
  custom?: boolean;
  /**
   * Overrides the default "Calculé en local — aucune requête réseau" status pill.
   * Every tool is local-only except the ones that explicitly set this — keep it
   * that way; don't add a tool that silently calls out to the network.
   */
  statusLabel?: string;
  /** "neutral" for a tool whose status pill isn't a "this is safe" claim (e.g. it does call the network). Defaults to "success". */
  statusTone?: "success" | "neutral";
}
