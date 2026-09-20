# Workbench

A design-first clone of IT-Tools: developer utilities that run entirely client-side.

## Structure

```
apps/web           Vite + React + TypeScript SPA
packages/ui         Design system: tokens, components, icons
packages/core        Shared hooks (theme, command palette)
packages/tools       Tool registry + individual tool implementations
```

Each tool is a self-contained module registered in `packages/tools/src/registry.ts`
as `{ id, name, category, description, status, Component }`. Adding a tool means
writing its component and adding one entry to that array — the home grid, the
category rail, the command palette, and routing all pick it up automatically.

`status: "ready"` tools render their component on `/tools/:id`. `status: "planned"`
tools still appear in the grid (to validate the UI at full scale) but open to an
empty state instead of a component.

## Develop

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build
```
