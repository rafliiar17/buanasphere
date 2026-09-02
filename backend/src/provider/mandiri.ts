import type { IRateProvider, Rate, RateProviderInfo } from '../domain/rate.ts';
import { OpenERApiProvider } from './open-er-api.ts';
import { logger } from '../logger/index.ts';

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
  private readonly log = logger.child({ provider: this.info.id });

  constructor(options?: { baselineProvider?: OpenERApiProvider }) {
    this.baselineProvider = options?.baselineProvider ?? new OpenERApiProvider();
  }

  async fetchLatestRates(): Promise<Rate[]> {
    const startTime = performance.now();
    this.log.debug('Fetching rates for Bank Mandiri Special Rate adapter');

    try {
      const baselineRates = await this.baselineProvider.fetchLatestRates();
      const retrievedAt = new Date().toISOString();

      const rates = baselineRates.map((base) => {
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

      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.info(
        { duration_ms, parsedRatesCount: rates.length },
        `Successfully generated ${rates.length} rates for Bank Mandiri (${duration_ms}ms)`
      );

      return rates;
    } catch (error) {
      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.error(
        { duration_ms, error: error instanceof Error ? error.message : String(error) },
        `Failed to fetch rates for Bank Mandiri: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
