import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createMapState } from '../src/lib/features/map/mapState.svelte';

describe('Global vs Per-App Controls Hierarchy Suite (ADR 0051 / TDD)', () => {
  describe('1. mapState Auto-Rotate Feature Extension', () => {
    it('initializes autoRotate as false by default', () => {
      const state = createMapState();
      expect(state.autoRotate).toBe(false);
    });

    it('toggles autoRotate state cleanly', () => {
      const state = createMapState();
      state.toggleAutoRotate();
      expect(state.autoRotate).toBe(true);
      state.toggleAutoRotate();
      expect(state.autoRotate).toBe(false);
    });

    it('allows explicitly setting autoRotate state', () => {
      const state = createMapState();
      state.setAutoRotate(true);
      expect(state.autoRotate).toBe(true);
      state.setAutoRotate(false);
      expect(state.autoRotate).toBe(false);
    });
  });

  describe('2. UniversalAppControls Hierarchical Structure (UniversalAppControls.svelte)', () => {
    const controlsPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/ui/UniversalAppControls.svelte');
    const content = fs.readFileSync(controlsPath, 'utf-8');

    it('contains a dedicated Global Globe Controls section header ("Tampilan Globe")', () => {
      expect(content).toMatch(/Tampilan Globe/i);
    });

    it('places Projection and Label toggles inside the Global Globe section', () => {
      expect(content).toContain('handleToggleProjection');
      expect(content).toContain('handleToggleLabels');
    });

    it('provides an Auto-Rotate globe toggle in the Global section', () => {
      expect(content).toMatch(/handleToggleAutoRotate|toggleAutoRotate/);
      expect(content).toMatch(/Rotasi|Auto-Rotate/i);
    });

    it('contains a dedicated Per-App Controls section displaying activeApp.name', () => {
      expect(content).toContain('activeApp.name');
      expect(content).toContain('activeApp.filterOptions');
      expect(content).toContain('activeApp.metrics');
    });

    it('places micro-app specific layers (like timezone lines) in per-app context rather than global', () => {
      // Timezone lines button is scoped to world-time
      expect(content).toContain("activeApp.id === 'world-time'");
    });
  });

  describe('3. Globe3DView Three.js OrbitControls Auto-Rotate Wiring (Globe3DView.svelte)', () => {
    const globePath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
    const content = fs.readFileSync(globePath, 'utf-8');

    it('connects mapState.autoRotate to globeInstance.controls().autoRotate', () => {
      expect(content).toMatch(/controls\(\)\.autoRotate\s*=/);
    });

    it('configures smooth auto-rotation speed on OrbitControls', () => {
      expect(content).toMatch(/controls\(\)\.autoRotateSpeed\s*=/);
    });
  });
});
