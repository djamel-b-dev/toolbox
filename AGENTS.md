# AGENTS.md — working guide for this repo

Workbench is a design-first clone of IT-Tools: ~70 developer utilities, 100%
client-side, no backend. This file exists so the next session (human or agent)
doesn't have to re-derive decisions already made. Read this before adding a
tool or a page.

## Stack & structure

npm workspaces monorepo, no build step for internal packages (Vite aliases
resolve them straight to `src/`, see `apps/web/vite.config.ts`).

```
apps/web             Vite + React + TypeScript SPA (the actual app)
packages/ui           Design system: tokens.css, base.css, components.css,
                       + presentational components (Topbar, Rail, ToolCard, …)
packages/core          Shared hooks with no UI: useTheme, useFavorites,
                       useCustomTools, useCommandPalette — each one owns its
                       own localStorage key and is otherwise stateless
packages/tools         The built-in tool catalog: one folder per tool under
                       src/<id>/<Name>Tool.tsx, wired into src/registry.ts
```

Dependency direction is one-way: `apps/web` → `packages/tools` →
`packages/ui`/`packages/core`. `packages/ui` never imports from `tools` —
its components take plain props (id/name/category as strings), not
`ToolDefinition`. Keep it that way; it's what lets `ui` stay reusable.

## Commands

```bash
npm install                  # once, from repo root
npm run dev                  # apps/web on :5173
npm run build                # tsc -b && vite build, apps/web
```

There's no separate lint/test command yet. Verification so far has been:
`tsc -b --noEmit` (must be clean), `npm run build` (must be clean, and check
that new heavy deps land in their own chunk, not the main bundle — see
"Lazy-load every tool" below), then click through it in the browser preview.

## Adding a new built-in tool

This is the most common task. Steps, in order:

1. `packages/tools/src/<id>/<Name>Tool.tsx` — the component. No props needed
   for a standalone tool; it reads/writes its own local state.
2. In `packages/tools/src/registry.ts`:
   - add a `const XTool = lazy(() => import("./<id>/<Name>Tool").then((m) => ({ default: m.<Name>Tool })));`
     at the top (**always lazy** — see below, this is not optional)
   - add a `ToolDefinition` entry to the `TOOLS` array: `{ id, name, category,
     description, status: "ready", Component: XTool }`
   - `category` is a free string; if it's new, it just appears as a new
     section in the rail automatically (`CATEGORIES` is derived from `TOOLS`)
3. If the tool needs shared logic another tool might also want (diff, ipv4
   math, subject/SAN building for certs…), put it in `packages/tools/src/shared/`
   and import from both, rather than duplicating.
4. Verify: `tsc -b --noEmit`, `npm run build`, then actually click through it
   in the browser (see Verification below) — type-check passing does not mean
   the UI renders or the logic is correct.

**Lazy-load every tool, no exceptions.** `registry.ts` used to import tools
eagerly; that broke down the moment a tool needed a real dependency
(node-forge, js-yaml, sql-formatter — some of these are 200–300 KB). Every
entry is `lazy()`, and `ToolPage.tsx` wraps rendering in `<Suspense>`. Check
the build output after adding a tool: a new heavy dependency should show up
as its *own* chunk, and `index-*.js` (the main bundle) should barely move.
If it doesn't, something is importing eagerly.

**Reuse the design system before writing new CSS.** The `packages/ui`
component set plus these `components.css` classes cover almost every tool
shape already built:
- `.panel` / `.panel-head` / `.panel-tools` — a labeled box with a textarea
  or `<pre>` and action buttons underneath
- `.bench` (add `.bench-2` for an even 1fr/1fr split) — two panels side by
  side with a directional arrow between them (encode/decode, before/after)
- `.hash-rows` / `.hash-row` (add `.hash-row-2` for a simple label→value row
  with no copy button) — a list of computed output rows, each with its own
  mini copy button. This is the single most reused pattern in the codebase —
  reach for it before inventing a new list layout.
- `.field` / `.field-row` / `.input` — labeled form inputs
- Utility classes: `.mb-sm/md/lg/xl` (spacing), `.text-success`/`.text-danger`
  (status color without inline `style`), `.pre-compact` (smaller monospace
  block, used for PEM output)
- `CopyButton`, `SegmentedControl`, `StatusPill` from `@toolbox/ui` — don't
  hand-roll copy-to-clipboard or a toggle control again

If you do need new CSS, check the existing tools for a similar shape first —
most of the ~70 tools in this repo compose the same eight or so classes.

## State & the `AppContext`

`apps/web/src/Layout.tsx` is the one place that owns cross-cutting state
(favorites, recents, category filter, the merged tool list) and passes it
down via `<Outlet context={...}>`. Pages read it with
`useOutletContext<AppContext>()`. If a new page needs something that isn't in
`AppContext` yet, add it there rather than reaching for a new context
provider — there's deliberately only one.

`useAllTools()` (`apps/web/src/useAllTools.tsx`) merges the static built-in
`TOOLS` with custom tools from `useCustomTools()` into one array. **Always
look up tools through `context.tools`, never import `TOOLS` from
`@toolbox/tools` directly in a page** — the static import misses custom
tools entirely, which means favoriting/opening/searching a user-created tool
would silently fail. `Layout.tsx`, `Home.tsx`, `Favorites.tsx`, `ToolPage.tsx`
all follow this; keep new pages consistent.

## Custom tools (the closest thing to a plugin system)

Users can add their own tool from "Créer un outil" without a rebuild: a
name, description, category (existing or new), and a JS function body
(`input => output`) executed with `new Function("input", code)`. Stored in
`localStorage` under `workbench:custom-tools`
(`packages/core/src/useCustomTools.ts`), rendered by
`apps/web/src/CustomToolRunner.tsx`.

This is deliberately **not sandboxed** — same-origin, same page permissions,
by design, for a single user's own scripts. The creation UI says so
explicitly. Don't quietly extend this into "install someone else's plugin
from a URL" without redesigning the trust model first (iframe sandbox +
postMessage protocol + permissions) — that's a separate, bigger project, not
an incremental change to this one.

A new category created this way gets its own "Mes catégories" section
pinned directly under Favoris in the rail (`Rail.tsx`'s `customCategories`
prop), separate from the built-in `CATEGORIES` list — this was a specific,
explicit user requirement, not an accident. Don't merge the two lists.

## The rail: two invariants that were bugs before

- **Active category always reflects the tool actually open**, derived in
  `Layout.tsx` from the current tool's real `category` — never from
  "whatever category filter button was last clicked." If you add a new way
  to navigate to a tool, make sure it still goes through `openTool()`.
- **Only one category is expanded at a time** (single-open accordion,
  state lives in `Rail.tsx`). Selecting a category also expands it.

## Verification workflow / known gotchas

- Use the `preview_start` browser tool against the `web` launch config
  (`.claude/launch.json`), not a raw shell command, so you get a real
  browser to click through.
- **Vite HMR can get stuck** after a `useState` initializer's *shape*
  changes (e.g. `Set<string>` → `string | null`) — React Fast Refresh
  sometimes keeps a stale closure alive and throws
  `ReferenceError: <oldVariableName> is not defined` from a cached chunk,
  even after restarting the dev server. The source is fine; the browser
  tab isn't. Open a **fresh tab** (or hard-reload) before trusting a
  console error that references a variable name you already renamed.
- Relatedly: **always check console errors in a tab that just navigated
  fresh**, not one that's been open for the whole session — a long-lived
  tab accumulates console history across server restarts and shows
  `ERR_CONNECTION_REFUSED` noise from your own restarts. If a screenshot
  and `location.pathname` (read via `javascript_tool`) ever disagree, trust
  neither until you open a new tab and re-check.
- `window.confirm()` (used for the delete-tool confirmation) gets
  auto-dismissed by the browser automation tooling. To test the confirmed
  path, stub it first: `window.confirm = () => true` via `javascript_tool`.
- For any ambient-module npm package whose `@types` package declares
  everything inside `declare module "x" { namespace foo {...} }` with no
  `export =`/`export default` (check the `.d.ts` before assuming) —
  `import * as x from "x"`, not `import x from "x"`. Got this wrong once
  for `node-forge`; would have been a silent runtime failure, not a
  type error, since `esModuleInterop` is off in this repo's `tsconfig`.
- `.gitignore` had a leftover Visual Studio/.NET NuGet rule
  (`**/[Pp]ackages/*`) that silently excluded the entire `packages/`
  workspace for most of this project's history. It's gone now — if a
  `git status` ever looks suspiciously empty for a directory that should
  have content, `git check-ignore -v <path>` first, don't assume the dir is
  actually empty.

## Conventions

- UI copy is French throughout (`fr` locale). Match the existing tone:
  direct, no filler ("Copié" not "Copié avec succès !").
- No comments unless they explain a non-obvious *why* (see examples in
  `Layout.tsx`'s favorites-redirect effect or `useCustomTools.ts`'s catch
  blocks). Don't restate what the code already says.
- Commit messages: what changed and why it matters, not a line-by-line
  diff recap. Only commit when asked.
