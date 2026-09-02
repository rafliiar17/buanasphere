import type { RateProviderInfo } from '../domain/rate.ts';
import { OpenERApiProvider } from './open-er-api.ts';
import { SyntheticBankProvider } from './synthetic.ts';

export const MANDIRI_INFO: RateProviderInfo = {
  id: 'mandiri',
  name: 'Bank Mandiri (Special Rate)',
  type: 'commercial_bank',
  website: 'https://www.bankmandiri.co.id',
  description: 'Special Rate exchange rates from Bank Mandiri for transactions via Livin by Mandiri.',
};

export class MandiriProvider extends SyntheticBankProvider {
  constructor(options?: { baselineProvider?: OpenERApiProvider }) {
    super(
      MANDIRI_INFO,
      {
        buyMultiplier: 0.9935,
        sellMultiplier: 1.0055,
        sourceUrl: 'https://www.bankmandiri.co.id/kurs',
      },
      options
    );
  }
}
