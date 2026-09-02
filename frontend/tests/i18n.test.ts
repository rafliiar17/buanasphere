import { describe, it, expect, beforeEach } from 'bun:test';
import { t, getLocale, setLocale, formatCurrencyLocale, SUPPORTED_LOCALES } from '../src/lib/i18n';

describe('i18n Translation & Localization System', () => {
  beforeEach(() => {
    setLocale('id');
  });

  it('should list supported locales: id (Indonesian) and en (English)', () => {
    expect(SUPPORTED_LOCALES.length).toBe(2);
    expect(SUPPORTED_LOCALES.map(l => l.code)).toEqual(['id', 'en']);
  });

  it('should translate default Indonesian keys', () => {
    setLocale('id');
    expect(getLocale()).toBe('id');
    expect(t('common.beta')).toBe('Beta');
    expect(t('tabs.map')).toBe('🗺️ Peta Kurs Dunia');
    expect(t('tabs.chart')).toBe('📈 Grafik & Analisis Tren');
    expect(t('navbar.disclaimerStrip')).toContain('Informasi kurs publik');
    expect(t('chart.high')).toBe('Tertinggi (High)');
    expect(t('chart.low')).toBe('Terendah (Low)');
  });

  it('should translate English keys when locale is switched to en', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('tabs.map')).toBe('🗺️ World Rate Map');
    expect(t('tabs.chart')).toBe('📈 Trends & Charts');
    expect(t('tabs.matrix')).toBe('📊 World FX Matrix');
    expect(t('navbar.disclaimerStrip')).toContain('Public exchange rate data');
    expect(t('chart.high')).toBe('Highest (High)');
    expect(t('chart.low')).toBe('Lowest (Low)');
    expect(t('matrix.table.midRate')).toBe('Middle Rate (Rp)');
  });

  it('should interpolate parameters correctly in both languages', () => {
    // Indonesian parameter interpolation
    setLocale('id');
    const idResult = t('matrix.pagination', { from: 1, to: 20, total: 195 });
    expect(idResult).toBe('Menampilkan 1 - 20 dari 195 mata uang dunia');

    // English parameter interpolation
    setLocale('en');
    const enResult = t('matrix.pagination', { from: 1, to: 20, total: 195 });
    expect(enResult).toBe('Showing 1 - 20 of 195 world currencies');
  });

  it('should fallback gracefully to key or Indonesian for unknown/missing keys', () => {
    setLocale('en');
    const missingKey = 'non.existent.translation.key';
    expect(t(missingKey)).toBe(missingKey);
  });

  it('should format currency accurately according to locale', () => {
    setLocale('id');
    const idrFormatted = formatCurrencyLocale(16250, 'IDR');
    expect(idrFormatted).toContain('16.250');

    setLocale('en');
    const enFormatted = formatCurrencyLocale(16250, 'IDR');
    expect(enFormatted).toContain('16,250');
  });
});
