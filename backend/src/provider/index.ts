import type { IRateProvider, RateProviderInfo } from '../domain/rate.ts';
import { BankIndonesiaProvider, BI_INFO } from './bi.ts';
import { BcaProvider, BCA_INFO } from './bca.ts';
import { MandiriProvider, MANDIRI_INFO } from './mandiri.ts';
import { OpenERApiProvider, OPEN_ER_API_INFO } from './open-er-api.ts';

export * from './open-er-api.ts';
export * from './synthetic.ts';
export * from './bi.ts';
export * from './bca.ts';
export * from './mandiri.ts';

export const PROVIDER_REGISTRY: Record<string, RateProviderInfo> = {
  [OPEN_ER_API_INFO.id]: OPEN_ER_API_INFO,
  [BI_INFO.id]: BI_INFO,
  [BCA_INFO.id]: BCA_INFO,
  [MANDIRI_INFO.id]: MANDIRI_INFO,
};

export function createAllProviders(options?: {
  customFetch?: typeof fetch;
  openErApiUrl?: string;
}): IRateProvider[] {
  const openErApi = new OpenERApiProvider({
    baseUrl: options?.openErApiUrl,
    customFetch: options?.customFetch,
  });

  return [
    openErApi,
    new BankIndonesiaProvider({ fallbackProvider: openErApi }),
    new BcaProvider({ baselineProvider: openErApi }),
    new MandiriProvider({ baselineProvider: openErApi }),
  ];
}
