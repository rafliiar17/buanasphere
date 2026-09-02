// Runtime polyfill for Svelte 5 Runes in test environments (e.g. Bun test)
if (typeof (globalThis as any).$state === 'undefined') {
  (globalThis as any).$state = <T>(v: T): T => v;
}
if (typeof (globalThis as any).$derived === 'undefined') {
  const derivedFn: any = <T>(v: T): T => v;
  derivedFn.by = <T>(fn: () => T): T => fn();
  (globalThis as any).$derived = derivedFn;
}

import { describe, it, expect } from 'bun:test';
import { 
  createMapState, 
  REGION_FILTERS, 
  METRIC_OPTIONS 
} from '../src/lib/features/map/mapState.svelte';
import { COUNTRY_CURRENCY_MAP } from '../src/lib/features/map/map-constants';

describe('Modular Map Architecture & State Store Unit Tests (SDLC)', () => {
  describe('Map State Store Runes Lifecycle & Reactivity', () => {
    it('initializes map state store with default projection (globe) and metric (rate)', () => {
      const state = createMapState();
      expect(state.projectionMode).toBe('globe');
      expect(state.activeMetric).toBe('rate');
      expect(state.activeRegion).toBe('all');
      expect(state.showLabels).toBe(true);
      expect(state.isInspectorOpen).toBe(false);
      expect(state.selectedCurrencyCode).toBe('USD');
    });

    it('updates metric and projection state correctly', () => {
      const state = createMapState();
      state.setMetric('flag');
      expect(state.activeMetric).toBe('flag');

      state.setProjection('flat');
      expect(state.projectionMode).toBe('flat');

      state.setRegion('asean');
      expect(state.activeRegion).toBe('asean');
    });

    it('handles country selection and inspector toggling', () => {
      const state = createMapState();
      state.selectCountry('IDN', 'IDR');
      expect(state.selectedCountryIso3).toBe('IDN');
      expect(state.selectedCurrencyCode).toBe('IDR');

      state.openInspector();
      expect(state.isInspectorOpen).toBe(true);

      state.closeInspector();
      expect(state.isInspectorOpen).toBe(false);
    });

    it('filters search suggestions by query', () => {
      const state = createMapState();
      state.setSearchQuery('indonesia');
      const results = state.getSearchResults(COUNTRY_CURRENCY_MAP);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].iso3).toBe('IDN');
    });
  });

  describe('Constant & Metadata Definitions', () => {
    it('provides all 8 region filter presets', () => {
      expect(REGION_FILTERS.length).toBe(8);
      const ids = REGION_FILTERS.map(r => r.id);
      expect(ids).toContain('all');
      expect(ids).toContain('asean');
      expect(ids).toContain('europe');
      expect(ids).toContain('americas');
      expect(ids).toContain('middle_east');
      expect(ids).toContain('africa');
      expect(ids).toContain('east_asia');
      expect(ids).toContain('oceania');
    });

    it('provides all 3 visualization metric options', () => {
      expect(METRIC_OPTIONS.length).toBe(3);
      const metricIds = METRIC_OPTIONS.map(m => m.id);
      expect(metricIds).toContain('rate');
      expect(metricIds).toContain('change');
      expect(metricIds).toContain('flag');
    });
  });
});
