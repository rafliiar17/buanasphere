import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

describe('FE1 Full GlobeScene Declarative Replacement (ADR 0062 / TDD)', () => {
  const globeScenePath = path.resolve(__dirname, '../src/lib/features/map/globe/GlobeScene.svelte');
  const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');

  describe('1. GlobeScene.svelte Declarative Component in FE1', () => {
    it('verifies GlobeScene.svelte exists in FE1 globe module', () => {
      expect(fs.existsSync(globeScenePath)).toBe(true);
    });

    it('exports standard camera controller methods in GlobeScene.svelte', () => {
      const content = fs.readFileSync(globeScenePath, 'utf-8');
      expect(content).toContain('export function flyToCountry(');
      expect(content).toContain('export function flyTo(');
      expect(content).toContain('export function handleZoomIn(');
      expect(content).toContain('export function handleZoomOut(');
      expect(content).toContain('export function handleResetView(');
      expect(content).toContain('export function getGlobe(');
    });

    it('manages responsive ResizeObserver and clean WebGL disposal on destroy', () => {
      const content = fs.readFileSync(globeScenePath, 'utf-8');
      expect(content).toContain('new ResizeObserver(');
      expect(content).toContain('onDestroy(');
      expect(content).toContain('renderer.dispose()');
    });

    it('binds layer configurations in reactive $effect loop', () => {
      const content = fs.readFileSync(globeScenePath, 'utf-8');
      expect(content).toContain('$effect(() => {');
      expect(content).toContain('configurePolygonLayer(');
      expect(content).toContain('configureArcLayer(');
      expect(content).toContain('configurePathLayer(');
      expect(content).toContain('configureRingLayer(');
      expect(content).toContain('configureLabelLayer(');
    });
  });

  describe('2. Globe3DView.svelte Integration as Declarative Orchestrator', () => {
    it('imports and renders GlobeScene inside Globe3DView.svelte', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain("import GlobeScene from '../globe/GlobeScene.svelte'");
      expect(content).toMatch(/<GlobeScene/);
    });

    it('supplies dynamic filtered layers (polygons, arcs, paths, rings, labels) to GlobeScene', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('polygons={');
      expect(content).toContain('arcs={');
      expect(content).toContain('paths={');
      expect(content).toContain('rings={');
      expect(content).toContain('labels={');
    });

    it('delegates exported camera navigation methods directly to GlobeScene', () => {
      const content = fs.readFileSync(globeViewPath, 'utf-8');
      expect(content).toContain('export function flyTo(');
      expect(content).toContain('export function travelToCountry(');
      expect(content).toContain('export function zoomIn(');
      expect(content).toContain('export function zoomOut(');
      expect(content).toContain('export function resetView(');
    });
  });
});
