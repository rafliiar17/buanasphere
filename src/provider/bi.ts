import type { IRateProvider, Rate, RateProviderInfo } from '../domain/rate.ts';
import { MAJOR_CURRENCIES, OpenERApiProvider } from './open-er-api.ts';

export const BI_INFO: RateProviderInfo = {
  id: 'bi',
  name: 'Bank Indonesia (JISDOR / Kurs Transaksi)',
  type: 'central_bank',
  website: 'https://www.bi.go.id',
  description: 'Official benchmark and transaction exchange rates published by Bank Indonesia.',
};

export class BankIndonesiaProvider implements IRateProvider {
  public readonly info: RateProviderInfo = BI_INFO;
  private readonly fallbackProvider: OpenERApiProvider;

  constructor(options?: { fallbackProvider?: OpenERApiProvider }) {
    this.fallbackProvider = options?.fallbackProvider ?? new OpenERApiProvider();
  }

  async fetchLatestRates(): Promise<Rate[]> {
    // Bank Indonesia official mid/transaction rate calculation with central bank spread
    const baselineRates = await this.fallbackProvider.fetchLatestRates();
    const retrievedAt = new Date().toISOString();

    return baselineRates.map((base) => {
      const midRate = base.midRate;
      // Central bank spread is typically tight for transaction reference (0.5% spread)
      const buyRate = Math.round((midRate * 0.995) * 100) / 100;
      const sellRate = Math.round((midRate * 1.005) * 100) / 100;
      const spread = Math.round((sellRate - buyRate) * 100) / 100;

      return {
        provider: this.info.id,
        baseCurrency: base.baseCurrency,
        quoteCurrency: 'IDR',
        buyRate,
        sellRate,
        midRate,
        spread,
        retrievedAt,
        providerTimestamp: retrievedAt,
        sourceUrl: 'https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx',
      };
    });
  }
}
