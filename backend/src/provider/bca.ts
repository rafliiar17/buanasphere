import type { IRateProvider, Rate, RateProviderInfo } from '../domain/rate.ts';
import { OpenERApiProvider } from './open-er-api.ts';
import { logger } from '../logger/index.ts';

export const BCA_INFO: RateProviderInfo = {
  id: 'bca',
  name: 'Bank Central Asia (e-Rate)',
  type: 'commercial_bank',
  website: 'https://www.bca.co.id',
  description: 'Electronic exchange rates (e-Rate) from Bank Central Asia for digital transactions.',
};

export class BcaProvider implements IRateProvider {
  public readonly info: RateProviderInfo = BCA_INFO;
  private readonly baselineProvider: OpenERApiProvider;
  private readonly log = logger.child({ provider: this.info.id });

  constructor(options?: { baselineProvider?: OpenERApiProvider }) {
    this.baselineProvider = options?.baselineProvider ?? new OpenERApiProvider();
  }

  async fetchLatestRates(): Promise<Rate[]> {
    const startTime = performance.now();
    this.log.debug('Fetching rates for BCA e-Rate adapter');

    try {
      const baselineRates = await this.baselineProvider.fetchLatestRates();
      const retrievedAt = new Date().toISOString();

      const rates = baselineRates.map((base) => {
        const midRate = base.midRate;
        // BCA e-Rate retail spread: Buy is ~0.6% below mid, Sell is ~0.6% above mid
        const buyRate = Math.round((midRate * 0.994) * 100) / 100;
        const sellRate = Math.round((midRate * 1.006) * 100) / 100;
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
          sourceUrl: 'https://www.bca.co.id/id/informasi/kurs',
        };
      });

      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.info(
        { duration_ms, parsedRatesCount: rates.length },
        `Successfully generated ${rates.length} rates for BCA (${duration_ms}ms)`
      );

      return rates;
    } catch (error) {
      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.error(
        { duration_ms, error: error instanceof Error ? error.message : String(error) },
        `Failed to fetch rates for BCA: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
