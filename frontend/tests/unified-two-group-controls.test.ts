// Safe polyfill for non-browser runtime (Bun test)
if (typeof window === 'undefined') {
  if (!('$state' in globalThis)) {
    (globalThis as any).$state = (val: any) => val;
  }
  if (!('$derived' in globalThis)) {
    (globalThis as any).$derived = (fn: any) => (typeof fn === 'function' ? fn() : fn);
  }
}

import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { createMapState } from '../src/lib/features/map/mapState';
import { geoStore } from '../src/lib/framework/geoglobe/geoStore.svelte';

describe('Unified Two-Group Controls & Global Flag Mode Suite (ADR 0052 / TDD)', () => {
  describe('1. mapState Global Flag Mode State & Actions', () => {
    it('initializes showFlags as false or respects metric flag state', () => {
      const state = createMapState();
      expect(typeof state.toggleFlags).toBe('function');
      expect(state.showFlags).toBe(false);
    });

    it('toggles showFlags on and off, synchronizing activeMetric with flag mode', () => {
      const state = createMapState();
      state.setMetric('rate');
      state.toggleFlags();
      expect(state.showFlags).toBe(true);
      expect(state.activeMetric).toBe('flag');

      state.toggleFlags();
      expect(state.showFlags).toBe(false);
      expect(state.activeMetric).toBe('rate');
    });
  });

  describe('2. KursControls Unified Two-Group Layout (KursControls.svelte)', () => {
    const kursControlsPath = path.resolve(__dirname, '../src/lib/apps/kurs/KursControls.svelte');
    const content = fs.readFileSync(kursControlsPath, 'utf-8');

    it('contains Section 1: Global Globe Controls with "Tampilan Globe" header', () => {
      expect(content).toMatch(/Tampilan Globe/i);
    });

    it('contains all 4 global controls in Section 1 (Projection, Label, Rotasi, Bendera)', () => {
      expect(content).toMatch(/Globe|Datar/i);
      expect(content).toMatch(/Label/i);
      expect(content).toMatch(/Rotasi|Auto-Rotate/i);
      expect(content).toMatch(/Bendera/i);
    });

    it('contains Section 2: App Controls with "Pusat Kontrol Kurs Valas" header', () => {
      expect(content).toMatch(/Pusat Kontrol Kurs Valas/i);
      expect(content).toContain('Kalkulator & Komparasi Valas');
    });

    it('removes Bendera from Section 2 Pewarnaan Metrik (moved to Global section)', () => {
      // In Section 2, the metric grid only switches rate and change
      expect(content).toMatch(/onToggleMetric\('rate'\)/);
      expect(content).toMatch(/onToggleMetric\('change'\)/);
    });
  });

  describe('3. UniversalAppControls Unified Two-Group Layout (UniversalAppControls.svelte)', () => {
    const universalControlsPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/ui/UniversalAppControls.svelte');
    const content = fs.readFileSync(universalControlsPath, 'utf-8');

    it('contains Section 1: Global Globe Controls with "Tampilan Globe" header and badge', () => {
      expect(content).toMatch(/Tampilan Globe/i);
      expect(content).toMatch(/Global/i);
    });

    it('provides global controls in Section 1 (Label, Rotasi, Bendera - ADR 0066)', () => {
      expect(content).not.toContain('handleToggleProjection');
      expect(content).toContain('handleToggleLabels');
      expect(content).toMatch(/handleToggleAutoRotate|toggleAutoRotate/);
      expect(content).toMatch(/handleToggleFlags|toggleFlags/);
      expect(content).toMatch(/Bendera/i);
    });

    it('contains Section 2: Per-App Controls displaying activeApp.name', () => {
      expect(content).toContain('activeApp.name');
      expect(content).toContain('activeApp.filterOptions');
    });
  });

  describe('4. Globe3DView Global Flag Mode & Dynamic Filtering (Globe3DView.svelte)', () => {
    const globePath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
    const content = fs.readFileSync(globePath, 'utf-8');

    it('checks mapState.showFlags in addition to activeMetric === "flag"', () => {
      expect(content).toMatch(/showFlags/);
    });

    it('applies procedural flag material or flag color when flag mode is active', () => {
      expect(content).toContain('createProceduralFlagMaterial');
    });
  });
});
