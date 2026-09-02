# GEMINI.md

This file provides guidance to Gemini / Antigravity agents when operating in the **`kurs-world`** workspace.

## Primary Source of Truth
Refer to [**`AGENTS.md`**](file:///home/archy/Projects/kurs-world/AGENTS.md) for full engineering standards, SDLC lifecycle, Git safety rules, testing strategy, and UI/UX mandates. Refer to [**`CONTEXT.md`**](file:///home/archy/Projects/kurs-world/CONTEXT.md) for ubiquitous domain language.

## Tech Stack
- **Backend**: **Elysia.js** (TypeScript on Bun) deployed on **Cloudflare Workers**.
- **Database & Cache**: Cloudflare D1 (Drizzle ORM) + Cloudflare KV.
- **Frontend**: **Svelte 5 (Runes)**, Vite / SvelteKit, Tailwind CSS v4, shadcn-svelte (Bits UI).
- **Package Manager & Runtime**: **Bun (v1.4+)** & **Wrangler**.

## Key Rules for Antigravity

1. **Tool Invocation Schema Rules**:
   - **Absolute Paths Only**: Always use full absolute paths (`/home/archy/Projects/kurs-world/...`) for all file operations. Never use tilde (`~`) or relative paths.
   - **Required Schema Fields**: Ensure `TargetFile`, `Overwrite`, `CodeContent`, `Description`, `toolAction`, and `toolSummary` are strictly passed for file writing.

2. **Command Execution**:
   - Always prefix terminal commands with `rtk` (e.g. `rtk bun run test`, `rtk wrangler dev`).

3. **Frontend UI/UX Standards**:
   - Use official shadcn-svelte components (`Select`, `Dialog`, `Alert`, `Button`, `Input`, `Tabs`, `Badge`, `Card`, `Table`).
   - Implement pixel-accurate shimmer skeleton loading states (`animate-shimmer`) for all async data-fetching views.

4. **Git Safety & SDLC**:
   - Never push directly to `main`.
   - Work on feature/fix branches with conventional commits (`feat:`, `fix:`, `wip:` during TDD).
