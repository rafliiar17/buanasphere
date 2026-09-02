import { describe, it, expect } from 'bun:test';
import { METRIC_OPTIONS, createMapState } from '../src/lib/features/map/mapState';
import { getCountryFlagColor } from '../src/lib/features/map/country-flag-colors';
import { FLAG_PATTERNS } from '../src/lib/features/map/procedural-flags';

describe('Metric Switching & Lazy-Loading Transition Suite (ADR 0032 / TDD)', () => {
  it('1. Metric Definition & State Transitions', () => {
    const mapState = createMapState();
    expect(mapState.activeMetric).toBe('rate');

    // Switch to 24h trend
    mapState.setMetric('change');
    expect(mapState.activeMetric).toBe('change');

    // Switch to national flag mode
    mapState.setMetric('flag');
    expect(mapState.activeMetric).toBe('flag');

    // Switch back to spot rate
    mapState.setMetric('rate');
    expect(mapState.activeMetric).toBe('rate');
  });

  it('2. Transition HUD Message Resolution', () => {
    function getMetricTransitionLabel(metric: 'rate' | 'change' | 'flag'): string {
      switch (metric) {
        case 'flag':
          return 'Memuat & Memetakan Tekstur Bendera 195+ Negara...';
        case 'rate':
          return 'Mengalibrasi Shader Nilai Tukar Spot Rate...';
        case 'change':
          return 'Mengalibrasi Indikator Performa 24 Jam...';
        default:
          return 'Memperbarui Tampilan Peta...';
      }
    }

    expect(getMetricTransitionLabel('flag')).toContain('Bendera 195+ Negara');
    expect(getMetricTransitionLabel('rate')).toContain('Nilai Tukar Spot Rate');
    expect(getMetricTransitionLabel('change')).toContain('Performa 24 Jam');
  });

  it('3. Procedural Flag Pattern Integrity for Key Sovereign States', () => {
    expect(FLAG_PATTERNS['IDN']).toBeDefined();
    expect(FLAG_PATTERNS['IDN'].colors).toEqual(['#dc2626', '#ffffff']); // Merah Putih

    expect(FLAG_PATTERNS['FRA']).toBeDefined();
    expect(FLAG_PATTERNS['FRA'].type).toBe('vertical-tricolor'); // Biru Putih Merah

    expect(FLAG_PATTERNS['DEU']).toBeDefined();
    expect(FLAG_PATTERNS['DEU'].type).toBe('horizontal-tricolor'); // Hitam Merah Emas

    expect(FLAG_PATTERNS['JPN']).toBeDefined();
    expect(FLAG_PATTERNS['JPN'].type).toBe('circle-disc'); // Hinomaru
  });

  it('4. Fallback Flag Color Extraction', () => {
    const idnColor = getCountryFlagColor('IDN', true);
    expect(idnColor).toBe('#dc2626');

    const usaColor = getCountryFlagColor('USA', true);
    expect(usaColor).toBe('#1e3a8a');

    const jpnColor = getCountryFlagColor('JPN', true);
    expect(jpnColor).toBe('#dc2626');
  });
});
