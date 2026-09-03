import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  FX_MARKET_SESSIONS,
  calculateMarketSessions,
  type MarketSessionInfo,
} from '../src/lib/features/map/marketSessions';

const ROOT = resolve(import.meta.dir, '..');

function readSource(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

describe('Global FX Market Sessions & Microapp Domain Suite (ADR 0064 / TDD)', () => {
  describe('1. FX Market Sessions Engine (marketSessions.ts)', () => {
    it('defines 5 major global FX market sessions including Jakarta, Tokyo, London, New York, and Sydney', () => {
      expect(FX_MARKET_SESSIONS.length).toBeGreaterThanOrEqual(5);

      const sessionIds = FX_MARKET_SESSIONS.map((s) => s.id);
      expect(sessionIds).toContain('jakarta');
      expect(sessionIds).toContain('sydney');
      expect(sessionIds).toContain('tokyo');
      expect(sessionIds).toContain('london');
      expect(sessionIds).toContain('newyork');
    });

    it('accurately calculates open/closed market sessions during London-New York overlap (14:00 UTC)', () => {
      // 14:00 UTC: London (08:00-17:00 UTC) is Open, New York (13:00-22:00 UTC) is Open
      // Tokyo (00:00-09:00 UTC) is Closed
      const testDate = new Date('2026-09-03T14:00:00Z');
      const result = calculateMarketSessions(testDate);

      const london = result.sessions.find((s) => s.id === 'london');
      const ny = result.sessions.find((s) => s.id === 'newyork');
      const tokyo = result.sessions.find((s) => s.id === 'tokyo');

      expect(london?.isOpen).toBe(true);
      expect(ny?.isOpen).toBe(true);
      expect(tokyo?.isOpen).toBe(false);
      expect(result.isLondonNewYorkOverlap).toBe(true);
      expect(result.activeSessionsCount).toBeGreaterThanOrEqual(2);
    });

    it('accurately calculates Asian market hours at 03:00 UTC (10:00 WIB)', () => {
      // 03:00 UTC: Jakarta (01:00-09:00 UTC) is Open, Tokyo (00:00-09:00 UTC) is Open
      // London (08:00-17:00 UTC) is Closed
      const testDate = new Date('2026-09-03T03:00:00Z');
      const result = calculateMarketSessions(testDate);

      const jakarta = result.sessions.find((s) => s.id === 'jakarta');
      const tokyo = result.sessions.find((s) => s.id === 'tokyo');
      const london = result.sessions.find((s) => s.id === 'london');

      expect(jakarta?.isOpen).toBe(true);
      expect(tokyo?.isOpen).toBe(true);
      expect(london?.isOpen).toBe(false);
      expect(result.isLondonNewYorkOverlap).toBe(false);
    });

    it('formats local time for each market session', () => {
      const testDate = new Date('2026-09-03T14:30:00Z');
      const result = calculateMarketSessions(testDate);

      for (const s of result.sessions) {
        expect(s.localTimeFormatted).toMatch(/^\d{2}:\d{2}$/);
        expect(typeof s.isOpen).toBe('boolean');
        expect(s.currencyCode.length).toBe(3);
      }
    });
  });

  describe('2. Microapp Domain Separation Assertions', () => {
    it('verifies TimeBottomDock.svelte (/time) uses "Kota Utama Dunia" and not "Pasar Finansial Dunia"', () => {
      const source = readSource('src/lib/apps/time/TimeBottomDock.svelte');

      expect(source).not.toContain('Pasar Finansial Dunia');
      expect(source).toContain('Kota Utama Dunia');
    });

    it('verifies KursBottomDock.svelte (/kurs) displays global market session status', () => {
      const source = readSource('src/lib/apps/kurs/KursBottomDock.svelte');

      expect(source).toContain('Pasar Valas');
      expect(source).toContain('marketSessions');
    });
  });
});
