import { describe, it, expect } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('ADR 0048: About Modal & Buanasphere Branding Invariants', () => {
  const rootPackageJsonPath = resolve(__dirname, '../../package.json');
  const frontendPackageJsonPath = resolve(__dirname, '../package.json');
  const backendPackageJsonPath = resolve(__dirname, '../../backend/package.json');

  it('declares buanasphere as the project name in root package.json', () => {
    const pkg = JSON.parse(readFileSync(rootPackageJsonPath, 'utf8'));
    expect(pkg.name).toBe('buanasphere');
  });

  it('declares @buanasphere/frontend and @buanasphere/backend packages', () => {
    const fePkg = JSON.parse(readFileSync(frontendPackageJsonPath, 'utf8'));
    const bePkg = JSON.parse(readFileSync(backendPackageJsonPath, 'utf8'));
    expect(fePkg.name).toBe('@buanasphere/frontend');
    expect(bePkg.name).toBe('@buanasphere/backend');
  });

  it('provides AboutModal.svelte component in frontend', () => {
    const componentPath = resolve(__dirname, '../src/lib/components/AboutModal.svelte');
    expect(existsSync(componentPath)).toBe(true);
    const content = readFileSync(componentPath, 'utf8');
    expect(content).toContain('Buanasphere');
    expect(content).toContain('https://github.com/rafliiar17/buanasphere');
    expect(content).toContain('https://globe.arafz.id');
  });
});
