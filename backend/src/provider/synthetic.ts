import type { IRateProvider, Rate, RateProviderInfo } from '../domain/rate.ts';
import { OpenERApiProvider } from './open-er-api.ts';
import { logger } from '../logger/index.ts';

export interface SyntheticBankConfig {
  buyMultiplier: number;
  sellMultiplier: number;
  sourceUrl: string;
}

export class SyntheticBankProvider implements IRateProvider {
  public readonly info: RateProviderInfo;
  private readonly baselineProvider: OpenERApiProvider;
  private readonly config: SyntheticBankConfig;
  private readonly log;

  constructor(
    info: RateProviderInfo,
    config: SyntheticBankConfig,
    options?: { baselineProvider?: OpenERApiProvider }
  ) {
    this.info = info;
    this.config = config;
    this.baselineProvider = options?.baselineProvider ?? new OpenERApiProvider();
    this.log = logger.child({ provider: this.info.id });
  }

  async fetchLatestRates(): Promise<Rate[]> {
    const startTime = performance.now();
    this.log.debug(`Fetching rates for ${this.info.name} adapter`);

    try {
      const baselineRates = await this.baselineProvider.fetchLatestRates();
      const retrievedAt = new Date().toISOString();

      const rates = baselineRates.map((base) => {
        const midRate = base.midRate;
        const buyRate = Math.round(midRate * this.config.buyMultiplier * 100) / 100;
        const sellRate = Math.round(midRate * this.config.sellMultiplier * 100) / 100;
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
          sourceUrl: this.config.sourceUrl,
        };
      });

      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.info(
        { duration_ms, parsedRatesCount: rates.length },
        `Successfully generated ${rates.length} rates for ${this.info.name} (${duration_ms}ms)`
      );

      return rates;
    } catch (error) {
      const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
      this.log.error(
        { duration_ms, error: error instanceof Error ? error.message : String(error) },
        `Failed to fetch rates for ${this.info.name}: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
