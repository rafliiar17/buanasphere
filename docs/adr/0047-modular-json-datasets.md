# ADR 0047: Modular JSON Datasets & Decoupled Data Architecture

## Status
Accepted

## Context
GeoGlobe micro-apps (`world-capitals`, `flora-fauna`, `earthquake-tracker`, `remittance-flow`, `passport-power`, `world-time`) previously maintained their sovereign datasets as hardcoded TypeScript object literals inside `src/lib/framework/geoglobe/data/*.ts` or embedded directly in plugin files.
For instance, `worldCapitalsData.ts` grew to 1,792 lines and `floraFaunaData.ts` to 653 lines.

This created several architectural challenges:
1. **Code Pollution**: Data layer blended directly into application code.
2. **Main Bundle Bloat**: Hundreds of kilobytes of raw geopolitical and biodiversity records were packaged directly into the initial JavaScript bundle, even when users only accessed FX rates (`/kurs`).
3. **TypeScript Compiler Overhead**: `tsc` / `bun run check` parsed and verified thousands of object literal lines on every build.
4. **Lack of Interoperability**: Data could not be reused directly by the Elysia backend, D1 seeder scripts, or external tooling.

## Decision
1. **Decouple Datasets into Pure JSON**:
   Extract all static micro-app datasets into standalone JSON files named according to plugin identity: `<plugin>_dataset.json`.
   - `capital_dataset.json` (World Capitals & Independence History)
   - `flora_fauna_dataset.json` (Nature & Biodiversity)
   - `earthquake_dataset.json` (Seismic Risks & Historical Earthquakes)
   - `flow_corridors_dataset.json` (Remittance Hubs & Transfer Rates)
   - `passport_dataset.json` (Passport Mobility & Visa Status)
   - `country_spatial_dataset.json` (Core Spatial Metadata & Centroids)

2. **File Location & Loading Strategy**:
   - Primary data files reside in `src/lib/framework/geoglobe/data/<plugin>_dataset.json` and are mirrored to `public/data/<plugin>_dataset.json` for CDN/public access.
   - Vite and Bun natively import JSON with automatic code-splitting on dynamic import.
   - Micro-app `dataLoader` functions asynchronously load these datasets with in-memory caching in `geoStore.svelte.ts`.

3. **Strict TypeScript Type Preservation**:
   - `src/lib/framework/geoglobe/data/*.ts` files retain strict TypeScript interfaces (`WorldCapitalData`, `FloraFaunaData`, etc.) and provide type-safe accessor functions.
   - Zero breaking changes to existing visual hooks, inspectors, or tests.

## Consequences
- **Positive**: Initial bundle size reduced; clean separation of data and code; fast TypeScript checks; reusable datasets for database seeders and APIs.
- **Positive**: Lazy loading enabled through Vite chunking and `geoStore` async caching.
- **Trade-off**: Requires maintaining consistent JSON format and syncing with TypeScript interfaces.
