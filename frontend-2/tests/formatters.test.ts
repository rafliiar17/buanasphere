import { describe, it, expect } from 'bun:test';
import {
  formatRupiah,
  formatPercent,
  formatCurrency,
  formatDateTimeIndo,
  formatTimeAgo,
  formatCompactNumber,
} from '../src/lib/formatters/currency';

describe('Currency & Financial Formatters (frontend-2)', () => {
  describe('formatRupiah', () => {
    it('formats numbers to Indonesian Rupiah standard format', () => {
      const result = formatRupiah(15850);
      expect(result).toBe('Rp 15.850,00');
    });

    it('formats with fraction decimals correctly', () => {
      const result = formatRupiah(15850.5);
      expect(result).toBe('Rp 15.850,50');
    });

    it('supports showFraction = false', () => {
      const result = formatRupiah(15850, { showFraction: false });
      expect(result).toBe('Rp 15.850');
    });

    it('supports withPrefix = false', () => {
      const result = formatRupiah(15850, { withPrefix: false });
      expect(result).toBe('15.850,00');
    });

    it('handles zero gracefully', () => {
      const result = formatRupiah(0);
      expect(result).toBe('Rp 0,00');
    });

    it('handles NaN, null, or undefined gracefully', () => {
      expect(formatRupiah(NaN)).toBe('Rp 0');
      // @ts-ignore
      expect(formatRupiah(null)).toBe('Rp 0');
      // @ts-ignore
      expect(formatRupiah(undefined)).toBe('Rp 0');
      expect(formatRupiah(NaN, { withPrefix: false })).toBe('0');
    });
  });

  describe('formatPercent', () => {
    it('formats positive values with + prefix', () => {
      expect(formatPercent(0.25)).toBe('+0.25%');
      expect(formatPercent(1.5)).toBe('+1.50%');
    });

    it('formats negative values with - prefix', () => {
      expect(formatPercent(-0.15)).toBe('-0.15%');
      expect(formatPercent(-2.456)).toBe('-2.46%');
    });

    it('formats zero without + sign', () => {
      expect(formatPercent(0)).toBe('0.00%');
    });

    it('handles NaN or invalid values gracefully', () => {
      expect(formatPercent(NaN)).toBe('0.00%');
      // @ts-ignore
      expect(formatPercent(null)).toBe('0.00%');
    });
  });

  describe('formatCurrency', () => {
    it('formats IDR using formatRupiah standard', () => {
      const res = formatCurrency(50000, 'IDR');
      expect(res).toContain('50.000');
      expect(res).toContain('Rp');
    });

    it('formats USD correctly with en-US currency style', () => {
      const res = formatCurrency(100, 'USD');
      expect(res).toBe('$100.00');
    });

    it('formats micro-rates (< 1) with 4 decimal places by default', () => {
      const res = formatCurrency(0.0056, 'USD');
      expect(res).toBe('$0.0056');
    });

    it('handles invalid numbers gracefully', () => {
      expect(formatCurrency(NaN, 'USD')).toBe('0');
      // @ts-ignore
      expect(formatCurrency(null, 'USD')).toBe('0');
    });
  });

  describe('formatDateTimeIndo', () => {
    it('formats valid Date objects to id-ID format', () => {
      const date = new Date('2026-09-03T10:30:00Z');
      const formatted = formatDateTimeIndo(date);
      expect(formatted).not.toBe('-');
      expect(formatted).toContain('2026');
    });

    it('formats ISO string dates', () => {
      const formatted = formatDateTimeIndo('2026-09-03T10:30:00Z');
      expect(formatted).not.toBe('-');
    });

    it('returns "-" for invalid dates', () => {
      expect(formatDateTimeIndo('invalid-date')).toBe('-');
    });
  });

  describe('formatTimeAgo', () => {
    it('returns "Baru saja" for timestamps less than 10 seconds ago', () => {
      const now = new Date();
      expect(formatTimeAgo(now)).toBe('Baru saja');
    });

    it('returns minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatTimeAgo(fiveMinAgo)).toBe('5 menit lalu');
    });

    it('returns hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
      expect(formatTimeAgo(twoHoursAgo)).toBe('2 jam lalu');
    });

    it('returns "-" for invalid date inputs', () => {
      expect(formatTimeAgo('invalid')).toBe('-');
    });
  });

  describe('formatCompactNumber', () => {
    it('formats small numbers as plain string', () => {
      expect(formatCompactNumber(500)).toBe('500');
    });

    it('formats thousands with "rb"', () => {
      expect(formatCompactNumber(1500)).toBe('1.5 rb');
    });

    it('formats millions with "Jt"', () => {
      expect(formatCompactNumber(275000000)).toBe('275.0 Jt');
    });

    it('formats billions with "M"', () => {
      expect(formatCompactNumber(1200000000)).toBe('1.2 M');
    });
  });
});
