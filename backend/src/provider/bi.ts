import type { RateProviderInfo } from '../domain/rate.ts';
import { OpenERApiProvider } from './open-er-api.ts';
import { SyntheticBankProvider } from './synthetic.ts';

export const BI_INFO: RateProviderInfo = {
  id: 'bi',
  name: 'Bank Indonesia (JISDOR / Kurs Transaksi)',
  type: 'central_bank',
  website: 'https://www.bi.go.id',
  description: 'Official benchmark and transaction exchange rates published by Bank Indonesia.',
};

export class BankIndonesiaProvider extends SyntheticBankProvider {
  constructor(options?: { fallbackProvider?: OpenERApiProvider }) {
    super(
      BI_INFO,
      {
        buyMultiplier: 0.995,
        sellMultiplier: 1.005,
        sourceUrl: 'https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx',
      },
      { baselineProvider: options?.fallbackProvider }
    );
  }
}
