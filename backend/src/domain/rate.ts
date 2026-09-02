/**
 * Domain entity and type definitions for Kurs World.
 * Ubiquitous language definitions aligned with CONTEXT.md and AGENTS.md.
 */

export type CurrencyCode =
  | 'IDR'
  | 'USD'
  | 'EUR'
  | 'SGD'
  | 'JPY'
  | 'GBP'
  | 'AUD'
  | 'CNY'
  | 'MYR'
  | 'SAR'
  | 'THB'
  | 'CAD'
  | 'CHF'
  | 'HKD'
  | 'KRW'
  | 'NZD'
  | 'INR'
  | 'BRL'
  | 'ZAR'
  | 'AED'
  | 'PHP'
  | 'VND'
  | string;

export type ProviderType = 'central_bank' | 'commercial_bank' | 'market_reference';

export interface RateProviderInfo {
  id: string;
  name: string;
  type: ProviderType;
  website: string;
  logoUrl?: string;
  description?: string;
}

export interface CurrencyPair {
  base: CurrencyCode;
  quote: CurrencyCode;
}

/**
 * Normalized rate entity representing an exchange rate snapshot.
 */
export interface Rate {
  id?: string;
  provider: string;
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  buyRate: number;
  sellRate: number;
  midRate: number;
  spread: number;
  retrievedAt: string; // ISO 8601
  providerTimestamp?: string; // ISO 8601 or raw string from provider
  sourceUrl?: string;
  rawData?: Record<string, unknown>;
}

export interface ProviderComparisonRate {
  provider: string;
  providerName: string;
  providerType: ProviderType;
  buyRate: number;
  sellRate: number;
  midRate: number;
  spread: number;
  updatedAt: string;
}

export interface ComparisonResult {
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  timestamp: string;
  rates: ProviderComparisonRate[];
  bestForCustomerBuy: {
    provider: string;
    providerName: string;
    sellRate: number;
    differenceFromAverage: number;
  } | null;
  bestForCustomerSell: {
    provider: string;
    providerName: string;
    buyRate: number;
    differenceFromAverage: number;
  } | null;
  averageMidRate: number;
}

export interface ProviderConversion {
  provider: string;
  providerName: string;
  providerType: ProviderType;
  rate: number;
  rateType: 'buy' | 'sell' | 'mid';
  convertedAmount: number;
  spread: number;
}

export interface ConversionResult {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  timestamp: string;
  comparisons: ProviderConversion[];
  bestOption: {
    provider: string;
    providerName: string;
    convertedAmount: number;
    rate: number;
  } | null;
}

export type TimeframeRange = '1D' | '5D' | '1M' | '6M' | '1Y' | '5Y' | 'MAX';

export interface CurrencyComparisonItem {
  currencyCode: string;
  currencyName: string;
  flagEmoji: string;
  countryName: string;
  rateToIdr: number;
  change24h: number;
  change1w: number;
  change1m: number;
  change1y: number;
  high52w: number;
  low52w: number;
  sparkline: number[];
}

export interface HistoricalPoint {
  timestamp: string; // ISO 8601
  date: string; // Formatted date string
  timeLabel: string; // Dynamic label e.g. "09:00", "02 Sep", "2024"
  rate: number;
  open: number;
  high: number;
  low: number;
  close: number;
  // Backward compatibility fields
  buyRate?: number;
  sellRate?: number;
  midRate?: number;
  provider?: string;
}

export type HistoricalRatePoint = HistoricalPoint;

export interface HistoricalSeriesResult {
  currency: string;
  baseCurrency: string;
  timeframe: TimeframeRange;
  periodDays?: number;
  points: HistoricalPoint[];
  changePercentage: number;
  changeAmount: number;
  highestRate: number;
  lowestRate: number;
  startRate: number;
  currentRate: number;
  // Backward compatibility fields
  quoteCurrency?: CurrencyCode;
  provider?: string;
  highestMidRate?: number;
  lowestMidRate?: number;
}

export interface QuarantineRateRecord {
  id?: string;
  provider: string;
  baseCurrency: string;
  quoteCurrency: string;
  buyRate: number;
  sellRate: number;
  reason: string;
  rawPayload?: string;
  createdAt: string;
}

/**
 * Helper to resolve currency pair from either "pair" string (e.g. USD/IDR) or explicit base/quote arguments.
 */
export function parseCurrencyPair(
  pair?: string,
  base?: string,
  quote = 'IDR'
): { base?: string; quote: string } {
  let resolvedBase = base;
  let resolvedQuote = quote;

  if (pair && pair.includes('/')) {
    const [pBase, pQuote] = pair.split('/');
    if (pBase) resolvedBase = pBase;
    if (pQuote) resolvedQuote = pQuote;
  }

  return { base: resolvedBase, quote: resolvedQuote };
}

/**
 * Interface that all Rate Providers must implement.
 */
export interface IRateProvider {
  info: RateProviderInfo;
  fetchLatestRates(baseCurrency?: CurrencyCode): Promise<Rate[]>;
}

