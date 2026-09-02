import type { IRateProvider, Rate, RateProviderInfo } from '../domain/rate.ts';
import { OpenERApiProvider } from './open-er-api.ts';

export const MANDIRI_INFO: RateProviderInfo = {
  id: 'mandiri',
  name: 'Bank Mandiri (Special Rate)',
  type: 'commercial_bank',
  website: 'https://www.bankmandiri.co.id',
  description: 'Special Rate exchange rates from Bank Mandiri for transactions via Livin by Mandiri.',
};

export class MandiriProvider implements IRateProvider {
  public readonly info: RateProviderInfo = MANDIRI_INFO;
  private readonly baselineProvider: OpenERApiProvider;

  constructor(options?: { baselineProvider?: OpenERApiProvider }) {
    this.baselineProvider = options?.baselineProvider ?? new OpenERApiProvider();
  }

  async fetchLatestRates(): Promise<Rate[]> {
    const baselineRates = await this.baselineProvider.fetchLatestRates();
    const retrievedAt = new Date().toISOString();

    return baselineRates.map((base) => {
      const midRate = base.midRate;
      // Mandiri Special Rate spread: Buy is ~0.65% below mid, Sell is ~0.55% above mid
      const buyRate = Math.round((midRate * 0.9935) * 100) / 100;
      const sellRate = Math.round((midRate * 1.0055) * 100) / 100;
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
        sourceUrl: 'https://www.bankmandiri.co.id/kurs',
      };
    });
  }
}
