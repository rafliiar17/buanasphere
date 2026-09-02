# Verification Report: Fix Dev Proxy & Unidirectional Input Bindings (ADR-0030)

**Date:** 2026-09-02  
**Feature Branch:** `fix/dev-proxy-and-unidirectional-bindings`  
**Reference ADR:** [`docs/adr/0030-edge-dev-proxy-and-unidirectional-input-bindings.md`](file:///home/archy/Projects/kurs-world/docs/adr/0030-edge-dev-proxy-and-unidirectional-input-bindings.md)

---

## 1. Executive Summary

1. **`net::ERR_CONNECTION_REFUSED`**: Resolved by updating Vite's dev server proxy target in `frontend/vite.config.ts` from hardcoded `localhost:8787` to the live Cloudflare Workers Edge API (`https://kurs-world-api.rafztesting.workers.dev`). Standalone frontend local development now retrieves live rates with `200 OK` without requiring a local background worker.
2. **`[svelte] binding_property_non_reactive`**: Resolved by refactoring `bind:value` on `mapState.searchQuery` and `mapState.convertAmount` in `MapControlsToolbar.svelte` to standard Svelte 5 unidirectional bindings (`value` + `oninput`).

---

## 2. Verification Matrix

| Area / Symptom | Defect Cause | Fixed State (ADR-0030) | Status |
|---|---|---|---|
| **Dev API Network Failure** | Hardcoded `http://localhost:8787` in `vite.config.ts` | Edge-first fallback: `process.env.VITE_API_URL || 'https://kurs-world-api.rafztesting.workers.dev'` | **Verified** |
| **Search Input Binding** | `bind:value={mapState.searchQuery}` on prop object | Unidirectional `value={mapState.searchQuery}` + `oninput={...}` | **Verified** |
| **Convert Amount Input** | `bind:value={mapState.convertAmount}` on prop object | Unidirectional `value={mapState.convertAmount}` + `oninput={...}` | **Verified** |
| **Unit Test Suite** | 231 tests | **231 pass across 33 test files** | **Verified** |

---

## 3. Automated Quality Verification Gates

```bash
# 1. Full Test Suite (33 files, 231 tests)
$ bun test
✓ 231 pass, 0 fail (15865 expect calls)

# 2. Svelte & TypeScript Typecheck
$ cd frontend && bun run check
svelte-check found 0 errors and 0 warnings

# 3. Production Vite Bundle Build
$ cd frontend && bun run build
✓ built in 40.62s
```

---

## 4. Conclusion
The bug fix is verified, stable, and ready for PR merge and automated Cloudflare deployment.
