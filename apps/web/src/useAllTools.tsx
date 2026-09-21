import { useMemo } from "react";
import { TOOLS, type ToolDefinition } from "@toolbox/tools";
import { useCustomTools } from "@toolbox/core";
import { CustomToolRunner } from "./CustomToolRunner";

export function useAllTools() {
  const { tools: customTools, addTool, updateTool, removeTool } = useCustomTools();

  const tools: ToolDefinition[] = useMemo(() => {
    const customDefs: ToolDefinition[] = customTools.map((ct) => ({
      id: ct.id,
      name: ct.name,
      category: ct.category,
      description: ct.description,
      status: "ready",
      custom: true,
      Component: () => <CustomToolRunner tool={ct} />,
    }));
    return [...TOOLS, ...customDefs];
  }, [customTools]);

  return { tools, customTools, addTool, updateTool, removeTool };
}
