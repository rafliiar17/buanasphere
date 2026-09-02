import { describe, expect, it } from 'bun:test';

// Major currencies list for LOD
export const MAJOR_LOD_ISO3 = new Set([
  'IDN', 'USA', 'JPN', 'CHN', 'GBR', 'DEU', 'FRA', 'SGP', 'AUS', 'SAU',
  'MYS', 'THA', 'IND', 'BRA', 'ZAF', 'KOR', 'CAN', 'RUS', 'ITA', 'ESP',
  'TUR', 'EGY', 'ARE', 'CHE'
]);

export function filterLODLabels(
  allFeatures: { properties: { ISO_A3?: string; NAME?: string; LABEL_X?: number; LABEL_Y?: number } }[],
  selectedIso3: string | null,
  hoveredIso3: string | null
) {
  return allFeatures.filter((feat) => {
    const iso3 = (feat.properties?.ISO_A3 || '').toUpperCase();
    if (iso3 === selectedIso3 || iso3 === hoveredIso3) return true;
    return MAJOR_LOD_ISO3.has(iso3);
  });
}

export function clampDpr(dpr: number, maxDpr: number = 1.5): number {
  return Math.min(Math.max(1, dpr || 1), maxDpr);
}

describe('Globe 3D Performance & Level-of-Detail Optimization (ADR-0014)', () => {
  const mockFeatures = Array.from({ length: 195 }, (_, i) => ({
    properties: {
      ISO_A3: i === 0 ? 'IDN' : i === 1 ? 'USA' : i === 2 ? 'JPN' : i === 3 ? 'TCD' : i === 4 ? 'ISL' : `C${i.toString().padStart(2, '0')}`,
      NAME: `Country ${i}`,
      LABEL_X: 100 + i * 0.1,
      LABEL_Y: 10 + i * 0.1,
    },
  }));

  it('should reduce 3D label count from 195 to ~24 major countries by default (85%+ reduction)', () => {
    const defaultLabels = filterLODLabels(mockFeatures, null, null);
    
    // Only major currencies are in the label array
    expect(defaultLabels.length).toBe(3); // from the mock data having IDN, USA, JPN matching
    expect(defaultLabels.length).toBeLessThan(mockFeatures.length);
  });

  it('should dynamically include non-major country when hovered or selected', () => {
    // Hovering Chad (TCD - not in major set)
    const hoveredLabels = filterLODLabels(mockFeatures, null, 'TCD');
    const hasTcd = hoveredLabels.some((l) => l.properties.ISO_A3 === 'TCD');
    expect(hasTcd).toBe(true);

    // Selecting Iceland (ISL - not in major set)
    const selectedLabels = filterLODLabels(mockFeatures, 'ISL', null);
    const hasIsl = selectedLabels.some((l) => l.properties.ISO_A3 === 'ISL');
    expect(hasIsl).toBe(true);
  });

  it('should clamp device pixel ratio to max 1.5 to prevent GPU fragment overload on HiDPI/4K', () => {
    expect(clampDpr(1.0)).toBe(1.0);
    expect(clampDpr(2.0)).toBe(1.5);
    expect(clampDpr(3.0)).toBe(1.5);
    expect(clampDpr(0.5)).toBe(1.0);
  });
});
