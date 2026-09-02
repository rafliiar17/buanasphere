# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Read AGENTS.md First
The primary source of truth for repository standards, SDLC lifecycle, Git safety rules, testing strategy, and UI/UX mandates is [**`AGENTS.md`**](file:///home/archy/Projects/kurs-world/AGENTS.md) and [**`CONTEXT.md`**](file:///home/archy/Projects/kurs-world/CONTEXT.md).

## Tech Stack Overview
- **Backend & Ingestion**: **Elysia.js** (TypeScript on Bun) running on **Cloudflare Workers**.
- **Storage & Edge Cache**: Cloudflare D1 (Drizzle ORM) + Cloudflare KV.
- **Frontend**: **Svelte 5 (Runes)**, Vite / SvelteKit, Tailwind CSS v4, shadcn-svelte (Bits UI).
- **Runtime & Tooling**: **Bun (v1.4+)** & **Wrangler**.

## Quick Command Reference

All bash commands MUST be prefixed with `rtk` (Rust Token Killer) for token efficiency.

### Backend & Cloudflare Workers (Elysia.js)
```bash
rtk bun run dev                  # start local Elysia / Svelte development server
rtk bun run test                 # run Vitest / Bun test suite
rtk bun run test:watch           # watch mode testing
rtk bun run lint                 # run ESLint and type checks
rtk bun run db:generate          # generate Drizzle migrations for D1
rtk bun run db:migrate:local     # apply migrations to local D1 database
rtk wrangler dev                 # run Cloudflare Workers local environment
rtk wrangler deploy              # deploy Worker to Cloudflare
```

### Frontend (Svelte 5 + Bun)
```bash
rtk bun install                  # install dependencies via Bun
rtk bun --filter frontend dev    # run Svelte dev server
rtk bun --filter frontend build  # type-check and build Svelte SPA bundle
rtk bun --filter frontend check  # run svelte-check
rtk bun --filter frontend test   # run frontend unit & integration tests
```

## SDLC Workflow (`/plan` ➔ `/to-spec` ➔ `/tdd` ➔ `implement` ➔ `check hasil/plan`)
1. **`/plan`**: Requirement analysis, codebase exploration, write `implementation_plan.md`, get user approval.
2. **`/to-spec`**: Write ADR (`docs/adr/`) or Tech Spec (`docs/specs/`), create feature branch (`feat/...`, `fix/...`).
3. **`/tdd`**: Write unit/integration tests first (*Red State*), run `rtk bun test`.
4. **`implement`**: Implement production code until tests pass (*Green State*), refactor cleanly.
5. **`check hasil/plan`**: Run quality gates (`check`, `test`, `build`), generate `walkthrough.md`, commit with conventional commits.

## UI/UX Mandate
- **shadcn-svelte (Bits UI) Only**: Always use official shadcn-svelte components (`Select`, `Dialog`, `Alert`, `Button`, `Input`, `Tabs`, `Popover`, `Badge`, `Card`, `Table`). Avoid unstyled HTML elements.
- **High-Fidelity Shimmer Skeletons**: Every async data view must include a pixel-matching shimmer skeleton (`animate-shimmer`) to eliminate Cumulative Layout Shift (CLS).

## Documentation Structure
Never place loose markdown files in workspace root. All docs belong in:
- `docs/adr/`: Architecture Decision Records (`0001-xxx.md`)
- `docs/specs/`: PRD, Technical Specs, Design Specs
- `docs/brief/`: Project Briefs
- `docs/guides/`: Setup and operational guides
- `docs/reports/`: Security audits & benchmark reports
- `docs/runbooks/`: Deployment & operations runbooks
- `docs/research/`: Provider APIs and research data
- **Root Whitelist**: Only `README.md`, `ARCHITECTURE.md`, `CONTEXT.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
