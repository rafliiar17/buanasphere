/**
 * ADR-0034: MapState Svelte 5 Reactive Class Fix (TDD)
 *
 * Bug: Filter pewarnaan metrik (Kurs/Tren/Bendera) berfungsi (Globe berubah warna)
 * tapi indikator aktif button tidak berpindah secara visual.
 *
 * Root Cause: MapState adalah plain TypeScript class. Property mutations via
 * `this.activeMetric = metric` di method class tidak selalu di-intercept oleh
 * Svelte 5 Proxy, sehingga template {mapState.activeMetric === 'rate'} tidak re-render.
 *
 * Fix: Konversi MapState ke Svelte 5 Reactive Class dengan $state() rune pada
 * setiap mutable property via mapState.svelte.ts.
 *
 * NOTE: $state runes hanya aktif saat diproses Svelte compiler. Unit tests di Bun
 * memverifikasi source code patterns dan logic correctness (non-Svelte paths).
 */

import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const MAPSTATE_SVELTE_TS_PATH = path.resolve(
  __dirname,
  '../src/lib/features/map/mapState.svelte.ts'
);

const MAPSTATE_LEGACY_TS_PATH = path.resolve(
  __dirname,
  '../src/lib/features/map/mapState.ts'
);

const src = fs.readFileSync(MAPSTATE_SVELTE_TS_PATH, 'utf-8');

describe('MapState Svelte 5 Reactive Class (ADR-0034 / TDD)', () => {
  describe('1. File structure: mapState.svelte.ts exists and uses $state runes', () => {
    it('mapState.svelte.ts file exists', () => {
      expect(fs.existsSync(MAPSTATE_SVELTE_TS_PATH)).toBe(true);
    });

    it('uses $state() rune on activeMetric property', () => {
      expect(src).toContain("activeMetric: MetricType = $state('rate')");
    });

    it('uses $state() rune on projectionMode property', () => {
      expect(src).toContain("projectionMode: 'globe' | 'flat' = $state('globe')");
    });

    it('uses $state() rune on showLabels property', () => {
      expect(src).toContain('showLabels: boolean = $state(true)');
    });

    it('uses $state() rune on all boolean toggle properties', () => {
      expect(src).toContain('isSearchDropdownOpen: boolean = $state(false)');
      expect(src).toContain('isInspectorOpen: boolean = $state(false)');
      expect(src).toContain('isControlsCollapsed: boolean = $state(false)');
      expect(src).toContain('isRegionDropdownOpen: boolean = $state(false)');
    });

    it('uses $state() rune on numeric and string state properties', () => {
      expect(src).toContain("selectedCurrencyCode: string = $state('USD')");
      expect(src).toContain("selectedCountryIso3: string = $state('IDN')");
      expect(src).toContain('convertAmount: number = $state(1)');
      expect(src).toContain("activeRegion: string = $state('all')");
    });

    it('exports createMapState factory function', () => {
      expect(src).toContain('export function createMapState(');
    });

    it('exports MapState class', () => {
      expect(src).toContain('export class MapState {');
    });
  });

  describe('2. WorldRateMap.svelte imports from mapState.svelte', () => {
    const worldRateMapSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/lib/features/map/WorldRateMap.svelte'),
      'utf-8'
    );

    it('imports createMapState from ./mapState.svelte', () => {
      expect(worldRateMapSrc).toContain("from './mapState.svelte'");
    });

    it('does NOT import from ./mapState (legacy non-reactive)', () => {
      // After fix, WorldRateMap should not import from the legacy .ts file
      const hasLegacyImport = worldRateMapSrc.includes("from './mapState'") &&
        !worldRateMapSrc.includes("from './mapState.svelte'");
      expect(hasLegacyImport).toBe(false);
    });

    it('instantiates mapState WITHOUT outer $state() wrapper', () => {
      // The fix removes $state(createMapState()) — class uses internal $state runes
      expect(worldRateMapSrc).toContain('const mapState = createMapState()');
      expect(worldRateMapSrc).not.toContain('const mapState = $state(createMapState())');
    });
  });

  describe('3. KursControls.svelte imports from mapState.svelte', () => {
    const kursControlsSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/lib/apps/kurs/KursControls.svelte'),
      'utf-8'
    );

    it('imports type from $lib/features/map/mapState.svelte', () => {
      expect(kursControlsSrc).toContain("from '$lib/features/map/mapState.svelte'");
    });
  });

  describe('4. Logic correctness: setMetric / setProjection / toggleLabels', () => {
    it('setMetric method exists in source', () => {
      expect(src).toContain('setMetric = (metric: MetricType) =>');
      expect(src).toContain('this.activeMetric = metric;');
    });

    it('setProjection method exists in source', () => {
      expect(src).toContain('setProjection = (mode:');
      expect(src).toContain('this.projectionMode = mode;');
    });

    it('toggleLabels method flips showLabels', () => {
      expect(src).toContain('this.showLabels = !this.showLabels;');
    });

    it('setShowLabels method assigns showLabels', () => {
      expect(src).toContain('setShowLabels = (show: boolean) =>');
      expect(src).toContain('this.showLabels = show;');
    });
  });

  describe('5. Regression: old mapState.ts should no longer be the primary import', () => {
    it('mapState.ts (non-reactive) still exists for backwards compatibility', () => {
      // We keep the old file to avoid breaking any edge imports, but WorldRateMap
      // now uses mapState.svelte.ts
      expect(fs.existsSync(MAPSTATE_LEGACY_TS_PATH)).toBe(true);
    });

    it('mapState.ts does NOT contain $state runes (it is the legacy non-reactive version)', () => {
      const legacySrc = fs.readFileSync(MAPSTATE_LEGACY_TS_PATH, 'utf-8');
      expect(legacySrc).not.toContain("$state('rate')");
    });
  });
});
