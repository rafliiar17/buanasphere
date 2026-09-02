/**
 * ADR-0033: Frontend Diagnostic Remediation — Unit Tests (TDD)
 *
 * Verifies the four bug fixes identified in the system diagnostics audit:
 *   Bug 1 — Globe3DView: previousMetric as plain closure var (not $state)
 *   Bug 2 — GoogleRateChart: untrack() used for selectedRange in $effect
 *   Bug 3 — Globe3DView: onDestroy calls disposeProceduralFlagCache + renderer.dispose()
 *   Bug 4 — CurrencyConverter: no duplicate performConversion in onMount
 *
 * These are source-level assertion tests that read the .svelte files as raw text
 * and verify the presence/absence of specific patterns — compatible with Bun/Vitest
 * without requiring a DOM/Svelte test environment.
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dir, '..');

function readSource(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

// ---------------------------------------------------------------------------
// Bug 1 — Globe3DView: previousMetric must NOT be $state (cyclic $effect)
// ---------------------------------------------------------------------------
describe('Bug 1 — Globe3DView: previousMetric closure var (ADR-0033)', () => {
  let source: string;

  beforeAll(() => {
    source = readSource('src/lib/features/map/components/Globe3DView.svelte');
  });

  it('should NOT declare previousMetric as $state', () => {
    // After fix, this reactive declaration must be absent
    expect(source).not.toContain("let previousMetric = $state");
  });

  it('should declare previousMetric as a plain closure variable (string)', () => {
    // Must use simple let assignment with string type or empty string literal
    const hasBareDeclaration =
      source.includes("let previousMetric = ''") ||
      source.includes('let previousMetric = ""');
    expect(hasBareDeclaration).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 2 — GoogleRateChart: untrack() must be imported and used in $effect
// ---------------------------------------------------------------------------
describe('Bug 2 — GoogleRateChart: untrack() prevents currency reset (ADR-0033)', () => {
  let source: string;

  beforeAll(() => {
    source = readSource('src/lib/features/chart/GoogleRateChart.svelte');
  });

  it('should import untrack from svelte', () => {
    // The fix must add untrack to the svelte imports
    expect(source).toMatch(/import\s*\{[^}]*untrack[^}]*\}\s*from\s*['"]svelte['"]/);
  });

  it('should use untrack() to read selectedRange inside the initialCurrency $effect', () => {
    // The fix wraps selectedRange read in untrack()
    expect(source).toContain('untrack(');
    expect(source).toContain('selectedRange');
  });

  it('should call loadChartData inside the initialCurrency $effect', () => {
    // Ensure the effect still invokes data loading
    expect(source).toContain('loadChartData(initialCurrency');
  });
});

// ---------------------------------------------------------------------------
// Bug 3 — Globe3DView: onDestroy must call disposeProceduralFlagCache AND
//          renderer.dispose() for WebGL context cleanup
// ---------------------------------------------------------------------------
describe('Bug 3 — Globe3DView: WebGL renderer disposal in onDestroy (ADR-0033)', () => {
  let source: string;

  beforeAll(() => {
    source = readSource('src/lib/features/map/components/Globe3DView.svelte');
  });

  it('should call disposeProceduralFlagCache() in onDestroy', () => {
    expect(source).toContain('disposeProceduralFlagCache()');
  });

  it('should obtain and dispose the Three.js WebGL renderer', () => {
    // After fix: renderer obtained via globeInstance.renderer?.()
    expect(source).toContain('globeInstance.renderer?.()');
  });

  it('should call renderer.dispose?.() to free WebGL resources', () => {
    expect(source).toContain('renderer.dispose?.()');
  });

  it('should call renderer.forceContextLoss?.() to release GPU context', () => {
    expect(source).toContain('renderer.forceContextLoss?.()');
  });

  it('should clear the Three.js scene via scene.clear?.()', () => {
    expect(source).toContain('scene.clear?.()');
  });
});

// ---------------------------------------------------------------------------
// Bug 4 — CurrencyConverter: no duplicate performConversion in onMount
// ---------------------------------------------------------------------------
describe('Bug 4 — CurrencyConverter: no duplicate performConversion in onMount (ADR-0033)', () => {
  let source: string;

  beforeAll(() => {
    source = readSource('src/lib/features/converter/CurrencyConverter.svelte');
  });

  it('should NOT import onMount from svelte (no longer needed)', () => {
    // After removing the onMount block, the import becomes unused and must also be removed
    const importMatch = source.match(/import\s*\{([^}]*)\}\s*from\s*['"]svelte['"]/);
    if (importMatch) {
      // If there IS a svelte import, it should not contain onMount
      expect(importMatch[1]).not.toContain('onMount');
    }
    // If there is no svelte import at all, that is also acceptable
  });

  it('should NOT call performConversion inside an onMount block', () => {
    // onMount(() => { performConversion(); }) pattern must be absent
    expect(source).not.toMatch(/onMount\s*\(\s*\(\s*\)\s*=>\s*\{[\s\n]*performConversion\s*\(\s*\)\s*;[\s\n]*\}\s*\)/);
  });

  it('should still call performConversion inside the $effect block (single source of truth)', () => {
    // $effect must remain as the single trigger for performConversion
    expect(source).toContain('performConversion()');
  });
});

// ---------------------------------------------------------------------------
// Bug 5 — Globe3DView: mapData tracked as reactive dependency in $effect
// ---------------------------------------------------------------------------
describe('Bug 5 — Globe3DView: reactive dependency mapData in $effect (ADR-0033)', () => {
  let source: string;

  beforeAll(() => {
    source = readSource('src/lib/features/map/components/Globe3DView.svelte');
  });

  it('should track mapData inside the $effect block for live visual updates', () => {
    expect(source).toContain('mapData');
    expect(source).toMatch(/const\s+_data\s*=\s*mapData/);
  });
});

// ---------------------------------------------------------------------------
// Bug 6 — WorldRateMap: 2-way reactive sync between geoStore and mapState
// ---------------------------------------------------------------------------
describe('Bug 6 — WorldRateMap: 2-way reactive showLabels synchronization (ADR-0033)', () => {
  let source: string;

  beforeAll(() => {
    source = readSource('src/lib/features/map/WorldRateMap.svelte');
  });

  it('should sync geoStore.showLabels to mapState.showLabels in an $effect', () => {
    expect(source).toMatch(/mapState\.showLabels\s*=\s*geoLabels/);
  });

  it('should sync mapState.showLabels to geoStore.showLabels in an $effect', () => {
    expect(source).toMatch(/geoStore\.showLabels\s*=\s*mapLabels/);
  });
});

