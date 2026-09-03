import { describe, it, expect } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const launcherPath = path.resolve(__dirname, '../src/lib/framework/geoglobe/ui/GeoAppLauncherModal.svelte');

describe('Microapp Launcher Modal UI/UX & Viewport Constraints (ADR 0058 / TDD)', () => {
  const content = fs.readFileSync(launcherPath, 'utf-8');

  describe('1. Viewport Height Constraint & Anti-Spill Container', () => {
    it('constrains modal card height with max-h in vh units to prevent screen overflow', () => {
      // Must contain max-h-[85vh] or max-h-[88vh] or max-h-[90vh]
      expect(content).toMatch(/max-h-\[(8[0-9]|90)vh\]/);
    });

    it('organizes modal card as flex-col with overflow-hidden', () => {
      expect(content).toMatch(/flex\s+flex-col/);
      expect(content).toContain('overflow-hidden');
    });

    it('isolates scrollable content in flex-1 min-h-0 with overflow-y-auto', () => {
      expect(content).toMatch(/flex-1\s+min-h-0/);
      expect(content).toContain('overflow-y-auto');
    });

    it('pins header and footer with shrink-0 so they never get pushed off-screen', () => {
      expect(content).toMatch(/<header[^>]*shrink-0/);
      expect(content).toMatch(/<footer[^>]*shrink-0/);
    });
  });

  describe('2. Responsive Grid & Card Density', () => {
    it('uses a responsive multi-column grid (supporting up to 3 columns on wide screens)', () => {
      expect(content).toMatch(/grid-cols-1/);
      expect(content).toMatch(/sm:grid-cols-2|md:grid-cols-2/);
      expect(content).toMatch(/lg:grid-cols-3/);
    });

    it('constrains modal max-width appropriately for multi-column layout', () => {
      expect(content).toMatch(/max-w-(4xl|5xl)/);
    });
  });

  describe('3. Quick Search / Filter Integration', () => {
    it('includes a quick search input field for instant microapp filtering', () => {
      expect(content).toMatch(/<input[^>]*type=["']text["'][^>]*placeholder/);
      expect(content).toMatch(/searchQuery|filterQuery/);
    });
  });

  describe('4. Accessibility & Navigation Controls', () => {
    it('supports Escape key listener to close modal', () => {
      expect(content).toMatch(/e\.key\s*===\s*['"]Escape['"]/);
    });

    it('provides a prominent close button with accessible aria-label', () => {
      expect(content).toMatch(/<button[^>]*aria-label=["']Tutup[^"']*["']/);
    });
  });
});
