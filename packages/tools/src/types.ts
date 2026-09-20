import type { ComponentType, LazyExoticComponent } from "react";

export interface ToolDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "ready" | "planned";
  Component?: ComponentType | LazyExoticComponent<ComponentType>;
}
