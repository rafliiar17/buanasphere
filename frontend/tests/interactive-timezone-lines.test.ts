import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { MapState } from '../src/lib/features/map/mapState';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';

describe('Interactive Timezone Meridian Lines Suite (ADR 0042 / TDD)', () => {
  describe('1. MapState Timezone Lines Visibility & Meridian Selection', () => {
    it('initializes showTimezoneLines to true by default and supports toggleTimezoneLines()', () => {
      const state = new MapState();
      expect(state.showTimezoneLines).toBe(true);
      state.toggleTimezoneLines();
      expect(state.showTimezoneLines).toBe(false);
      state.toggleTimezoneLines();
      expect(state.showTimezoneLines).toBe(true);
    });

    it('manages selectedMeridian state with setSelectedMeridian()', () => {
      const state = new MapState();
      expect(state.selectedMeridian).toBeNull();

      const sampleMeridian = {
        id: 'meridian-utc-7',
        utcOffset: 7,
        gmtLabel: 'GMT+7:00 (WIB)',
        localTime: '08:30:00',
        diffWib: 'Acuan Waktu Nasional (WIB)',
        keyRegions: ['Indonesia (Jakarta, Sumatra, Kalbar)', 'Thailand', 'Vietnam'],
      };

      state.setSelectedMeridian(sampleMeridian);
      expect(state.selectedMeridian?.id).toBe('meridian-utc-7');
      expect(state.selectedMeridian?.utcOffset).toBe(7);

      state.setSelectedMeridian(null);
      expect(state.selectedMeridian).toBeNull();
    });
  });

  describe('2. TimeWorld Plugin Rich Meridian Metadata (worldTimeApp.getPaths)', () => {
    it('generates rich metadata on meridian paths including utcOffset, gmtLabel, diffWib, and keyRegions', () => {
      const paths = worldTimeApp.getPaths!({}, 'diurnal', 'dark');
      expect(paths.length).toBe(24);

      const wib = paths.find(p => p.utcOffset === 7 || p.id === 'meridian-utc-7');
      expect(wib).toBeDefined();
      expect(wib?.utcOffset).toBe(7);
      expect(wib?.gmtLabel).toContain('GMT+7');
      expect(wib?.diffWib).toBeDefined();
      expect(Array.isArray(wib?.keyRegions)).toBe(true);
      expect(wib?.keyRegions?.some((r: string) => r.includes('Indonesia') || r.includes('Jakarta'))).toBe(true);
    });

    it('generates rich HTML tooltip on each path for hover inspection (path.tooltipHtml)', () => {
      const paths = worldTimeApp.getPaths!({}, 'diurnal', 'dark');
      for (const p of paths) {
        expect(p.tooltipHtml).toBeDefined();
        expect(p.tooltipHtml).toContain('GMT');
        expect(p.tooltipHtml).toContain('Jam:');
      }
    });
  });

  describe('3. Globe3DView Hook Integration & Interactive Events', () => {
    it('wires pathLabel and onPathClick in Globe3DView.svelte', () => {
      const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('.pathLabel(');
      expect(content).toContain('.onPathClick(');
    });

    it('verifies globePaths checks mapState.showTimezoneLines before returning paths', () => {
      const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('showTimezoneLines');
    });
  });

  describe('4. UI Controls Integration', () => {
    it('verifies that UniversalAppControls renders toggleTimezoneLines button for world-time app', () => {
      const controlsPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/ui/UniversalAppControls.svelte');
      const content = fs.readFileSync(controlsPath, 'utf-8');
      expect(content).toContain('toggleTimezoneLines');
      expect(content).toContain('showTimezoneLines');
    });
  });
});
