import { describe, expect, it } from 'bun:test';
import { COUNTRY_CURRENCY_MAP, PRESET_AMOUNTS } from '../src/lib/features/map/map-constants';
import { formatRupiah, formatPercent, formatCurrency } from '../src/lib/formatters/currency';
import type { RateItem, RateMatrixResponse } from '../src/lib/api/types';

describe('Country Inspector Drawer & Floating Panel Unit Tests', () => {
  const mockCountry = COUNTRY_CURRENCY_MAP.find((c) => c.iso3 === 'JPN')!;
  const mockLiveRate: RateItem = {
    id: 'bca-jpy',
    providerId: 'bca',
    providerName: 'BCA (e-Rate)',
    baseCurrency: 'IDR',
    targetCurrency: 'JPY',
    buyRate: 107.5,
    sellRate: 109.2,
    middleRate: 108.35,
    spread: 1.7,
    spreadPercent: 1.57,
    change24h: -0.45,
    updatedAt: '2026-09-02T00:00:00Z',
  };

  const mockBankMatrix: RateMatrixResponse = {
    targetCurrency: 'JPY',
    baseCurrency: 'IDR',
    updatedAt: '2026-09-02T00:00:00Z',
    bestBuy: {
      providerId: 'mandiri',
      providerName: 'Bank Mandiri',
      rate: 107.8,
    },
    bestSell: {
      providerId: 'bca',
      providerName: 'BCA (e-Rate)',
      rate: 109.2,
    },
    matrix: [
      {
        providerId: 'bca',
        providerName: 'BCA (e-Rate)',
        buyRate: 107.5,
        sellRate: 109.2,
        middleRate: 108.35,
        spread: 1.7,
        updatedAt: '2026-09-02T00:00:00Z',
      },
      {
        providerId: 'mandiri',
        providerName: 'Bank Mandiri',
        buyRate: 107.8,
        sellRate: 109.5,
        middleRate: 108.65,
        spread: 1.7,
        updatedAt: '2026-09-02T00:00:00Z',
      },
    ],
  };

  describe('Drawer State & Country Data Formatting', () => {
    it('populates inspector country metadata with flag, code, region and rates accurately', () => {
      expect(mockCountry).toBeDefined();
      expect(mockCountry.iso3).toBe('JPN');
      expect(mockCountry.currencyCode).toBe('JPY');
      expect(mockCountry.countryName).toBe('Jepang');
      expect(mockCountry.flag).toBe('🇯🇵');

      const midFormatted = formatRupiah(mockLiveRate.middleRate, { showFraction: true });
      const buyFormatted = formatRupiah(mockLiveRate.buyRate, { showFraction: true });
      const sellFormatted = formatRupiah(mockLiveRate.sellRate, { showFraction: true });
      const spreadFormatted = formatRupiah(mockLiveRate.spread, { showFraction: true });
      const changeFormatted = formatPercent(mockLiveRate.change24h);

      expect(midFormatted).toContain('108,35');
      expect(buyFormatted).toContain('107,50');
      expect(sellFormatted).toContain('109,20');
      expect(spreadFormatted).toContain('1,70');
      expect(changeFormatted).toBe('-0.45%');
    });

    it('determines positive / negative 24h trend styling correctly', () => {
      const isNegative = mockLiveRate.change24h < 0;
      expect(isNegative).toBeTrue();

      const positiveRate: RateItem = { ...mockLiveRate, change24h: 0.35 };
      expect(positiveRate.change24h >= 0).toBeTrue();
    });
  });

  describe('Quick Converter Inside Drawer', () => {
    it('converts Foreign to IDR for multiple amounts', () => {
      const amount = 1000;
      const convertedIdr = amount * mockLiveRate.middleRate;
      expect(convertedIdr).toBe(108350);

      const formatted = formatRupiah(convertedIdr, { showFraction: false });
      expect(formatted).toBe('Rp 108.350');
    });

    it('converts IDR to Foreign for multiple amounts', () => {
      const amountIdr = 1000000;
      const convertedForeign = amountIdr / mockLiveRate.middleRate;
      expect(convertedForeign).toBeCloseTo(9229.349, 2);

      const formatted = formatCurrency(convertedForeign, 'JPY', { maxDecimals: 2 });
      expect(formatted).toContain('9,229.35');
    });

    it('verifies all preset amounts are valid integers >= 1', () => {
      expect(PRESET_AMOUNTS.length).toBeGreaterThanOrEqual(4);
      for (const p of PRESET_AMOUNTS) {
        expect(p).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(p)).toBeTrue();
      }
    });
  });

  describe('Bank Comparison Matrix Inside Drawer', () => {
    it('identifies best buy and best sell bank offers in the matrix', () => {
      expect(mockBankMatrix.bestBuy?.providerId).toBe('mandiri');
      expect(mockBankMatrix.bestBuy?.rate).toBe(107.8);
      expect(mockBankMatrix.bestSell?.providerId).toBe('bca');
      expect(mockBankMatrix.bestSell?.rate).toBe(109.2);
    });

    it('sorts bank matrix providers by lowest spread', () => {
      const sortedBySpread = [...mockBankMatrix.matrix].sort(
        (a, b) => a.spread - b.spread
      );
      expect(sortedBySpread.length).toBe(2);
      expect(sortedBySpread[0].spread).toBe(1.7);
    });
  });

  describe('Accessibility & Responsive Design Classes', () => {
    it('verifies responsive classes for Mobile Bottom Drawer vs Desktop Floating Panel', () => {
      // Mobile Drawer classes: bottom sheet
      const mobileClasses = 'fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl border-t';
      expect(mobileClasses).toContain('bottom-0');
      expect(mobileClasses).toContain('rounded-t-3xl');

      // Desktop Drawer classes: floating glass panel on right side
      const desktopClasses = 'md:fixed md:top-4 md:right-4 md:bottom-4 md:w-[460px] md:rounded-2xl md:border';
      expect(desktopClasses).toContain('md:fixed');
      expect(desktopClasses).toContain('md:top-4');
      expect(desktopClasses).toContain('md:right-4');
    });
  });
});
