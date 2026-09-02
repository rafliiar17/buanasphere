import { describe, it, expect, beforeEach } from 'bun:test';
import { t, setLocale, getLocale } from '../src/lib/i18n';

describe('Globe Entrance Loader & Telemetry Localization (ADR-0026)', () => {
  beforeEach(() => {
    setLocale('id');
  });

  it('should translate all globe loader telemetry steps in Indonesian', () => {
    setLocale('id');
    expect(t('map.loader.initializing')).toContain('Menyiapkan Peta Valas Dunia 3D');
    expect(t('map.loader.subInitializing')).toContain('Memuat geometri 195+ negara');
    expect(t('map.loader.step1')).toContain('GeoJSON');
    expect(t('map.loader.step2')).toContain('WebGL');
    expect(t('map.loader.step3')).toContain('Live Exchange Rates');
    expect(t('map.loader.ready')).toContain('Siap Dijelajahi');
  });

  it('should translate all globe loader telemetry steps in English', () => {
    setLocale('en');
    expect(t('map.loader.initializing')).toContain('Initializing 3D World FX Map');
    expect(t('map.loader.subInitializing')).toContain('Loading 195+ country boundaries');
    expect(t('map.loader.step1')).toContain('GeoJSON');
    expect(t('map.loader.step2')).toContain('WebGL');
    expect(t('map.loader.step3')).toContain('Live Multi-Provider Exchange Rates');
    expect(t('map.loader.ready')).toContain('Ready to Explore');
  });
});
