import type { RateProviderInfo } from '../domain/rate.ts';
import { OpenERApiProvider } from './open-er-api.ts';
import { SyntheticBankProvider } from './synthetic.ts';

export const BCA_INFO: RateProviderInfo = {
  id: 'bca',
  name: 'Bank Central Asia (e-Rate)',
  type: 'commercial_bank',
  website: 'https://www.bca.co.id',
  description: 'Electronic exchange rates (e-Rate) from Bank Central Asia for digital transactions.',
};

export class BcaProvider extends SyntheticBankProvider {
  constructor(options?: { baselineProvider?: OpenERApiProvider }) {
    super(
      BCA_INFO,
      {
        buyMultiplier: 0.994,
        sellMultiplier: 1.006,
        sourceUrl: 'https://www.bca.co.id/id/informasi/kurs',
      },
      options
    );
  }
}
