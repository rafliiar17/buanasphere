import { describe, it, expect, beforeEach } from 'bun:test';
import {
  t,
  setLocale,
  getLocale,
  getLocalizedCountryName,
  getLocalizedCurrencyName,
  getLocalizedRegion,
} from '../src/lib/i18n';

describe('Svelte 5 Reactive i18n & Universal Country/Currency Localizer (ADR-0025)', () => {
  beforeEach(() => {
    setLocale('id');
  });

  it('should resolve localized country names in Indonesian and English', () => {
    // Indonesian
    setLocale('id');
    expect(getLocalizedCountryName('USA')).toBe('Amerika Serikat');
    expect(getLocalizedCountryName('JPN')).toBe('Jepang');
    expect(getLocalizedCountryName('DEU')).toBe('Jerman');
    expect(getLocalizedCountryName('SAU')).toBe('Arab Saudi');
    expect(getLocalizedCountryName('SGP')).toBe('Singapura');
    expect(getLocalizedCountryName('FRA')).toBe('Prancis');

    // English
    setLocale('en');
    expect(getLocalizedCountryName('USA')).toBe('United States');
    expect(getLocalizedCountryName('JPN')).toBe('Japan');
    expect(getLocalizedCountryName('DEU')).toBe('Germany');
    expect(getLocalizedCountryName('SAU')).toBe('Saudi Arabia');
    expect(getLocalizedCountryName('SGP')).toBe('Singapore');
    expect(getLocalizedCountryName('FRA')).toBe('France');
  });

  it('should resolve localized currency names in Indonesian and English', () => {
    setLocale('id');
    const usdId = getLocalizedCurrencyName('USD');
    const jpyId = getLocalizedCurrencyName('JPY');
    expect(usdId.toLowerCase()).toContain('dolar');
    expect(jpyId.toLowerCase()).toContain('yen');

    setLocale('en');
    const usdEn = getLocalizedCurrencyName('USD');
    const jpyEn = getLocalizedCurrencyName('JPY');
    expect(usdEn).toBe('US Dollar');
    expect(jpyEn).toBe('Japanese Yen');
  });

  it('should reactively update t() outputs upon setLocale without manual reload', () => {
    setLocale('id');
    expect(t('map.controlCenter')).toBe('Pusat Kontrol Peta');
    expect(t('map.searchPlaceholder')).toContain('Cari negara');
    expect(t('map.viewAndLayers')).toBe('Tampilan Peta & Lapisan');
    expect(t('map.colorMetric')).toBe('Pewarnaan Metrik');
    expect(t('map.modeRate')).toBe('Kurs Nominal');
    expect(t('map.modeChange')).toBe('Tren 24 Jam');
    expect(t('map.modeFlag')).toContain('Bendera Negara');
    expect(t('map.regionFilter')).toBe('Filter Kawasan Dunia');

    setLocale('en');
    expect(t('map.controlCenter')).toBe('Map Control Center');
    expect(t('map.searchPlaceholder')).toContain('Search country');
    expect(t('map.viewAndLayers')).toBe('Map Views & Layers');
    expect(t('map.colorMetric')).toBe('Color Metric');
    expect(t('map.modeRate')).toBe('Nominal Rate');
    expect(t('map.modeChange')).toBe('24h Trend');
    expect(t('map.modeFlag')).toContain('Country Flag');
    expect(t('map.regionFilter')).toBe('World Region Filter');
  });

  it('should accurately translate region names', () => {
    setLocale('id');
    expect(getLocalizedRegion('all')).toBe('Semua Kawasan');
    expect(getLocalizedRegion('asean')).toBe('ASEAN');
    expect(getLocalizedRegion('eastAsia')).toBe('Asia Timur');
    expect(getLocalizedRegion('middleEast')).toBe('Timur Tengah');

    setLocale('en');
    expect(getLocalizedRegion('all')).toBe('All Regions');
    expect(getLocalizedRegion('asean')).toBe('ASEAN');
    expect(getLocalizedRegion('eastAsia')).toBe('East Asia');
    expect(getLocalizedRegion('middleEast')).toBe('Middle East');
  });
});
