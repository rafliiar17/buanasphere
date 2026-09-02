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

4. **SDLC Pipeline (`/plan` ➔ `/to-spec` ➔ `/tdd` ➔ `implement` ➔ `check hasil/plan`)**:
   - **Tahap 1 (`/plan`)**: Analisis masalah, telusuri codebase, susun `implementation_plan.md`, minta persetujuan user.
   - **Tahap 2 (`/to-spec`)**: Tulis ADR / Technical Spec di `docs/`, buat branch fitur baru (`feat/...`, `fix/...`).
   - **Tahap 3 (`/tdd`)**: Tulis unit/integration test dulu (*Red State*), jalankan `rtk bun test`.
   - **Tahap 4 (`implement`)**: Tulis kode implementasi hingga test lulus (*Green State*), lakukan refactor bersih.
   - **Tahap 5 (`check hasil/plan`)**: Jalankan quality gates (`rtk bun run check`, `rtk bun test`, `rtk bun run build`), buat `walkthrough.md`, dan commit dengan conventional commits.

5. **Git Safety & SDLC**:
   - Never push directly to `main`.
   - Work on feature/fix branches with conventional commits (`feat:`, `fix:`, `wip:` during TDD).
