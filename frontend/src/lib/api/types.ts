export type ProviderType = 'central_bank' | 'commercial_bank' | 'money_changer';

export interface ProviderInfo {
  id: string;
  name: string;
  shortName: string;
  type: ProviderType;
  badgeText: string;
  website: string;
  lastUpdated: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
}

export interface RateItem {
  id: string;
  providerId: string;
  providerName: string;
  baseCurrency: string;
  targetCurrency: string;
  buyRate: number;
  sellRate: number;
  middleRate: number;
  spread: number;
  spreadPercent: number;
  change24h?: number;
  updatedAt: string;
  rateType?: 'TT_COUNTER' | 'SPECIAL_RATE' | 'BANK_NOTES' | 'JISDOR';
}

export interface RateMatrixRow {
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  rateType: string;
  buyRate: number;
  sellRate: number;
  middleRate: number;
  spread: number;
  spreadPercent: number;
  updatedAt: string;
  isBestBuy: boolean;
  isBestSell: boolean;
  isLowestSpread: boolean;
}

export interface RateMatrixResponse {
  currency: string;
  baseCurrency: string;
  timestamp: string;
  totalProviders: number;
  bestBuyProvider: string;
  bestSellProvider: string;
  lowestSpreadProvider: string;
  rows: RateMatrixRow[];
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  resultAmount: number;
  rateUsed: number;
  rateType: 'buy' | 'sell' | 'middle';
  provider: {
    id: string;
    name: string;
  };
  updatedAt: string;
  comparisons: Array<{
    providerId: string;
    providerName: string;
    resultAmount: number;
    diffWithBest: number;
    diffPercent: number;
  }>;
}

export interface HistoricalPoint {
  timestamp: string;
  date: string;
  buyRate: number;
  sellRate: number;
  middleRate: number;
}

export interface HistoricalTrendResponse {
  currency: string;
  baseCurrency: string;
  range: '7d' | '30d' | '90d' | '365d';
  provider: string;
  points: HistoricalPoint[];
  summary: {
    min: number;
    max: number;
    avg: number;
    current: number;
    changePeriod: number;
    changePeriodPercent: number;
  };
}

export interface RateAlertRequest {
  email: string;
  baseCurrency: string;
  targetCurrency: string;
  condition: 'above' | 'below';
  targetRate: number;
  providerId?: string;
}
