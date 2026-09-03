import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

describe('Interactive Travel & Auto Zoom-in Camera Animation on 3D Globe (ADR 0049 / TDD)', () => {
  const cameraTravelPath = path.resolve(__dirname, '../src/lib/features/map/cameraTravel.ts');
  const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
  const geoStorePath = path.resolve(__dirname, '../src/lib/framework/geoglobe/geoStore.svelte.ts');
  const mapStatePath = path.resolve(__dirname, '../src/lib/features/map/mapState.svelte.ts');
  const universalControlsPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/ui/UniversalAppControls.svelte');
  const kursControlsPath = path.resolve(__dirname, '../src/lib/apps/kurs/KursControls.svelte');

  describe('1. Spatial Camera Travel Mathematics & Adaptive Focus Altitude (cameraTravel.ts)', () => {
    it('declares cameraTravel.ts with distance and altitude calculation helpers', () => {
      expect(fs.existsSync(cameraTravelPath)).toBe(true);
      const content = fs.readFileSync(cameraTravelPath, 'utf-8');
      expect(content).toContain('calculateGreatCircleDistanceDeg');
      expect(content).toContain('getCountryFocusAltitude');
      expect(content).toContain('getTravelTrajectory');
    });

    it('calculates great-circle distance accurately between two coordinates', async () => {
      const { calculateGreatCircleDistanceDeg } = await import('../src/lib/features/map/cameraTravel');
      // Jakarta (-6.2, 106.8) to Kuala Lumpur (3.14, 101.69) is ~1180 km / ~10.6 degrees
      const dJktKul = calculateGreatCircleDistanceDeg(-6.2, 106.8, 3.14, 101.69);
      expect(dJktKul).toBeGreaterThan(9);
      expect(dJktKul).toBeLessThan(12);

      // Jakarta (-6.2, 106.8) to Washington DC (38.9, -77.0) is antipodal/far (~145+ degrees)
      const dJktWdc = calculateGreatCircleDistanceDeg(-6.2, 106.8, 38.9, -77.0);
      expect(dJktWdc).toBeGreaterThan(140);
      expect(dJktWdc).toBeLessThan(180);
    });

    it('provides adaptive focus altitudes matching country spatial scale', async () => {
      const { getCountryFocusAltitude } = await import('../src/lib/features/map/cameraTravel');
      // Malaysia (MYS) should have medium focus altitude (~0.55)
      expect(getCountryFocusAltitude('MYS')).toBe(0.55);
      // Singapore (SGP) should have close zoom altitude (~0.30)
      expect(getCountryFocusAltitude('SGP')).toBe(0.30);
      // Giant countries like USA, RUS, CHN should have wide overview altitude (~1.15)
      expect(getCountryFocusAltitude('USA')).toBe(1.15);
      expect(getCountryFocusAltitude('RUS')).toBe(1.15);
      // Default fallback
      expect(getCountryFocusAltitude('XYZ')).toBe(0.60);
    });

    it('determines two-stage parabolic travel for distant coordinates and direct swoop for nearby', async () => {
      const { getTravelTrajectory } = await import('../src/lib/features/map/cameraTravel');
      
      // Distant travel (e.g. from Jakarta to New York / USA)
      const distantTravel = getTravelTrajectory(
        { lat: -6.2, lng: 106.8, altitude: 2.2 },
        { lat: 38.9, lng: -77.0 },
        { targetAltitude: 1.15 }
      );
      expect(distantTravel.isTwoStage).toBe(true);
      expect(distantTravel.stage1.altitude).toBeGreaterThanOrEqual(2.2);
      expect(distantTravel.stage2.altitude).toBe(1.15);

      // Nearby travel (e.g. from Singapore to Kuala Lumpur ~2.8 degrees)
      const nearbyTravel = getTravelTrajectory(
        { lat: 1.35, lng: 103.82, altitude: 0.8 },
        { lat: 3.14, lng: 101.69 },
        { targetAltitude: 0.55 }
      );
      expect(nearbyTravel.isTwoStage).toBe(false);
      expect(nearbyTravel.stage1.altitude).toBe(0.55);
    });
  });

  describe('2. Store Reactive Signals & Travel Dispatchers (geoStore & mapState)', () => {
    it('geoStore declares cameraTravelSignal and travelToCountry', () => {
      const content = fs.readFileSync(geoStorePath, 'utf-8');
      expect(content).toContain('cameraTravelSignal');
      expect(content).toContain('travelToCountry');
    });

    it('mapState declares cameraTravelSignal and travelToCountry', () => {
      const content = fs.readFileSync(mapStatePath, 'utf-8');
      expect(content).toContain('cameraTravelSignal');
      expect(content).toContain('travelToCountry');
    });

    it('selectCountry updates cameraTravelSignal with iso3 and timestamp', async () => {
      const { geoStore } = await import('../src/lib/framework/geoglobe/geoStore.svelte');
      const tBefore = Date.now();
      geoStore.selectCountry('MYS');
      expect(geoStore.cameraTravelSignal).not.toBeNull();
      expect(geoStore.cameraTravelSignal?.iso3).toBe('MYS');
      expect(geoStore.cameraTravelSignal?.timestamp).toBeGreaterThanOrEqual(tBefore);
    });
  });

  describe('3. Globe3DView Reactive Travel Integration (Globe3DView.svelte)', () => {
    it('exports travelToCountry function in Globe3DView.svelte', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('export function travelToCountry(');
    });

    it('listens reactively to cameraTravelSignal from geoStore or mapState', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('cameraTravelSignal');
    });

    it('implements cancelable two-stage pointOfView camera flight with timeout cleanup', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('getTravelTrajectory');
      expect(content).toMatch(/clearTimeout\(\s*travelTimeoutId/);
    });

    it('triggers travelToCountry on polygon click and label click for interactive globe exploration', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('travelToCountry(featIso3');
    });
  });

  describe('4. Keyboard Enter & Micro-App Filter Auto-Selection', () => {
    it('UniversalAppControls handles Enter key to auto-select top search match and trigger travel', () => {
      const content = fs.readFileSync(universalControlsPath, 'utf-8');
      expect(content).toContain('onkeydown');
      expect(content).toMatch(/e\.key\s*===\s*['"]Enter['"]/);
    });

    it('KursControls handles Enter key on search input', () => {
      const content = fs.readFileSync(kursControlsPath, 'utf-8');
      expect(content).toContain('onkeydown');
      expect(content).toMatch(/e\.key\s*===\s*['"]Enter['"]/);
    });
  });
});
