import type { ConversionResult, ProviderConversion } from '../domain/rate.ts';
import { PROVIDER_REGISTRY } from '../provider/index.ts';
import { AggregatorService } from './aggregator.ts';

export class ConverterService {
  private readonly aggregator: AggregatorService;

  constructor(options?: { aggregator?: AggregatorService }) {
    this.aggregator = options?.aggregator ?? new AggregatorService();
  }

  async convert(
    amount: number,
    from: string,
    to = 'IDR',
    rateType: 'buy' | 'sell' | 'mid' = 'buy'
  ): Promise<ConversionResult> {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be a strictly positive number');
    }

    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    const timestamp = new Date().toISOString();

    // Identity conversion
    if (fromUpper === toUpper) {
      return {
        amount,
        fromCurrency: fromUpper,
        toCurrency: toUpper,
        timestamp,
        comparisons: [
          {
            provider: 'identity',
            providerName: 'Same Currency',
            providerType: 'market_reference',
            rate: 1,
            rateType: 'mid',
            convertedAmount: amount,
            spread: 0,
          },
        ],
        bestOption: {
          provider: 'identity',
          providerName: 'Same Currency',
          convertedAmount: amount,
          rate: 1,
        },
      };
    }

    const comparisons: ProviderConversion[] = [];

    // Case 1: Foreign Currency -> IDR (Customer selling foreign currency to get IDR)
    if (toUpper === 'IDR') {
      const rates = await this.aggregator.getLatestRates({ base: fromUpper, quote: 'IDR' });

      for (const r of rates) {
        const info = PROVIDER_REGISTRY[r.provider] ?? {
          name: r.provider.toUpperCase(),
          type: 'commercial_bank',
        };

        const chosenRate =
          rateType === 'mid' ? r.midRate : rateType === 'sell' ? r.sellRate : r.buyRate;
        const converted = Math.round(amount * chosenRate * 100) / 100;

        comparisons.push({
          provider: r.provider,
          providerName: info.name,
          providerType: info.type,
          rate: chosenRate,
          rateType,
          convertedAmount: converted,
          spread: r.spread,
        });
      }
    }
    // Case 2: IDR -> Foreign Currency (Customer buying foreign currency using IDR)
    else if (fromUpper === 'IDR') {
      const rates = await this.aggregator.getLatestRates({ base: toUpper, quote: 'IDR' });

      for (const r of rates) {
        const info = PROVIDER_REGISTRY[r.provider] ?? {
          name: r.provider.toUpperCase(),
          type: 'commercial_bank',
        };

        // When buying foreign currency with IDR, the cost is the bank's sellRate
        const chosenRate =
          rateType === 'mid' ? r.midRate : rateType === 'buy' ? r.buyRate : r.sellRate;
        const converted = Math.round((amount / chosenRate) * 10000) / 10000;

        comparisons.push({
          provider: r.provider,
          providerName: info.name,
          providerType: info.type,
          rate: chosenRate,
          rateType,
          convertedAmount: converted,
          spread: r.spread,
        });
      }
    }
    // Case 3: Cross-Currency (e.g. USD -> EUR via IDR)
    else {
      const fromRates = await this.aggregator.getLatestRates({ base: fromUpper, quote: 'IDR' });
      const toRates = await this.aggregator.getLatestRates({ base: toUpper, quote: 'IDR' });

      for (const fr of fromRates) {
        const tr = toRates.find((t) => t.provider === fr.provider);
        if (!tr) continue;

        const info = PROVIDER_REGISTRY[fr.provider] ?? {
          name: fr.provider.toUpperCase(),
          type: 'commercial_bank',
        };

        const fromIdrRate = rateType === 'mid' ? fr.midRate : fr.buyRate;
        const toIdrRate = rateType === 'mid' ? tr.midRate : tr.sellRate;
        const crossRate = Math.round((fromIdrRate / toIdrRate) * 1000000) / 1000000;
        const converted = Math.round(amount * crossRate * 10000) / 10000;

        comparisons.push({
          provider: fr.provider,
          providerName: info.name,
          providerType: info.type,
          rate: crossRate,
          rateType,
          convertedAmount: converted,
          spread: Math.round((fr.spread + tr.spread) * 100) / 100,
        });
      }
    }

    // Determine the best option: customer wants maximum converted amount!
    let bestOption: ProviderConversion | null = null;
    if (comparisons.length > 0) {
      bestOption = comparisons.reduce((best, curr) =>
        curr.convertedAmount > best.convertedAmount ? curr : best
      );
    }

    return {
      amount,
      fromCurrency: fromUpper,
      toCurrency: toUpper,
      timestamp,
      comparisons,
      bestOption: bestOption
        ? {
            provider: bestOption.provider,
            providerName: bestOption.providerName,
            convertedAmount: bestOption.convertedAmount,
            rate: bestOption.rate,
          }
        : null,
    };
  }
}
