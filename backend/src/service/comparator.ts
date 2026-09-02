import type { ComparisonResult, ProviderComparisonRate } from '../domain/rate.ts';
import { PROVIDER_REGISTRY } from '../provider/index.ts';
import { AggregatorService } from './aggregator.ts';
import { logger } from '../logger/index.ts';

export class ComparatorService {
  private readonly aggregator: AggregatorService;
  private readonly log = logger.child({ module: 'comparator_service' });

  constructor(options?: { aggregator?: AggregatorService }) {
    this.aggregator = options?.aggregator ?? new AggregatorService();
  }

  async compareRates(base: string, quote = 'IDR'): Promise<ComparisonResult> {
    const startTime = performance.now();
    const baseUpper = base.toUpperCase();
    const quoteUpper = quote.toUpperCase();
    const currency_pair = `${baseUpper}/${quoteUpper}`;

    this.log.debug({ currency_pair }, `Comparing rates across providers for ${currency_pair}`);

    const rates = await this.aggregator.getLatestRates({
      base: baseUpper,
      quote: quoteUpper,
    });

    const timestamp = new Date().toISOString();

    if (rates.length === 0) {
      this.log.warn({ currency_pair }, `No provider rates found for pair ${currency_pair}`);
      return {
        baseCurrency: baseUpper,
        quoteCurrency: quoteUpper,
        timestamp,
        rates: [],
        bestForCustomerBuy: null,
        bestForCustomerSell: null,
        averageMidRate: 0,
      };
    }

    const providerRates: ProviderComparisonRate[] = rates.map((r) => {
      const info = PROVIDER_REGISTRY[r.provider] ?? {
        name: r.provider.toUpperCase(),
        type: 'commercial_bank',
      };

      return {
        provider: r.provider,
        providerName: info.name,
        providerType: info.type,
        buyRate: r.buyRate,
        sellRate: r.sellRate,
        midRate: r.midRate,
        spread: r.spread,
        updatedAt: r.retrievedAt,
      };
    });

    const totalMid = providerRates.reduce((acc, curr) => acc + curr.midRate, 0);
    const averageMidRate = Math.round((totalMid / providerRates.length) * 100) / 100;

    // Customer buying foreign currency wants lowest Sell Rate
    let bestBuyProvider: ProviderComparisonRate = providerRates[0]!;
    for (const p of providerRates) {
      if (p.sellRate < bestBuyProvider.sellRate) {
        bestBuyProvider = p;
      }
    }

    // Customer selling foreign currency wants highest Buy Rate
    let bestSellProvider: ProviderComparisonRate = providerRates[0]!;
    for (const p of providerRates) {
      if (p.buyRate > bestSellProvider.buyRate) {
        bestSellProvider = p;
      }
    }

    const duration_ms = Math.round((performance.now() - startTime) * 100) / 100;
    this.log.info(
      {
        currency_pair,
        duration_ms,
        providerCount: providerRates.length,
        bestBuyProvider: bestBuyProvider.provider,
        bestBuyRate: bestBuyProvider.sellRate,
        bestSellProvider: bestSellProvider.provider,
        bestSellRate: bestSellProvider.buyRate,
        averageMidRate,
      },
      `Compared rates for ${currency_pair} across ${providerRates.length} providers (${duration_ms}ms)`
    );

    return {
      baseCurrency: baseUpper,
      quoteCurrency: quoteUpper,
      timestamp,
      rates: providerRates,
      bestForCustomerBuy: {
        provider: bestBuyProvider.provider,
        providerName: bestBuyProvider.providerName,
        sellRate: bestBuyProvider.sellRate,
        differenceFromAverage: Math.round((bestBuyProvider.sellRate - averageMidRate) * 100) / 100,
      },
      bestForCustomerSell: {
        provider: bestSellProvider.provider,
        providerName: bestSellProvider.providerName,
        buyRate: bestSellProvider.buyRate,
        differenceFromAverage: Math.round((bestSellProvider.buyRate - averageMidRate) * 100) / 100,
      },
      averageMidRate,
    };
  }
}
