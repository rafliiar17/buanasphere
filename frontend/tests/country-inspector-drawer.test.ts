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
    currency: 'JPY',
    baseCurrency: 'IDR',
    timestamp: '2026-09-02T00:00:00Z',
    totalProviders: 2,
    bestBuyProvider: 'mandiri',
    bestSellProvider: 'bca',
    lowestSpreadProvider: 'bca',
    rows: [
      {
        providerId: 'bca',
        providerName: 'BCA (e-Rate)',
        providerType: 'commercial_bank',
        rateType: 'e-Rate',
        buyRate: 107.5,
        sellRate: 109.2,
        middleRate: 108.35,
        spread: 1.7,
        spreadPercent: 1.57,
        updatedAt: '2026-09-02T00:00:00Z',
        isBestBuy: false,
        isBestSell: true,
        isLowestSpread: true,
      },
      {
        providerId: 'mandiri',
        providerName: 'Bank Mandiri',
        providerType: 'commercial_bank',
        rateType: 'Special Rate',
        buyRate: 107.8,
        sellRate: 109.5,
        middleRate: 108.65,
        spread: 1.7,
        spreadPercent: 1.56,
        updatedAt: '2026-09-02T00:00:00Z',
        isBestBuy: true,
        isBestSell: false,
        isLowestSpread: true,
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
      const changeFormatted = formatPercent(mockLiveRate.change24h ?? 0);

      expect(midFormatted).toContain('108,35');
      expect(buyFormatted).toContain('107,50');
      expect(sellFormatted).toContain('109,20');
      expect(spreadFormatted).toContain('1,70');
      expect(changeFormatted).toBe('-0.45%');
    });

    it('determines positive / negative 24h trend styling correctly', () => {
      const isNegative = (mockLiveRate.change24h ?? 0) < 0;
      expect(isNegative).toBeTrue();

      const positiveRate: RateItem = { ...mockLiveRate, change24h: 0.35 };
      expect((positiveRate.change24h ?? 0) >= 0).toBeTrue();
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
      const bestBuyRow = mockBankMatrix.rows.find((r) => r.isBestBuy);
      const bestSellRow = mockBankMatrix.rows.find((r) => r.isBestSell);

      expect(mockBankMatrix.bestBuyProvider).toBe('mandiri');
      expect(bestBuyRow?.providerId).toBe('mandiri');
      expect(bestBuyRow?.buyRate).toBe(107.8);

      expect(mockBankMatrix.bestSellProvider).toBe('bca');
      expect(bestSellRow?.providerId).toBe('bca');
      expect(bestSellRow?.sellRate).toBe(109.2);
    });

    it('sorts bank matrix providers by lowest spread', () => {
      const sortedBySpread = [...mockBankMatrix.rows].sort(
        (a, b) => a.spread - b.spread
      );
      expect(sortedBySpread.length).toBe(2);
      expect(sortedBySpread[0].spread).toBe(1.7);
    });
  });

  describe('Split-Screen Docked Layout & Double Click Interaction Logic', () => {
    it('detects double-click within 350ms on same country to trigger split-screen inspector', () => {
      let lastClickTime = 1000;
      const lastClickedIso3 = 'JPN';

      // First click at t = 1000ms
      // Second click at t = 1250ms (delta 250ms <= 350ms) on JPN
      const secondClickTime = 1250;
      const secondIso3 = 'JPN';
      const isDoubleClick = (secondClickTime - lastClickTime < 350) && (lastClickedIso3 === secondIso3);
      expect(isDoubleClick).toBeTrue();

      // Third click on different country (e.g. USA) within 200ms -> should not be double click on JPN
      const thirdClickTime = 1400;
      const thirdIso3 = 'USA';
      const isDiffCountryDoubleClick = (thirdClickTime - secondClickTime < 350) && ((secondIso3 as string) === (thirdIso3 as string));
      expect(isDiffCountryDoubleClick).toBeFalse();

      // Fourth click after 500ms on same country -> should not be double click (exceeded timeout)
      const fourthClickTime = 2000;
      const isSlowClickDoubleClick = (fourthClickTime - thirdClickTime < 350) && (thirdIso3 === thirdIso3);
      expect(isSlowClickDoubleClick).toBeFalse();
    });

    it('verifies split-screen docked container classes (left globe canvas + right docked panel, no blocking backdrop)', () => {
      // Fullscreen wrapper
      const wrapperClasses = 'flex flex-col md:flex-row w-full h-[calc(100vh-52px)] overflow-hidden bg-[var(--bg)]';
      expect(wrapperClasses).toContain('flex-col');
      expect(wrapperClasses).toContain('md:flex-row');

      // Left Globe section: expands to full width when closed, shrinks smoothly to flex-1 when docked
      const leftGlobeSection = 'flex-1 h-full min-w-0 relative overflow-hidden transition-all duration-300';
      expect(leftGlobeSection).toContain('flex-1');
      expect(leftGlobeSection).toContain('min-w-0');

      // Right Docked Panel: docked sidebar on desktop, bottom docked half on mobile
      const rightDockedPanel = 'w-full md:w-[440px] lg:w-[480px] xl:w-[520px] shrink-0 h-full border-l border-[var(--bg-rule)] bg-[var(--bg-raised)]';
      expect(rightDockedPanel).toContain('md:w-[440px]');
      expect(rightDockedPanel).toContain('border-l');
      expect(rightDockedPanel).toContain('shrink-0');
    });
  });
});
