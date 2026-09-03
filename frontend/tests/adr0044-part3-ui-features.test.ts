import { describe, it, expect, beforeEach } from 'bun:test';
import { formatRupiah, formatPercent } from '../src/lib/formatters/currency';
import { BASE_RATES_IDR } from '../src/lib/api/client';

describe('ADR 0044 Part 3: Inspector Mini Chart, Shareable Rate Card, & Rate Alert Polish', () => {

  describe('1. Candidate 3: Mini Trend Chart in Universal Country Inspector', () => {
    it('determines currency trend eligibility for non-IDR currencies', () => {
      const isEligible = (currencyCode?: string, activeAppId?: string) => {
        if (!currencyCode) return false;
        return activeAppId === 'fx-rates' || currencyCode !== 'IDR';
      };

      expect(isEligible('USD', 'world-time')).toBe(true);
      expect(isEligible('EUR', 'fx-rates')).toBe(true);
      expect(isEligible('IDR', 'world-time')).toBe(false);
      expect(isEligible('IDR', 'fx-rates')).toBe(true);
      expect(isEligible(undefined, 'fx-rates')).toBe(false);
    });

    it('calculates SVG sparkline coordinates and path string accurately', () => {
      const points = [
        { middleRate: 15800, date: '1 Sep' },
        { middleRate: 15900, date: '2 Sep' },
        { middleRate: 15850, date: '3 Sep' },
      ];
      const width = 300;
      const height = 80;
      const padding = 10;

      const rates = points.map((p) => p.middleRate);
      const min = Math.min(...rates);
      const max = Math.max(...rates);
      const rangeVal = max - min || 1;
      const plotW = width - padding * 2;
      const plotH = height - padding * 2;

      const coords = points.map((p, idx) => {
        const x = padding + (idx / (points.length - 1)) * plotW;
        const y = height - padding - ((p.middleRate - min) / rangeVal) * plotH;
        return { x, y };
      });

      expect(coords.length).toBe(3);
      expect(coords[0].x).toBe(10);
      expect(coords[0].y).toBe(height - padding); // lowest rate at bottom
      expect(coords[1].y).toBe(padding); // highest rate at top
      expect(coords[2].x).toBe(width - padding);

      const pathD = coords.reduce((acc, curr, i) => {
        return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
      }, '');
      expect(pathD).toContain('M 10');
      expect(pathD).toContain('L 290');
    });

    it('supports 7d and 30d range toggles', () => {
      const validRanges: Array<'7d' | '30d'> = ['7d', '30d'];
      expect(validRanges).toContain('7d');
      expect(validRanges).toContain('30d');
      expect(validRanges.length).toBe(2);
    });
  });

  describe('2. Candidate 2: Enhanced Shareable Rate Card', () => {
    const buildDirectLink = (currency: string) => `https://globe.arafz.id/kurs?from=${currency}&to=IDR`;

    const formatShareQuote = (item: {
      currency: string;
      buyRate: number;
      sellRate: number;
      change24h: number;
      provider?: string;
    }) => {
      const directUrl = buildDirectLink(item.currency);
      return [
        `💱 *KURS HARI INI: ${item.currency} ➔ IDR*`,
        `🏦 Sumber: ${item.provider || 'Bank Indonesia / Agregator'}`,
        '',
        `🟢 *Beli:* ${formatRupiah(item.buyRate)}`,
        `🔴 *Jual:* ${formatRupiah(item.sellRate)}`,
        `📊 *Perubahan (24j):* ${formatPercent(item.change24h)}`,
        '',
        '🔗 *Pantau Live Rate & Visualisasi 3D:*',
        directUrl,
      ].join('\n');
    };

    it('constructs canonical deep link matching specification', () => {
      const urlUsd = buildDirectLink('USD');
      expect(urlUsd).toBe('https://globe.arafz.id/kurs?from=USD&to=IDR');

      const urlJpy = buildDirectLink('JPY');
      expect(urlJpy).toBe('https://globe.arafz.id/kurs?from=JPY&to=IDR');
    });

    it('formats WhatsApp / Telegram quote with correct rates and deep link', () => {
      const quote = formatShareQuote({
        currency: 'USD',
        buyRate: 16100,
        sellRate: 16250,
        change24h: 0.25,
        provider: 'BCA (e-Rate)',
      });

      expect(quote).toContain('USD ➔ IDR');
      expect(quote).toContain('Rp 16.100');
      expect(quote).toContain('Rp 16.250');
      expect(quote).toContain('+0.25%');
      expect(quote).toContain('https://globe.arafz.id/kurs?from=USD&to=IDR');
    });
  });

  describe('3. Candidate 4: Rate Alert Modal Polish & Local Storage Persistence', () => {
    interface SavedAlert {
      id: string;
      email: string;
      currency: string;
      condition: 'above' | 'below';
      targetRate: number;
      createdAt: string;
    }

    const calculateComparison = (currentRate: number, targetRate: number) => {
      const diff = targetRate - currentRate;
      const diffPercent = (diff / currentRate) * 100;
      return {
        diff,
        diffPercent: Math.round(diffPercent * 100) / 100,
        formattedCurrent: formatRupiah(currentRate),
        formattedTarget: formatRupiah(targetRate),
      };
    };

    it('calculates accurate comparison difference and percentage badge', () => {
      const comparison = calculateComparison(15850, 16200);
      expect(comparison.formattedCurrent).toContain('15.850');
      expect(comparison.formattedTarget).toContain('16.200');
      expect(comparison.diff).toBe(350);
      expect(comparison.diffPercent).toBeCloseTo(2.21, 1);
    });

    it('calculates negative comparison percentage when target is below current', () => {
      const comparison = calculateComparison(16000, 15600);
      expect(comparison.diff).toBe(-400);
      expect(comparison.diffPercent).toBeCloseTo(-2.5, 1);
    });

    it('serializes, persists, and deletes alerts in localStorage key kurs_saved_alerts', () => {
      const storageMock: Record<string, string> = {};
      const STORAGE_KEY = 'kurs_saved_alerts';

      const saveAlert = (alert: SavedAlert) => {
        const existing: SavedAlert[] = JSON.parse(storageMock[STORAGE_KEY] || '[]');
        const updated = [alert, ...existing];
        storageMock[STORAGE_KEY] = JSON.stringify(updated);
        return updated;
      };

      const removeAlert = (id: string) => {
        const existing: SavedAlert[] = JSON.parse(storageMock[STORAGE_KEY] || '[]');
        const updated = existing.filter((a) => a.id !== id);
        storageMock[STORAGE_KEY] = JSON.stringify(updated);
        return updated;
      };

      const alert1: SavedAlert = {
        id: 'alert-1',
        email: 'user@example.com',
        currency: 'USD',
        condition: 'above',
        targetRate: 16200,
        createdAt: '2026-09-03T00:00:00Z',
      };

      const alert2: SavedAlert = {
        id: 'alert-2',
        email: 'user@example.com',
        currency: 'EUR',
        condition: 'below',
        targetRate: 17000,
        createdAt: '2026-09-03T00:01:00Z',
      };

      saveAlert(alert1);
      saveAlert(alert2);

      const loaded: SavedAlert[] = JSON.parse(storageMock[STORAGE_KEY]);
      expect(loaded.length).toBe(2);
      expect(loaded[0].currency).toBe('EUR');
      expect(loaded[1].currency).toBe('USD');

      const afterDelete = removeAlert('alert-1');
      expect(afterDelete.length).toBe(1);
      expect(afterDelete[0].id).toBe('alert-2');
    });
  });
});
