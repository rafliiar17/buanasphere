import { describe, it, expect } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { earthquakeApp } from '../src/lib/framework/geoglobe/plugins/earthquakeApp';

describe('Dedicated Earthquake Micro-App UI Suite (ADR 0068 / TDD)', () => {
  const quakeDir = path.resolve(__dirname, '../src/lib/apps/quake');
  const controlsFile = path.join(quakeDir, 'QuakeControls.svelte');
  const bottomDockFile = path.join(quakeDir, 'QuakeBottomDock.svelte');
  const tooltipFile = path.join(quakeDir, 'QuakeTooltip.svelte');

  describe('1. File Structure & Component Artifacts', () => {
    it('verifies QuakeControls.svelte exists in src/lib/apps/quake/', () => {
      expect(fs.existsSync(controlsFile)).toBe(true);
    });

    it('verifies QuakeBottomDock.svelte exists in src/lib/apps/quake/', () => {
      expect(fs.existsSync(bottomDockFile)).toBe(true);
    });

    it('verifies QuakeTooltip.svelte exists in src/lib/apps/quake/', () => {
      expect(fs.existsSync(tooltipFile)).toBe(true);
    });
  });

  describe('2. Plugin Registration in earthquakeApp.ts', () => {
    it('registers ControlsComponent on earthquakeApp', () => {
      expect(earthquakeApp.ControlsComponent).toBeDefined();
    });

    it('registers BottomDockComponent on earthquakeApp', () => {
      expect(earthquakeApp.BottomDockComponent).toBeDefined();
    });
  });

  describe('3. QuakeControls Capabilities & Clean Typography', () => {
    it('includes magnitude and depth filter options in QuakeControls', () => {
      const content = fs.readFileSync(controlsFile, 'utf-8');
      expect(content).toMatch(/magnitudo|magnitude/i);
      expect(content).toMatch(/kedalaman|depth/i);
      expect(content).toMatch(/Ring of Fire|high_risk/);
    });

    it('provides clean 3D globe display toggles (Label, Rotasi) without projection toggles', () => {
      const content = fs.readFileSync(controlsFile, 'utf-8');
      expect(content).toMatch(/Label/);
      expect(content).toMatch(/Rotasi|autoRotate/);
      expect(content).not.toContain('handleToggleProjection');
      expect(content).not.toContain('onToggleProjection');
    });
  });

  describe('4. QuakeBottomDock Live Ticker & Camera Navigation', () => {
    it('provides horizontal live earthquake ticker with time and magnitude badges', () => {
      const content = fs.readFileSync(bottomDockFile, 'utf-8');
      expect(content).toMatch(/USGS|BMKG/);
      expect(content).toMatch(/magnitude|mag/i);
      expect(content).toMatch(/tsunami/i);
    });

    it('dispatches country selection or camera travel when an earthquake event is clicked', () => {
      const content = fs.readFileSync(bottomDockFile, 'utf-8');
      expect(content).toMatch(/selectCountry|travelToCoordinates|cameraTravelSignal/);
    });
  });
});
