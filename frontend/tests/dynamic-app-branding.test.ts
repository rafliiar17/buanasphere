import { describe, it, expect } from 'bun:test';
import { resolvePathToAppId, APP_PATH_MAP } from '../src/lib/framework/geoglobe/router';
import { fxRatesApp } from '../src/lib/framework/geoglobe/plugins/fxRatesApp';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';
import { flowCorridorsApp } from '../src/lib/framework/geoglobe/plugins/flowCorridorsApp';
import { passportWorldApp } from '../src/lib/framework/geoglobe/plugins/passportWorldApp';

describe('Dynamic App Branding & Route Mapping Unit Tests (ADR 0029 / TDD)', () => {
  const APPS_MAP: Record<string, any> = {
    'fx-rates': fxRatesApp,
    'world-time': worldTimeApp,
    'remittance-flow': flowCorridorsApp,
    'passport-power': passportWorldApp,
  };

  it('resolves "/time" path directly to TimeWorld metadata', () => {
    const appId = resolvePathToAppId('/time');
    expect(appId).toBe('world-time');
    const app = APPS_MAP[appId];
    expect(app.name).toBe('TimeWorld');
    expect(app.tagline).toContain('Jam Global Real-time');
    expect(app.defaultMetricId).toBe('local_hour');
  });

  it('resolves "/flight" and "/flow" paths directly to Flow Corridors metadata', () => {
    const appId = resolvePathToAppId('/flight');
    expect(appId).toBe('remittance-flow');
    const app = APPS_MAP[appId];
    expect(app.name).toBe('Flow Corridors');
    expect(app.tagline).toContain('Remitansi');
    expect(app.defaultMetricId).toBe('volume');
  });

  it('resolves "/passport" path directly to Passport World metadata', () => {
    const appId = resolvePathToAppId('/passport');
    expect(appId).toBe('passport-power');
    const app = APPS_MAP[appId];
    expect(app.name).toBe('Passport World');
    expect(app.tagline).toContain('Paspor');
    expect(app.defaultMetricId).toBe('visa_free');
  });

  it('resolves "/kurs" and "/" paths directly to Kurs World metadata', () => {
    const appId = resolvePathToAppId('/kurs');
    expect(appId).toBe('fx-rates');
    const app = APPS_MAP[appId];
    expect(app.name).toBe('Kurs World');
    expect(app.tagline).toContain('Valas');
    expect(app.defaultMetricId).toBe('rate');
  });
});
