# ADR 0012: Codebase Simplification & Adapter Consolidation (Ponytail)

## Status
Accepted

## Context
During codebase growth, repetitive boilerplate and wrapper classes accumulated across the backend rate provider adapters (`bi.ts`, `bca.ts`, `mandiri.ts`), route parameter parsers, and logger helpers. A repository-wide Ponytail audit identified opportunities to eliminate ~250 lines of duplicate code, remove an unneeded dependency (`@types/pino`), and consolidate synthetic bank adapters into a single, maintainable base adapter.

## Decision
1. **Consolidate Synthetic Bank Providers**:
   - Create a reusable `SyntheticBankProvider` in `backend/src/provider/synthetic.ts` that handles retail spread multipliers over baseline spot rates.
   - Refactor `bi.ts`, `bca.ts`, and `mandiri.ts` to instantiate or extend `SyntheticBankProvider` cleanly without duplicating boilerplate loops.
2. **Remove Unused Dependency**:
   - Remove `@types/pino` from `backend/package.json` (Pino v9 includes native TypeScript definitions).
3. **Dead Code Cleanup**:
   - Remove unused `logEvent` wrapper in `backend/src/logger/index.ts`.
4. **Parameter Extraction Helper**:
   - Consolidate currency pair query extraction in `backend/src/routes/`.

## Consequences
- **Positive**: Reduced code duplication, simplified provider maintenance, cleaner type definitions, and smaller bundle footprint.
- **Backward Compatibility**: All exports and public interfaces remain 100% compatible.
