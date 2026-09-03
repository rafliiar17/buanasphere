import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';
import type { GeoPath } from '../src/lib/framework/geoglobe/types';

describe('3D Timezone Meridian Lines & Quality Standard Suite (ADR 0041 / TDD)', () => {
  describe('1. TimeWorld Plugin Meridian Paths Generator (worldTimeApp.getPaths)', () => {
    it('declares getPaths hook on worldTimeApp', () => {
      expect(typeof worldTimeApp.getPaths).toBe('function');
    });

    it('generates rich timezone boundary paths covering global longitudes (ADR 0057)', () => {
      const paths = worldTimeApp.getPaths!({}, 'diurnal', 'dark');
      expect(paths.length).toBeGreaterThanOrEqual(24);

      // Verify longitudes span globally across hemispheres
      const allLngs = paths.flatMap(p => p.coords.map(c => c[1]));
      const minLng = Math.min(...allLngs);
      const maxLng = Math.max(...allLngs);
      expect(minLng).toBeLessThanOrEqual(-150);
      expect(maxLng).toBeGreaterThanOrEqual(150);
    });

    it('highlights Indonesia WIB baseline (UTC+7 / +105° longitude) in emerald green', () => {
      const paths = worldTimeApp.getPaths!({}, 'diurnal', 'dark');
      const wibPath = paths.find(p => p.id === 'meridian-utc-7' || p.coords[0][1] === 105);
      expect(wibPath).toBeDefined();
      expect(wibPath?.label).toContain('WIB');
      expect(wibPath?.color).toContain('#10b981'); // Emerald
    });

    it('highlights Prime Meridian (UTC 0 / 0° longitude) and International Date Line (180°)', () => {
      const paths = worldTimeApp.getPaths!({}, 'diurnal', 'dark');
      const gmtPath = paths.find(p => p.id === 'meridian-utc-0' || p.coords[0][1] === 0);
      expect(gmtPath).toBeDefined();
      expect(gmtPath?.label).toContain('UTC 0');
      expect(gmtPath?.color).toContain('#06b6d4'); // Cyan

      const idlPath = paths.find(p => p.id === 'meridian-idl' || p.coords[0][1] === -180 || p.coords[0][1] === 180);
      expect(idlPath).toBeDefined();
      expect(idlPath?.dashLength).toBeDefined(); // Dashed line
    });

    it('ensures timezone paths cover major global latitudes (ADR 0057)', () => {
      const paths = worldTimeApp.getPaths!({}, 'diurnal', 'dark');
      const allLats = paths.flatMap(p => p.coords.map(c => c[0]));
      const maxLat = Math.max(...allLats);
      const minLat = Math.min(...allLats);
      expect(maxLat).toBeGreaterThanOrEqual(60);
      expect(minLat).toBeLessThanOrEqual(-50);
    });
  });

  describe('2. Globe3DView Hook & Paths Integration', () => {
    it('connects pathsData to activeApp.getPaths in Globe3DView.svelte', () => {
      const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('.pathsData(');
      expect(content).toContain('.pathPoints(');
      expect(content).toContain('.pathColor(');
      expect(content).toContain('.pathPointAlt(');
    });
  });

  describe('3. Clean Retirement of Ugly 60FPS Mode', () => {
    it('verifies that the 60 FPS toggle button is removed from UniversalAppControls', () => {
      const controlsPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/ui/UniversalAppControls.svelte');
      const content = fs.readFileSync(controlsPath, 'utf-8');
      expect(content).not.toContain('⚡ 60 FPS');
    });
  });
});
