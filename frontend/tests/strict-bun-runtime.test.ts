import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkBunRuntime, isVersionAtLeast, parseSemver, MIN_BUN_VERSION } from '../../scripts/ensure-bun';

describe('Strict Bun Runtime (v1.4+) Enforcement Tests (ADR 0022)', () => {
  const rootDir = resolve(__dirname, '../..');

  it('should have a dedicated ensure-bun runtime guard script in scripts/ensure-bun.ts', () => {
    const scriptPath = resolve(rootDir, 'scripts/ensure-bun.ts');
    expect(existsSync(scriptPath)).toBe(true);

    const content = readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('MIN_BUN_VERSION');
    expect(content).toContain('1.4.0');
    expect(content).toContain('checkBunRuntime');
  });

  it('should parse semver accurately', () => {
    expect(parseSemver('1.4.0')).toEqual({ major: 1, minor: 4, patch: 0 });
    expect(parseSemver('v1.4.2-beta.1')).toEqual({ major: 1, minor: 4, patch: 2 });
    expect(parseSemver('2.0.1')).toEqual({ major: 2, minor: 0, patch: 1 });
    expect(parseSemver('invalid')).toBeNull();
  });

  it('should correctly compare semver versions against minimum v1.4.0', () => {
    expect(isVersionAtLeast('1.4.0', '1.4.0')).toBe(true);
    expect(isVersionAtLeast('1.4.1', '1.4.0')).toBe(true);
    expect(isVersionAtLeast('1.5.0', '1.4.0')).toBe(true);
    expect(isVersionAtLeast('2.0.0', '1.4.0')).toBe(true);

    // Older versions must be rejected
    expect(isVersionAtLeast('1.3.9', '1.4.0')).toBe(false);
    expect(isVersionAtLeast('1.2.0', '1.4.0')).toBe(false);
    expect(isVersionAtLeast('1.0.0', '1.4.0')).toBe(false);
    expect(isVersionAtLeast('0.8.0', '1.4.0')).toBe(false);
  });

  it('should validate the current Bun execution environment', () => {
    const result = checkBunRuntime();
    expect(result.valid).toBe(true);
    expect(result.runtime).toBe('bun');
    expect(result.version).toBeDefined();
    expect(isVersionAtLeast(result.version!, MIN_BUN_VERSION)).toBe(true);
  });

  it('should enforce packageManager and engines.bun in root package.json', () => {
    const rootPkgPath = resolve(rootDir, 'package.json');
    const pkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));

    expect(pkg.packageManager).toBeDefined();
    expect(pkg.packageManager).toMatch(/^bun@1\.[4-9]/);
    expect(pkg.engines).toBeDefined();
    expect(pkg.engines.bun).toBe('>=1.4.0');
    expect(pkg.scripts?.preinstall).toContain('ensure-bun.ts');
  });

  it('should enforce engines.bun and packageManager in backend/package.json', () => {
    const backendPkgPath = resolve(rootDir, 'backend/package.json');
    const pkg = JSON.parse(readFileSync(backendPkgPath, 'utf-8'));

    expect(pkg.packageManager).toBeDefined();
    expect(pkg.packageManager).toMatch(/^bun@1\.[4-9]/);
    expect(pkg.engines?.bun).toBe('>=1.4.0');
  });

  it('should enforce engines.bun and packageManager in frontend/package.json', () => {
    const frontendPkgPath = resolve(rootDir, 'frontend/package.json');
    const pkg = JSON.parse(readFileSync(frontendPkgPath, 'utf-8'));

    expect(pkg.packageManager).toBeDefined();
    expect(pkg.packageManager).toMatch(/^bun@1\.[4-9]/);
    expect(pkg.engines?.bun).toBe('>=1.4.0');
  });

  it('should have bunfig.toml in root directory', () => {
    const bunfigPath = resolve(rootDir, 'bunfig.toml');
    expect(existsSync(bunfigPath)).toBe(true);
  });
});
