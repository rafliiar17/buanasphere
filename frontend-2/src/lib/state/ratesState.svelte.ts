/**
 * Kurs World — Rates State Store (Svelte 5 Runes)
 * Manages live aggregated exchange rates, API fetching, fallback rates, and conversion logic.
 */

import {
  EXTENDED_COUNTRIES_DATA,
  getDefaultRate,
  getCountryByCurrency,
} from '../data/countrySpatialData';

export interface LiveRateItem {
  currencyCode: string;
  currencyName: string;
  countryName: string;
  flagEmoji: string;
  buyRate: number;
  sellRate: number;
  middleRate: number;
  spread: number;
  spreadPercent: number;
  change24h: number;
  updatedAt: string;
  provider?: string;
}

export class RatesState {
  liveRates = $state<Record<string, LiveRateItem>>({});
  isLoading = $state<boolean>(false);
  error = $state<string | null>(null);
  lastUpdated = $state<string | null>(null);

  constructor() {
    this.initializeDefaultRates();
  }

  /**
   * Populate initial state with offline/fallback rates from country dataset.
   */
  private initializeDefaultRates() {
    const initialRates: Record<string, LiveRateItem> = {};
    const now = new Date().toISOString();

    for (const country of EXTENDED_COUNTRIES_DATA) {
      const code = country.currencyCode.toUpperCase();
      if (!initialRates[code]) {
        const spread = Number((country.defaultSellRate - country.defaultBuyRate).toFixed(2));
        const spreadPercent =
          country.defaultRate > 0
            ? Number(((spread / country.defaultRate) * 100).toFixed(2))
            : 0;

        initialRates[code] = {
          currencyCode: code,
          currencyName: country.currencyName,
          countryName: country.countryName,
          flagEmoji: country.flagEmoji,
          buyRate: country.defaultBuyRate,
          sellRate: country.defaultSellRate,
          middleRate: country.defaultRate,
          spread,
          spreadPercent,
          change24h: country.defaultChange24h,
          updatedAt: now,
          provider: 'Kurs World Market Reference',
        };
      }
    }

    this.liveRates = initialRates;
    this.lastUpdated = now;
  }

  /**
   * Derived array of all unique rates sorted by code.
   */
  get ratesList(): LiveRateItem[] {
    return Object.values(this.liveRates).sort((a, b) =>
      a.currencyCode.localeCompare(b.currencyCode)
    );
  }

  /**
   * Retrieve rate details for a specific currency code.
   */
  getRate(currencyCode: string): LiveRateItem | undefined {
    if (!currencyCode) return undefined;
    const code = currencyCode.toUpperCase();
    if (this.liveRates[code]) {
      return this.liveRates[code];
    }

    // Fallback if not yet present
    const country = getCountryByCurrency(code);
    const def = getDefaultRate(code);
    const spread = Number((def.sellRate - def.buyRate).toFixed(2));
    return {
      currencyCode: code,
      currencyName: country?.currencyName ?? code,
      countryName: country?.countryName ?? 'Global',
      flagEmoji: country?.flagEmoji ?? '🌐',
      buyRate: def.buyRate,
      sellRate: def.sellRate,
      middleRate: def.rate,
      spread,
      spreadPercent: def.rate > 0 ? Number(((spread / def.rate) * 100).toFixed(2)) : 0,
      change24h: def.change24h,
      updatedAt: this.lastUpdated ?? new Date().toISOString(),
      provider: 'Fallback Reference',
    };
  }

  /**
   * Fetches latest exchange rates from backend API (/api/v1/rates/latest or /api/v1/rates).
   * Gracefully falls back to bundled default rates upon failure.
   */
  async fetchRates(base = 'IDR'): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      // Try /api/v1/rates/latest first, then /api/v1/rates
      let res = await fetch(`/api/v1/rates/latest?base=${encodeURIComponent(base)}`);
      if (!res.ok) {
        res = await fetch(`/api/v1/rates?base=${encodeURIComponent(base)}`);
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json || (!json.success && !Array.isArray(json.data) && !Array.isArray(json))) {
        throw new Error(json?.error ?? 'Invalid API response format');
      }

      const items: any[] = Array.isArray(json) ? json : (json.data ?? []);
      const updatedRates: Record<string, LiveRateItem> = { ...this.liveRates };
      const timestamp = json.timestamp ?? new Date().toISOString();

      for (const item of items) {
        // Backend RateItem structure
        const code = (item.baseCurrency || item.currencyCode || item.pair?.split('/')[0] || '').toUpperCase();
        if (!code) continue;

        const country = getCountryByCurrency(code);
        const buyRate = Number(item.buyRate ?? item.buy ?? item.middleRate ?? 0);
        const sellRate = Number(item.sellRate ?? item.sell ?? item.middleRate ?? 0);
        const middleRate = Number(item.middleRate ?? item.midRate ?? item.rate ?? (buyRate + sellRate) / 2);
        const spread = Number(item.spread ?? (sellRate - buyRate).toFixed(2));
        const spreadPercent = Number(item.spreadPercent ?? (middleRate > 0 ? ((spread / middleRate) * 100).toFixed(2) : 0));
        const change24h = Number(item.change24h ?? item.change ?? 0);

        updatedRates[code] = {
          currencyCode: code,
          currencyName: country?.currencyName ?? item.currencyName ?? code,
          countryName: country?.countryName ?? item.countryName ?? 'Global',
          flagEmoji: country?.flagEmoji ?? item.flagEmoji ?? '🌐',
          buyRate,
          sellRate,
          middleRate,
          spread,
          spreadPercent,
          change24h,
          updatedAt: item.updatedAt ?? timestamp,
          provider: item.providerName ?? item.provider ?? 'Kurs World Live',
        };
      }

      this.liveRates = updatedRates;
      this.lastUpdated = timestamp;
    } catch (err: any) {
      this.error = err instanceof Error ? err.message : 'Gagal memuat kurs live, menggunakan data referensi';
      // Ensure we still have full fallback rates available
      if (Object.keys(this.liveRates).length === 0) {
        this.initializeDefaultRates();
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Currency conversion helper.
   * Converts `amount` from `fromCurrency` to `toCurrency` using middle rates vs IDR.
   */
  convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): { result: number; rate: number; inverseRate: number } {
    if (isNaN(amount) || amount <= 0) {
      return { result: 0, rate: 0, inverseRate: 0 };
    }

    const fromCode = fromCurrency.toUpperCase();
    const toCode = toCurrency.toUpperCase();

    if (fromCode === toCode) {
      return { result: amount, rate: 1, inverseRate: 1 };
    }

    const fromRateObj = this.getRate(fromCode);
    const toRateObj = this.getRate(toCode);

    const fromRateInIdr = fromCode === 'IDR' ? 1 : (fromRateObj?.middleRate ?? 1);
    const toRateInIdr = toCode === 'IDR' ? 1 : (toRateObj?.middleRate ?? 1);

    // Cross-rate: (Amount in IDR) / toRateInIdr
    const amountInIdr = amount * fromRateInIdr;
    const result = amountInIdr / toRateInIdr;
    const rate = fromRateInIdr / toRateInIdr;
    const inverseRate = toRateInIdr / fromRateInIdr;

    return {
      result,
      rate,
      inverseRate,
    };
  }
}

export const ratesState = new RatesState();
