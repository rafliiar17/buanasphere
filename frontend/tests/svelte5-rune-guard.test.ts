import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

describe('Svelte 5 Rune Safety Invariant Suite (Prevent rune_outside_svelte)', () => {
  const GEO_STORE_PATH = path.resolve(__dirname, '../src/lib/framework/geoglobe/geoStore.svelte.ts');
  const geoStoreSrc = fs.readFileSync(GEO_STORE_PATH, 'utf-8');

  it('1. geoStore.svelte.ts does not contain unguarded globalThis.$state access', () => {
    // Unguarded `typeof globalThis.$state` triggers Svelte 5 runtime trap getter
    expect(geoStoreSrc).not.toMatch(/if\s*\(\s*typeof\s*\(?globalThis\s*as\s*any\)?\.\$state\s*===/);
    expect(geoStoreSrc).not.toMatch(/if\s*\(\s*typeof\s*globalThis\.\$state\s*===/);
  });

  it('2. test polyfill in geoStore.svelte.ts is strictly guarded behind typeof window === "undefined"', () => {
    // In browser runtime (where window exists), the polyfill must NEVER execute
    expect(geoStoreSrc).toContain("if (typeof window === 'undefined')");
    expect(geoStoreSrc).toContain("!('$state' in globalThis)");
  });

  it('3. Svelte 5 getter trap simulation does not throw when window is defined', () => {
    // Simulate Svelte 5 runtime trap getter on an isolated object
    let trapTriggered = false;
    const mockGlobal: any = {
      window: {}, // Browser environment
    };

    Object.defineProperty(mockGlobal, '$state', {
      get() {
        trapTriggered = true;
        throw new Error('rune_outside_svelte: The $state rune is only available inside .svelte and .svelte.js/ts files');
      },
      configurable: true,
    });

    // Run the safe check pattern
    if (typeof mockGlobal.window === 'undefined') {
      if (!('$state' in mockGlobal)) {
        mockGlobal.$state = (val: any) => val;
      }
    }

    // Must NOT have triggered the trap
    expect(trapTriggered).toBe(false);
  });

  it('4. no plain .ts or .js file in src calls $state or $derived runes', () => {
    const srcDir = path.resolve(__dirname, '../src');
    
    function scanDir(dir: string): string[] {
      const results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...scanDir(fullPath));
        } else if (
          (file.endsWith('.ts') || file.endsWith('.js')) &&
          !file.endsWith('.svelte.ts') &&
          !file.endsWith('.svelte.js')
        ) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const plainScriptFiles = scanDir(srcDir);
    const violatingFiles: string[] = [];

    for (const file of plainScriptFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Look for function calls to $state( or $derived( or $effect(
      if (/\$state\(|\$derived\(|\$effect\(|\$props\(/.test(content)) {
        violatingFiles.push(file);
      }
    }

    expect(violatingFiles).toEqual([]);
  });
});
