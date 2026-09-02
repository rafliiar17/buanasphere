import { describe, it, expect, beforeEach } from 'bun:test';
import { idTranslations } from '../src/lib/i18n/locales/id';
import { enTranslations } from '../src/lib/i18n/locales/en';
import {
  t,
  setLocale,
  getLocale,
  formatDateLocale,
  formatTimeLocale,
  formatDateTimeLocale,
  formatCurrencyLocale,
  getLocalizedRegion,
  type SupportedLocale,
} from '../src/lib/i18n';

// Recursive key extractor
function extractDeepKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(extractDeepKeys(val, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('100% i18n Localization Audit & Key Parity Tests (ADR-0024)', () => {
  beforeEach(() => {
    setLocale('id');
  });

  it('should guarantee 100% dictionary key parity between Indonesian (id) and English (en)', () => {
    const idKeys = extractDeepKeys(idTranslations).sort();
    const enKeys = extractDeepKeys(enTranslations).sort();

    const missingInEn = idKeys.filter(k => !enKeys.includes(k));
    const missingInId = enKeys.filter(k => !idKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInId).toEqual([]);
    expect(idKeys.length).toBe(enKeys.length);
  });

  it('should contain all newly audited map and inspector keys in both locales', () => {
    const requiredKeys = [
      'map.flagAlt',
      'map.closeInspector',
      'map.bankCount',
      'map.openFullConverterBtn',
      'map.resetZoom',
      'map.togglePanel',
      'map.countriesFound',
      'map.popularRecommendations',
      'map.selectKey',
      'map.noCountriesFound',
      'map.noResultsFor',
      'map.togglePinLabels',
      'map.selectFocusRegion',
      'map.countryCount',
      'cards.shareTitle',
      'cards.shareSource',
      'cards.shareBuy',
      'cards.shareSell',
      'cards.shareChange',
      'cards.shareFooter',
      'ticker.rateTitle',
      'common.backToMap',
      'footer.edgeInfo',
      'chart.interactiveChartAria',
      'map.regions.all',
      'map.regions.asean',
      'map.regions.eastAsia',
      'map.regions.europe',
      'map.regions.americas',
      'map.regions.middleEast',
      'map.regions.africa',
      'map.regions.oceania',
    ];

    for (const key of requiredKeys) {
      const idVal = t(key, undefined, 'id');
      const enVal = t(key, undefined, 'en');

      expect(idVal).not.toBe(key);
      expect(enVal).not.toBe(key);
      expect(idVal.length).toBeGreaterThan(0);
      expect(enVal.length).toBeGreaterThan(0);
    }
  });

  it('should interpolate parameterized strings accurately in both id and en', () => {
    const idInterpolated = t('map.flagAlt', { country: 'Jepang' }, 'id');
    const enInterpolated = t('map.flagAlt', { country: 'Japan' }, 'en');

    expect(idInterpolated).toBe('Bendera Jepang');
    expect(enInterpolated).toBe('Flag of Japan');

    const idCount = t('map.countriesFound', { count: 12 }, 'id');
    const enCount = t('map.countriesFound', { count: 12 }, 'en');

    expect(idCount).toBe('12 Negara Ditemukan');
    expect(enCount).toBe('12 Countries Found');

    const idBankCount = t('map.bankCount', { count: 4 }, 'id');
    const enBankCount = t('map.bankCount', { count: 4 }, 'en');

    expect(idBankCount).toBe('4 Bank');
    expect(enBankCount).toBe('4 Banks');
  });

  it('should format date and time with locale sensitivity', () => {
    const testDate = new Date('2026-09-02T06:30:00.000Z');

    setLocale('id');
    const dateId = formatDateLocale(testDate);
    const timeId = formatTimeLocale(testDate);
    const dateTimeId = formatDateTimeLocale(testDate);

    expect(dateId).toBeDefined();
    expect(timeId).toBeDefined();
    expect(dateTimeId).toBeDefined();

    setLocale('en');
    const dateEn = formatDateLocale(testDate);
    const timeEn = formatTimeLocale(testDate);
    const dateTimeEn = formatDateTimeLocale(testDate);

    expect(dateEn).toBeDefined();
    expect(timeEn).toBeDefined();
    expect(dateTimeEn).toBeDefined();
  });

  it('should format localized region names accurately', () => {
    expect(getLocalizedRegion('asean', 'id')).toBe('ASEAN');
    expect(getLocalizedRegion('eastAsia', 'id')).toBe('Asia Timur');
    expect(getLocalizedRegion('eastAsia', 'en')).toBe('East Asia');
    expect(getLocalizedRegion('middleEast', 'id')).toBe('Timur Tengah');
    expect(getLocalizedRegion('middleEast', 'en')).toBe('Middle East');
    expect(getLocalizedRegion('europe', 'en')).toBe('Europe');
    expect(getLocalizedRegion('all', 'en')).toBe('All Regions');
  });

  it('should switch active locale and update html lang attribute', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('common.appName')).toBe('Kurs.World');
    expect(t('common.refresh')).toBe('Refresh');

    setLocale('id');
    expect(getLocale()).toBe('id');
    expect(t('common.refresh')).toBe('Segarkan');
  });
});
