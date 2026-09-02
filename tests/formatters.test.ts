import { describe, expect, it } from 'bun:test';
import {
  formatRupiah,
  formatCurrency,
  formatPercent,
  formatDateTimeIndo,
  formatTimeAgo,
} from '../frontend/src/lib/formatters/currency';

describe('Frontend Currency & Date Formatters', () => {
  it('formatRupiah should format positive numbers to standard Indonesian format', () => {
    const formatted = formatRupiah(15850.5, { showFraction: true });
    // Check rupiah formatting with comma fraction
    expect(formatted).toContain('15.850,50');
    expect(formatted).toContain('Rp');
  });

  it('formatRupiah should handle zero and invalid numbers gracefully', () => {
    expect(formatRupiah(0)).toContain('Rp');
    expect(formatRupiah(NaN)).toBe('Rp 0');
  });

  it('formatCurrency should format foreign currencies correctly', () => {
    const formattedUsd = formatCurrency(1250.5, 'USD');
    expect(formattedUsd).toContain('1,250.50');

    const formattedIdr = formatCurrency(15000, 'IDR');
    expect(formattedIdr).toContain('15.000');
  });

  it('formatPercent should format positive and negative percentages with signs', () => {
    expect(formatPercent(0.25)).toBe('+0.25%');
    expect(formatPercent(-0.15)).toBe('-0.15%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('formatDateTimeIndo should format valid dates', () => {
    const date = new Date('2026-09-02T08:00:00Z');
    const formatted = formatDateTimeIndo(date);
    expect(formatted).not.toBe('-');
    expect(formatted.length).toBeGreaterThan(5);
  });

  it('formatTimeAgo should return appropriate relative time', () => {
    const now = new Date();
    expect(formatTimeAgo(now)).toBe('Baru saja');

    const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatTimeAgo(fiveMinsAgo)).toBe('5 menit lalu');
  });
});
