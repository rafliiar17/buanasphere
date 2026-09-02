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

export interface HistoricalRatePoint {
  date: string; // YYYY-MM-DD or ISO 8601
  buyRate: number;
  sellRate: number;
  midRate: number;
  provider: string;
}

export interface HistoricalSeriesResult {
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  provider?: string;
  periodDays: number;
  points: HistoricalRatePoint[];
  changePercentage: number;
  highestMidRate: number;
  lowestMidRate: number;
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
 * Interface that all Rate Providers must implement.
 */
export interface IRateProvider {
  info: RateProviderInfo;
  fetchLatestRates(baseCurrency?: CurrencyCode): Promise<Rate[]>;
}
