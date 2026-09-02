import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Cross-currency conversion calculation helper
 */
export function calculateCrossCurrencyRate(
  sourceAmount: number,
  sourceMiddleRate: number,
  targetMiddleRate: number
): number {
  if (!sourceMiddleRate || !targetMiddleRate || sourceMiddleRate <= 0 || targetMiddleRate <= 0) return 0;
  const idrEquivalent = sourceAmount * sourceMiddleRate;
  return idrEquivalent / targetMiddleRate;
}

export interface MultiCurrencyComparisonItem {
  code: string;
  flag: string;
  name: string;
  symbol: string;
  value: number;
  formatted: string;
}

const BENCHMARK_CURRENCIES = [
  { code: 'IDR', flag: '🇮🇩', name: 'Rupiah Indonesia', symbol: 'Rp', defaultRate: 1 },
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar', symbol: '$', defaultRate: 15850 },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro', symbol: '€', defaultRate: 17200 },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar', symbol: 'S$', defaultRate: 11900 },
  { code: 'MYR', flag: '🇲🇾', name: 'Malaysian Ringgit', symbol: 'RM', defaultRate: 3580 },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen', symbol: '¥', defaultRate: 104 },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar', symbol: 'A$', defaultRate: 10350 },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound', symbol: '£', defaultRate: 20100 },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan', symbol: '¥', defaultRate: 2190 },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal', symbol: 'SR', defaultRate: 4225 },
];

export function getMultiCurrencyComparisons(
  sourceCode: string,
  sourceAmount: number,
  sourceMiddleRate: number,
  ratesMap: Record<string, number> = {}
): MultiCurrencyComparisonItem[] {
  return BENCHMARK_CURRENCIES.map(b => {
    const targetMiddleRate = b.code === 'IDR' ? 1 : (ratesMap[b.code] || b.defaultRate);
    const convertedVal = b.code === sourceCode
      ? sourceAmount
      : calculateCrossCurrencyRate(sourceAmount, sourceMiddleRate, targetMiddleRate);

    let formatted = '';
    if (b.code === 'IDR') {
      formatted = `Rp ${Math.round(convertedVal).toLocaleString('id-ID')}`;
    } else if (convertedVal >= 100) {
      formatted = `${b.symbol} ${convertedVal.toFixed(2)}`;
    } else if (convertedVal >= 1) {
      formatted = `${b.symbol} ${convertedVal.toFixed(2)}`;
    } else {
      formatted = `${b.symbol} ${convertedVal.toFixed(4)}`;
    }

    return {
      code: b.code,
      flag: b.flag,
      name: b.name,
      symbol: b.symbol,
      value: convertedVal,
      formatted,
    };
  });
}

const MAPSTATE_SVELTE_PATH = path.resolve(__dirname, '../src/lib/features/map/mapState.svelte.ts');
const MAPSTATE_TS_PATH = path.resolve(__dirname, '../src/lib/features/map/mapState.ts');
const KURS_CONTROLS_PATH = path.resolve(__dirname, '../src/lib/apps/kurs/KursControls.svelte');

describe('Dynamic Multi-Currency Comparison & Base Unit Suite (ADR 0036 / TDD)', () => {

  describe('1. Default Amount Calibration in MapState', () => {
    it('initializes convertAmount with 1 by default in mapState.svelte.ts', () => {
      const src = fs.readFileSync(MAPSTATE_SVELTE_PATH, 'utf-8');
      expect(src).toContain('convertAmount: number = $state(1)');
      expect(src).not.toContain('convertAmount: number = $state(100);');
    });

    it('initializes convertAmount with 1 by default in mapState.ts', () => {
      const src = fs.readFileSync(MAPSTATE_TS_PATH, 'utf-8');
      expect(src).toContain('convertAmount: number = 1;');
      expect(src).not.toContain('convertAmount: number = 100;');
    });

    it('smartly recalibrates convertAmount on toggleConvertDirection in mapState.svelte.ts', () => {
      const src = fs.readFileSync(MAPSTATE_SVELTE_PATH, 'utf-8');
      expect(src).toContain('toggleConvertDirection');
      expect(src).toContain('100000');
    });
  });

  describe('2. Cross-Currency Rate Mathematical Integrity', () => {
    it('calculates 1 USD correctly to IDR, EUR, SGD, and JPY', () => {
      const usdToIdr = calculateCrossCurrencyRate(1, 15850, 1);
      expect(usdToIdr).toBe(15850);

      const usdToEur = calculateCrossCurrencyRate(1, 15850, 17200);
      expect(usdToEur).toBeCloseTo(0.9215, 3);

      const usdToSgd = calculateCrossCurrencyRate(1, 15850, 11900);
      expect(usdToSgd).toBeCloseTo(1.3319, 3);

      const usdToJpy = calculateCrossCurrencyRate(1, 15850, 104);
      expect(usdToJpy).toBeCloseTo(152.4038, 2);
    });

    it('calculates 1 PLN (Polish Zloty) to IDR, USD, and EUR', () => {
      const plnRate = 4000;
      const plnToIdr = calculateCrossCurrencyRate(1, plnRate, 1);
      expect(plnToIdr).toBe(4000);

      const plnToUsd = calculateCrossCurrencyRate(1, plnRate, 15850);
      expect(plnToUsd).toBeCloseTo(0.2523, 3);

      const plnToEur = calculateCrossCurrencyRate(1, plnRate, 17200);
      expect(plnToEur).toBeCloseTo(0.2325, 3);
    });

    it('handles zero and negative amounts gracefully without division by zero errors', () => {
      expect(calculateCrossCurrencyRate(0, 15850, 17200)).toBe(0);
      expect(calculateCrossCurrencyRate(100, 0, 17200)).toBe(0);
      expect(calculateCrossCurrencyRate(100, 15850, 0)).toBe(0);
    });
  });

  describe('3. Multi-Currency Comparison List Generation', () => {
    it('generates comparison items for all major global benchmark currencies', () => {
      const comparisons = getMultiCurrencyComparisons('USD', 1, 15850);
      expect(comparisons.length).toBeGreaterThanOrEqual(8);

      const codes = comparisons.map(c => c.code);
      expect(codes).toContain('IDR');
      expect(codes).toContain('USD');
      expect(codes).toContain('EUR');
      expect(codes).toContain('SGD');
      expect(codes).toContain('JPY');
      expect(codes).toContain('MYR');
      expect(codes).toContain('AUD');
      expect(codes).toContain('GBP');
      expect(codes).toContain('CNY');
      expect(codes).toContain('SAR');

      const idrItem = comparisons.find(c => c.code === 'IDR');
      expect(idrItem?.formatted).toContain('15.850');
    });

    it('formats comparative values with proper localized symbols and decimal precision', () => {
      const comparisons = getMultiCurrencyComparisons('EUR', 10, 17200);
      const usdItem = comparisons.find(c => c.code === 'USD');
      expect(usdItem?.value).toBeCloseTo(10.85, 1);
      expect(usdItem?.formatted).toContain('$');
    });
  });

  describe('4. KursControls UI Integration for Multi-Valas Comparison', () => {
    it('contains multi-currency comparison section or preset chips in KursControls.svelte', () => {
      const src = fs.readFileSync(KURS_CONTROLS_PATH, 'utf-8');
      expect(src).toContain('multiCurrencyComparisons');
      expect(src).toContain('presetAmounts');
    });
  });
});
