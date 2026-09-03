import { describe, it, expect } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

describe('Pure 3D Globe Architecture & Complete Plotly/FE-2 Elimination (ADR 0066)', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const frontendDir = path.resolve(__dirname, '..');

  it('verifies frontend/package.json has NO plotly.js-dist-min dependencies', () => {
    const pkgJsonPath = path.join(frontendDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

    expect(pkg.dependencies?.['plotly.js-dist-min']).toBeUndefined();
    expect(pkg.devDependencies?.['@types/plotly.js-dist-min']).toBeUndefined();
    expect(pkg.dependencies?.['globe.gl']).toBeDefined();
  });

  it('verifies frontend/vite.config.ts does not configure plotly-vendor manual chunk', () => {
    const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
    const viteContent = fs.readFileSync(viteConfigPath, 'utf-8');

    expect(viteContent).not.toContain('plotly-vendor');
    expect(viteContent).not.toContain('plotly.js-dist-min');
  });

  it('verifies FlatMap2DView.svelte component is completely deleted', () => {
    const flatMapPath = path.join(frontendDir, 'src/lib/features/map/components/FlatMap2DView.svelte');
    expect(fs.existsSync(flatMapPath)).toBe(false);
  });

  it('verifies WorldRateMap.svelte does not import or render FlatMap2DView', () => {
    const worldRateMapPath = path.join(frontendDir, 'src/lib/features/map/WorldRateMap.svelte');
    const content = fs.readFileSync(worldRateMapPath, 'utf-8');

    expect(content).not.toContain('FlatMap2DView');
    expect(content).not.toContain("mapState.projectionMode === 'globe'");
    expect(content).toContain('<Globe3DView');
  });

  it('verifies root package.json does not contain frontend-2 in workspaces or scripts', () => {
    const rootPkgPath = path.join(rootDir, 'package.json');
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));

    expect(rootPkg.workspaces).not.toContain('frontend-2');
    expect(rootPkg.scripts?.['dev:fe2']).toBeUndefined();
    expect(rootPkg.scripts?.['test:fe2']).toBeUndefined();
    expect(rootPkg.scripts?.['build:fe2']).toBeUndefined();
    expect(rootPkg.scripts?.['check:fe2']).toBeUndefined();
  });

  it('verifies frontend-2 directory does not exist on disk', () => {
    const fe2Path = path.join(rootDir, 'frontend-2');
    expect(fs.existsSync(fe2Path)).toBe(false);
  });

  it('verifies micro-app controls do not contain toggle projection buttons', () => {
    const kursControlsPath = path.join(frontendDir, 'src/lib/apps/kurs/KursControls.svelte');
    const timeControlsPath = path.join(frontendDir, 'src/lib/apps/time/TimeControls.svelte');
    const flightControlsPath = path.join(frontendDir, 'src/lib/apps/flight/FlightControls.svelte');

    const kursSrc = fs.readFileSync(kursControlsPath, 'utf-8');
    const timeSrc = fs.readFileSync(timeControlsPath, 'utf-8');
    const flightSrc = fs.readFileSync(flightControlsPath, 'utf-8');

    expect(kursSrc).not.toContain('Peta Datar');
    expect(timeSrc).not.toContain('Peta Datar');
    expect(timeSrc).not.toContain('Datar');
    expect(flightSrc).not.toContain('Peta Datar');
  });
});
