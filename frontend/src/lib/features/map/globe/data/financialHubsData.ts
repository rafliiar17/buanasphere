/**
 * Global Financial FX Hubs Dataset
 *
 * Sourced from Bank for International Settlements (BIS) Triennial Central Bank Survey
 * of Foreign Exchange and Over-the-Counter (OTC) Derivatives Markets.
 * Decoupled from hardcoded TypeScript to JSON dataset (ADR 0071).
 */

import financialHubsRaw from './financial_hubs_dataset.json';

export interface FinancialHubData {
  city: string;
  country: string;
  iso3: string;
  currencyCode: string;
  currencyName: string;
  lat: number;
  lng: number;
  dailyTurnoverBillionUsd: number;
  marketSharePercent: number;
  rank: number;
  tier: 'tier1_megahub' | 'tier2_major' | 'tier3_regional';
  flagEmoji: string;
}

export const GLOBAL_FINANCIAL_HUBS: readonly FinancialHubData[] = financialHubsRaw as unknown as readonly FinancialHubData[];

export function getFinancialHubByIso3(iso3: string): FinancialHubData | undefined {
  const target = iso3.toUpperCase();
  return GLOBAL_FINANCIAL_HUBS.find((h) => h.iso3 === target);
}
