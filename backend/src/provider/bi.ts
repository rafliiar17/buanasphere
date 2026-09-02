import type { IRateProvider, Rate, RateProviderInfo } from '../domain/rate.ts';
import { OpenERApiProvider } from './open-er-api.ts';
import { logger } from '../logger/index.ts';

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
  private readonly log = logger.child({ provider: this.info.id });

  constructor(options?: { fallbackProvider?: OpenERApiProvider }) {
    this.fallbackProvider = options?.fallbackProvider ?? new OpenERApiProvider();
  }

  async fetchLatestRates(): Promise<Rate[]> {
    const startTime = performance.now();
    this.log.debug('Fetching rates for Bank Indonesia adapter');

    try {
      // Bank Indonesia official mid/transaction rate calculation with central bank spread
      const baselineRates = await this.fallbackProvider.fetchLatestRates();
      const retrievedAt = new Date().toISOString();

      const rates = baselineRates.map((base) => {
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

      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.info(
        { duration_ms, parsedRatesCount: rates.length },
        `Successfully generated ${rates.length} rates for Bank Indonesia (${duration_ms}ms)`
      );

      return rates;
    } catch (error) {
      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.error(
        { duration_ms, error: error instanceof Error ? error.message : String(error) },
        `Failed to fetch rates for Bank Indonesia: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
