import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

describe('Floating Map Zoom In and Zoom Out Navigation Controls (ADR 0043 / TDD)', () => {
  const globeViewPath = path.resolve(__dirname, '../src/lib/features/map/components/Globe3DView.svelte');
  const content = fs.readFileSync(globeViewPath, 'utf-8');

  describe('1. Camera Zoom Functions Declaration in Globe3DView.svelte', () => {
    it('exports zoomIn function that smoothly decreases camera altitude', () => {
      expect(content).toContain('export function zoomIn(');
      expect(content).toContain('Math.max(');
      expect(content).toMatch(/Math\.max\(\s*0\.1[0-9]/); // Minimum altitude clamp ~0.15
    });

    it('exports zoomOut function that smoothly increases camera altitude', () => {
      expect(content).toContain('export function zoomOut(');
      expect(content).toContain('Math.min(');
      expect(content).toMatch(/Math\.min\(\s*6/); // Maximum altitude clamp ~6.0
    });

    it('exports resetView function that centers camera over Indonesia/Asia-Pacific baseline', () => {
      expect(content).toContain('export function resetView(');
      expect(content).toContain('lat: 10');
      expect(content).toContain('lng: 110');
    });
  });

  describe('2. Floating Glassmorphism Navigation Controls Widget in DOM', () => {
    it('renders a floating zoom control widget with Plus and Minus buttons', () => {
      expect(content).toContain('Zoom In');
      expect(content).toContain('Zoom Out');
      expect(content).toContain('<Plus');
      expect(content).toContain('<Minus');
    });

    it('renders a reset view button within the floating navigation bar', () => {
      expect(content).toContain('Reset Sudut Pandang');
      expect(content).toContain('resetView');
    });

    it('has proper keyboard accessibility or shortcut listeners for zoom', () => {
      expect(content).toContain('handleKeydown');
    });

    it('is positioned with proper vertical clearance above the bottom dock (not colliding at bottom-8)', () => {
      expect(content).not.toContain('bottom-8 right-6 z-30');
      expect(content).toMatch(/bottom-2[4-8]|bottom-\[.*\]/);
    });
  });
});
