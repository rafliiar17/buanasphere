import { describe, expect, it } from 'bun:test';
import { AggregatorService } from '../src/service/aggregator.ts';
import { ConverterService } from '../src/service/converter.ts';
import { ComparatorService } from '../src/service/comparator.ts';
import type { IRateProvider, Rate } from '../src/domain/rate.ts';

class MockProvider implements IRateProvider {
  constructor(
    public info: { id: string; name: string; type: 'commercial_bank'; website: string },
    private rates: Rate[]
  ) {}

  async fetchLatestRates(): Promise<Rate[]> {
    return this.rates;
  }
}

describe('ConverterService & ComparatorService', () => {
  const mockBcaRates: Rate[] = [
    {
      provider: 'bca',
      baseCurrency: 'USD',
      quoteCurrency: 'IDR',
      buyRate: 15400,
      sellRate: 15600,
      midRate: 15500,
      spread: 200,
      retrievedAt: new Date().toISOString(),
    },
    {
      provider: 'bca',
      baseCurrency: 'EUR',
      quoteCurrency: 'IDR',
      buyRate: 16800,
      sellRate: 17100,
      midRate: 16950,
      spread: 300,
      retrievedAt: new Date().toISOString(),
    },
  ];

  const mockMandiriRates: Rate[] = [
    {
      provider: 'mandiri',
      baseCurrency: 'USD',
      quoteCurrency: 'IDR',
      buyRate: 15450, // Better for selling USD
      sellRate: 15580, // Better for buying USD
      midRate: 15515,
      spread: 130,
      retrievedAt: new Date().toISOString(),
    },
    {
      provider: 'mandiri',
      baseCurrency: 'EUR',
      quoteCurrency: 'IDR',
      buyRate: 16850,
      sellRate: 17050,
      midRate: 16950,
      spread: 200,
      retrievedAt: new Date().toISOString(),
    },
  ];

  const aggregator = new AggregatorService({
    providers: [
      new MockProvider(
        { id: 'bca', name: 'Bank BCA', type: 'commercial_bank', website: 'https://bca.co.id' },
        mockBcaRates
      ),
      new MockProvider(
        {
          id: 'mandiri',
          name: 'Bank Mandiri',
          type: 'commercial_bank',
          website: 'https://bankmandiri.co.id',
        },
        mockMandiriRates
      ),
    ],
  });

  const converter = new ConverterService({ aggregator });
  const comparator = new ComparatorService({ aggregator });

  describe('ConverterService', () => {
    it('should convert Foreign Currency (USD) to IDR correctly', async () => {
      const result = await converter.convert(100, 'USD', 'IDR', 'buy');

      expect(result.amount).toBe(100);
      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('IDR');
      expect(result.comparisons.length).toBe(2);

      // Mandiri buyRate is 15450 -> 100 * 15450 = 1545000
      const mandiriComp = result.comparisons.find((c) => c.provider === 'mandiri');
      expect(mandiriComp?.convertedAmount).toBe(1545000);

      // BCA buyRate is 15400 -> 100 * 15400 = 1540000
      const bcaComp = result.comparisons.find((c) => c.provider === 'bca');
      expect(bcaComp?.convertedAmount).toBe(1540000);

      // Best option for selling USD is Mandiri
      expect(result.bestOption?.provider).toBe('mandiri');
      expect(result.bestOption?.convertedAmount).toBe(1545000);
    });

    it('should convert IDR to Foreign Currency (USD) correctly', async () => {
      const result = await converter.convert(1558000, 'IDR', 'USD', 'sell');

      expect(result.fromCurrency).toBe('IDR');
      expect(result.toCurrency).toBe('USD');

      // Mandiri sellRate is 15580 -> 1558000 / 15580 = 100 USD
      const mandiriComp = result.comparisons.find((c) => c.provider === 'mandiri');
      expect(mandiriComp?.convertedAmount).toBe(100);

      // BCA sellRate is 15600 -> 1558000 / 15600 = ~99.8718 USD
      const bcaComp = result.comparisons.find((c) => c.provider === 'bca');
      expect(bcaComp?.convertedAmount).toBeCloseTo(99.8718, 2);

      // Best option when converting IDR to USD is Mandiri (lowest sell price gives more USD)
      expect(result.bestOption?.provider).toBe('mandiri');
    });

    it('should handle identity conversion when from and to currencies match', async () => {
      const result = await converter.convert(500, 'USD', 'USD');
      expect(result.amount).toBe(500);
      expect(result.bestOption?.convertedAmount).toBe(500);
    });

    it('should throw validation error on negative or zero amount', async () => {
      expect(converter.convert(0, 'USD', 'IDR')).rejects.toThrow(
        'Amount must be a strictly positive number'
      );
      expect(converter.convert(-50, 'USD', 'IDR')).rejects.toThrow(
        'Amount must be a strictly positive number'
      );
    });
  });

  describe('ComparatorService', () => {
    it('should evaluate side-by-side rates and determine best buy/sell providers', async () => {
      const result = await comparator.compareRates('USD', 'IDR');

      expect(result.baseCurrency).toBe('USD');
      expect(result.quoteCurrency).toBe('IDR');
      expect(result.rates.length).toBe(2);

      // Best for customer buying USD with IDR is lowest sell rate (Mandiri @ 15580 vs BCA @ 15600)
      expect(result.bestForCustomerBuy?.provider).toBe('mandiri');
      expect(result.bestForCustomerBuy?.sellRate).toBe(15580);

      // Best for customer selling USD for IDR is highest buy rate (Mandiri @ 15450 vs BCA @ 15400)
      expect(result.bestForCustomerSell?.provider).toBe('mandiri');
      expect(result.bestForCustomerSell?.buyRate).toBe(15450);

      // Average mid rate: (15500 + 15515) / 2 = 15507.5
      expect(result.averageMidRate).toBe(15507.5);
    });
  });
});
