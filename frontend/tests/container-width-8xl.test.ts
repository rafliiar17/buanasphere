import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Universal Container Width max-w-8xl Compliance (ADR-0026)', () => {
  const rootDir = join(__dirname, '..');

  it('should enforce max-w-8xl in App.svelte containers', () => {
    const appContent = readFileSync(join(rootDir, 'src/App.svelte'), 'utf-8');
    expect(appContent).toContain('max-w-8xl');
    // Ensure outdated max-w-6xl is not used for primary main containers
    expect(appContent).not.toContain('max-w-6xl');
  });

  it('should enforce max-w-8xl / 1536px in Navbar.svelte and Footer.svelte', () => {
    const navContent = readFileSync(join(rootDir, 'src/lib/components/Navbar.svelte'), 'utf-8');
    const footerContent = readFileSync(join(rootDir, 'src/lib/components/Footer.svelte'), 'utf-8');

    expect(navContent).toMatch(/max-width:\s*1536px|max-w-8xl/);
    expect(footerContent).toMatch(/max-width:\s*1536px|max-w-8xl/);

    expect(navContent).not.toContain('max-width:1280px');
    expect(footerContent).not.toContain('max-width:1280px');
  });

  it('should enforce max-w-8xl / 1536px in CurrencyComparisonMatrix.svelte', () => {
    const matrixContent = readFileSync(join(rootDir, 'src/lib/features/matrix/CurrencyComparisonMatrix.svelte'), 'utf-8');
    expect(matrixContent).toMatch(/max-width:\s*1536px|max-w-8xl/);
    expect(matrixContent).not.toContain('max-width:1280px');
  });

  it('should enforce max-w-8xl in MapSkeleton.svelte', () => {
    const skeletonContent = readFileSync(join(rootDir, 'src/lib/components/skeletons/MapSkeleton.svelte'), 'utf-8');
    expect(skeletonContent).toContain('max-w-8xl');
  });
});
