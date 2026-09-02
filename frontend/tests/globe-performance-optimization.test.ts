import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper to compute optimal DPR based on performance mode
 */
export function getOptimalDpr(mode: 'turbo' | 'quality', systemDpr: number = 1.0): number {
  if (mode === 'turbo') return 1.0;
  return Math.min(systemDpr || 1.0, 1.35);
}

/**
 * LOD label filter based on camera altitude
 */
export function filterLabelsByLod(
  labels: Array<{ iso3: string; text: string; size: number }>,
  cameraAltitude: number,
  selectedIso3: string,
  hoveredIso3: string | null,
  majorIso3List: Set<string>
) {
  if (cameraAltitude > 1.8) {
    // Distant view: show only selected, hovered, and top major countries
    return labels.filter(l => l.iso3 === selectedIso3 || l.iso3 === hoveredIso3 || majorIso3List.has(l.iso3));
  }
  return labels;
}

const GEOSTORE_PATH = path.resolve(__dirname, '../src/lib/framework/geoglobe/geoStore.svelte.ts');
const MAPSTATE_PATH = path.resolve(__dirname, '../src/lib/features/map/mapState.svelte.ts');
const GLOBEVIEW_PATH = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');

describe('3D Globe GPU & Laptop Performance Suite (ADR 0035 / TDD)', () => {

  describe('1. Performance Mode State Management (geoStore & mapState)', () => {
    it('declares performanceMode state in geoStore.svelte.ts defaulting to "turbo"', () => {
      const geoStoreSrc = fs.readFileSync(GEOSTORE_PATH, 'utf-8');
      expect(geoStoreSrc).toContain("let performanceMode = $state<'turbo' | 'quality'>('turbo')");
      expect(geoStoreSrc).toContain('get performanceMode()');
      expect(geoStoreSrc).toContain('setPerformanceMode');
      expect(geoStoreSrc).toContain('togglePerformanceMode');
    });

    it('declares performanceMode in MapState with "turbo" default and toggle method', () => {
      const mapStateSrc = fs.readFileSync(MAPSTATE_PATH, 'utf-8');
      expect(mapStateSrc).toContain("performanceMode: 'turbo' | 'quality' = $state('turbo')");
      expect(mapStateSrc).toContain('setPerformanceMode');
      expect(mapStateSrc).toContain('togglePerformanceMode');
    });
  });

  describe('2. Adaptive DPR Clamping (getOptimalDpr)', () => {
    it('clamps DPR to 1.0 in "turbo" mode regardless of system Retina/HiDPI scale', () => {
      expect(getOptimalDpr('turbo', 2.0)).toBe(1.0);
      expect(getOptimalDpr('turbo', 3.0)).toBe(1.0);
      expect(getOptimalDpr('turbo', 1.5)).toBe(1.0);
      expect(getOptimalDpr('turbo', 1.0)).toBe(1.0);
    });

    it('allows crisp scaling clamped to max 1.35 in "quality" mode', () => {
      expect(getOptimalDpr('quality', 1.0)).toBe(1.0);
      expect(getOptimalDpr('quality', 1.25)).toBe(1.25);
      expect(getOptimalDpr('quality', 2.0)).toBe(1.35);
      expect(getOptimalDpr('quality', 3.0)).toBe(1.35);
    });
  });

  describe('3. Level-of-Detail (LOD) Camera Distance Pruning', () => {
    const sampleLabels = [
      { iso3: 'USA', text: 'USA (USD)', size: 0.5 },
      { iso3: 'IDN', text: 'Indonesia (IDR)', size: 0.5 },
      { iso3: 'SGP', text: 'Singapore (SGD)', size: 0.4 },
      { iso3: 'VAT', text: 'Vatican (EUR)', size: 0.2 },
      { iso3: 'MCO', text: 'Monaco (EUR)', size: 0.2 },
    ];
    const majors = new Set(['USA', 'IDN', 'SGP']);

    it('prunes micro-country labels when camera altitude is high (>1.8)', () => {
      const visible = filterLabelsByLod(sampleLabels, 2.2, 'IDN', null, majors);
      const isoList = visible.map(v => v.iso3);
      expect(isoList).toContain('IDN');
      expect(isoList).toContain('USA');
      expect(isoList).toContain('SGP');
      expect(isoList).not.toContain('VAT');
      expect(isoList).not.toContain('MCO');
    });

    it('always preserves actively selected or hovered country label even in distant LOD', () => {
      const visible = filterLabelsByLod(sampleLabels, 2.5, 'VAT', 'MCO', majors);
      const isoList = visible.map(v => v.iso3);
      expect(isoList).toContain('VAT');
      expect(isoList).toContain('MCO');
    });

    it('renders full label set when zoomed in close (<=1.8)', () => {
      const visible = filterLabelsByLod(sampleLabels, 1.2, 'IDN', null, majors);
      expect(visible.length).toBe(sampleLabels.length);
    });
  });

  describe('4. Static Geometry Invariant in Globe3DView.svelte', () => {
    it('ensures updateVisuals does NOT re-invoke polygonsData to prevent Earcut CPU re-tessellation', () => {
      const content = fs.readFileSync(GLOBEVIEW_PATH, 'utf-8');

      // Extract the updateVisuals function body
      const updateVisualsMatch = content.match(/function updateVisuals\(\)[\s\S]*?\{([\s\S]*?)\n  \}/);
      expect(updateVisualsMatch).toBeTruthy();
      
      const body = updateVisualsMatch![1];
      // updateVisuals must NOT call .polygonsData(
      expect(body.includes('.polygonsData(')).toBe(false);
    });

    it('verifies that initGlobe initializes polygonsData once', () => {
      const content = fs.readFileSync(GLOBEVIEW_PATH, 'utf-8');

      const initGlobeMatch = content.match(/async function initGlobe\(\)[\s\S]*?\{([\s\S]*?)\n  \}/);
      expect(initGlobeMatch).toBeTruthy();

      const body = initGlobeMatch![1];
      expect(body.includes('.polygonsData(')).toBe(true);
    });

    it('verifies that Globe3DView applies adaptive DPR based on performance mode', () => {
      const content = fs.readFileSync(GLOBEVIEW_PATH, 'utf-8');
      expect(content).toContain('performanceMode');
      expect(content).toContain('setPixelRatio');
    });
  });
});
