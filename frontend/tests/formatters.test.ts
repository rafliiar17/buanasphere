import { describe, expect, it } from 'bun:test';
import {
  formatRupiah,
  formatCurrency,
  formatPercent,
  formatDateTimeIndo,
  formatTimeAgo,
} from '../src/lib/formatters/currency';

describe('Frontend Formatter Unit Tests', () => {
  describe('formatRupiah', () => {
    it('formats standard positive numbers to Indonesian Rupiah with prefix', () => {
      const result = formatRupiah(15850.5);
      expect(result).toContain('Rp');
      expect(result).toContain('15.850,50');
    });

    it('formats numbers without fractions when showFraction is false', () => {
      const result = formatRupiah(15850, { showFraction: false });
      expect(result).toBe('Rp 15.850');
    });

    it('formats numbers without prefix when withPrefix is false', () => {
      const result = formatRupiah(15850, { withPrefix: false, showFraction: false });
      expect(result).toBe('15.850');
    });

    it('handles zero gracefully', () => {
      expect(formatRupiah(0)).toContain('Rp');
      expect(formatRupiah(0, { withPrefix: false, showFraction: false })).toBe('0');
      expect(formatRupiah(0, { withPrefix: false, showFraction: true })).toBe('0,00');
    });

    it('handles NaN, null, and undefined values safely', () => {
      expect(formatRupiah(NaN)).toBe('Rp 0');
      expect(formatRupiah(null as any)).toBe('Rp 0');
      expect(formatRupiah(undefined as any)).toBe('Rp 0');
      expect(formatRupiah(NaN, { withPrefix: false })).toBe('0');
    });
  });

  describe('formatCurrency', () => {
    it('formats IDR through formatRupiah helper', () => {
      const resultInt = formatCurrency(16000, 'IDR');
      expect(resultInt).toBe('Rp 16.000');

      const resultDec = formatCurrency(16000.75, 'IDR');
      expect(resultDec).toContain('16.000,75');
    });

    it('formats USD and foreign currencies using standard currency format', () => {
      const resultUsd = formatCurrency(1250.5, 'USD');
      expect(resultUsd).toContain('1,250.50');
      expect(resultUsd).toContain('$');

      const resultEur = formatCurrency(950.25, 'EUR');
      expect(resultEur).toContain('950.25');

      const resultJpy = formatCurrency(108.35, 'JPY');
      expect(resultJpy).toContain('108.35');
    });

    it('handles micro amounts (< 1) with 4 decimal places by default', () => {
      const result = formatCurrency(0.000062, 'USD');
      expect(result).toBe('$0.0001');
    });

    it('handles NaN and null gracefully', () => {
      expect(formatCurrency(NaN, 'USD')).toBe('0');
      expect(formatCurrency(null as any, 'EUR')).toBe('0');
    });
  });

  describe('formatPercent', () => {
    it('formats positive percentages with + prefix', () => {
      expect(formatPercent(0.254)).toBe('+0.25%');
      expect(formatPercent(1.5)).toBe('+1.50%');
    });

    it('formats negative percentages with - prefix', () => {
      expect(formatPercent(-0.152)).toBe('-0.15%');
      expect(formatPercent(-2.4)).toBe('-2.40%');
    });

    it('formats zero percentage as 0.00%', () => {
      expect(formatPercent(0)).toBe('0.00%');
    });

    it('handles NaN and null values safely', () => {
      expect(formatPercent(NaN)).toBe('0.00%');
      expect(formatPercent(null as any)).toBe('0.00%');
      expect(formatPercent(undefined as any)).toBe('0.00%');
    });
  });

  describe('formatDateTimeIndo', () => {
    it('formats valid Date objects to Indonesian readable string', () => {
      const date = new Date('2026-09-02T08:30:00Z');
      const formatted = formatDateTimeIndo(date);
      expect(formatted).not.toBe('-');
      expect(formatted).toContain('2026');
    });

    it('formats ISO string timestamp and numeric timestamp', () => {
      const isoStr = '2026-09-02T10:00:00Z';
      const formattedStr = formatDateTimeIndo(isoStr);
      expect(formattedStr).not.toBe('-');
      expect(formattedStr).toContain('2026');

      const numTs = Date.now();
      const formattedNum = formatDateTimeIndo(numTs);
      expect(formattedNum).not.toBe('-');
    });

    it('returns "-" for invalid date inputs', () => {
      expect(formatDateTimeIndo('invalid-date')).toBe('-');
      expect(formatDateTimeIndo(NaN)).toBe('-');
    });
  });

  describe('formatTimeAgo', () => {
    it('returns "Baru saja" for timestamps within the last 60 seconds', () => {
      const now = new Date();
      expect(formatTimeAgo(now)).toBe('Baru saja');
      const thirtySecAgo = new Date(now.getTime() - 30 * 1000);
      expect(formatTimeAgo(thirtySecAgo)).toBe('Baru saja');
    });

    it('returns "X menit lalu" for timestamps between 1 and 59 minutes ago', () => {
      const now = new Date();
      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
      expect(formatTimeAgo(tenMinsAgo)).toBe('10 menit lalu');
    });

    it('returns "X jam lalu" for timestamps between 1 and 23 hours ago', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      expect(formatTimeAgo(threeHoursAgo)).toBe('3 jam lalu');
    });

    it('returns "X hari lalu" for timestamps older than 24 hours', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      expect(formatTimeAgo(twoDaysAgo)).toBe('2 hari lalu');
    });

    it('returns "-" for invalid date inputs', () => {
      expect(formatTimeAgo('invalid')).toBe('-');
    });
  });
});
