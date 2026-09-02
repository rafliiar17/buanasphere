import { describe, expect, it } from 'bun:test';
import { SUPPORTED_CURRENCIES } from '../src/lib/api/client';
import { formatRupiah, formatPercent, formatCurrency } from '../src/lib/formatters/currency';
import type { RateItem } from '../src/lib/api/types';

describe('Map Experience & Global Movers Unit Tests', () => {
  const mockRates: RateItem[] = [
    {
      id: 'bca-usd',
      providerId: 'bca',
      providerName: 'BCA (e-Rate)',
      baseCurrency: 'IDR',
      targetCurrency: 'USD',
      buyRate: 16220,
      sellRate: 16280,
      middleRate: 16250,
      spread: 60,
      spreadPercent: 0.37,
      change24h: 0.25,
      updatedAt: '2026-09-02T00:00:00Z',
    },
    {
      id: 'bca-eur',
      providerId: 'bca',
      providerName: 'BCA (e-Rate)',
      baseCurrency: 'IDR',
      targetCurrency: 'EUR',
      buyRate: 17050,
      sellRate: 17180,
      middleRate: 17115,
      spread: 130,
      spreadPercent: 0.76,
      change24h: -0.22,
      updatedAt: '2026-09-02T00:00:00Z',
    },
    {
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
    },
    {
      id: 'bca-sgd',
      providerId: 'bca',
      providerName: 'BCA (e-Rate)',
      baseCurrency: 'IDR',
      targetCurrency: 'SGD',
      buyRate: 12180,
      sellRate: 12260,
      middleRate: 12220,
      spread: 80,
      spreadPercent: 0.65,
      change24h: 0.08,
      updatedAt: '2026-09-02T00:00:00Z',
    },
    {
      id: 'bca-aud',
      providerId: 'bca',
      providerName: 'BCA (e-Rate)',
      baseCurrency: 'IDR',
      targetCurrency: 'AUD',
      buyRate: 10380,
      sellRate: 10490,
      middleRate: 10435,
      spread: 110,
      spreadPercent: 1.05,
      change24h: 0.31,
      updatedAt: '2026-09-02T00:00:00Z',
    },
  ];

  describe('Global Movers Ticker Sorting Logic', () => {
    it('sorts top 3 gainers (menguat vs IDR) in descending order of change24h', () => {
      const topGainers = [...mockRates]
        .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
        .slice(0, 3);

      expect(topGainers.length).toBe(3);
      expect(topGainers[0].targetCurrency).toBe('AUD'); // +0.31%
      expect(topGainers[1].targetCurrency).toBe('USD'); // +0.25%
      expect(topGainers[2].targetCurrency).toBe('SGD'); // +0.08%
    });

    it('sorts top 3 losers (melemah vs IDR) in ascending order of change24h', () => {
      const topLosers = [...mockRates]
        .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0))
        .slice(0, 3);

      expect(topLosers.length).toBe(3);
      expect(topLosers[0].targetCurrency).toBe('JPY'); // -0.45%
      expect(topLosers[1].targetCurrency).toBe('EUR'); // -0.22%
      expect(topLosers[2].targetCurrency).toBe('SGD'); // +0.08%
    });
  });

  describe('Mini Quick Converter Calculations', () => {
    it('calculates Foreign to IDR correctly', () => {
      const usdRate = 16250;
      const amount = 100;
      const result = amount * usdRate;
      expect(result).toBe(1625000);
      expect(formatRupiah(result, { showFraction: false })).toBe('Rp 1.625.000');
    });

    it('calculates IDR to Foreign correctly', () => {
      const usdRate = 16250;
      const amountIdr = 1625000;
      const result = amountIdr / usdRate;
      expect(result).toBe(100);
      expect(formatCurrency(result, 'USD', { maxDecimals: 2 })).toBe('$100.00');
    });

    it('handles micro currency like VND calculation', () => {
      const vndMid = 0.64;
      const amountVnd = 100000;
      const resultIdr = amountVnd * vndMid;
      expect(resultIdr).toBe(64000);
      expect(formatRupiah(resultIdr, { showFraction: false })).toBe('Rp 64.000');
    });
  });

  describe('Supported Currency Metadata Integrity', () => {
    it('contains valid flags and countries for all popular tickers', () => {
      const popular = ['USD', 'EUR', 'SGD', 'JPY', 'MYR', 'CNY', 'SAR'];
      for (const code of popular) {
        const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
        expect(found).toBeDefined();
        expect(found?.flag).toBeString();
        expect(found?.flag.length).toBeGreaterThan(0);
        expect(found?.country).toBeString();
      }
    });
  });
});
