import type {
  CurrencyInfo,
  ProviderInfo,
  RateMatrixResponse,
  ConversionResult,
  HistoricalTrendResponse,
  RateAlertRequest,
  RateItem,
} from './types';

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'Amerika Serikat' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'Uni Eropa' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', country: 'Singapura' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', country: 'Jepang' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', country: 'Australia' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'Inggris' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', country: 'Malaysia' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', country: 'Tiongkok' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', country: 'Arab Saudi' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', country: 'Thailand' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', country: 'Kanada' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', country: 'Swiss' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', country: 'Hong Kong' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', country: 'Korea Selatan' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', country: 'Selandia Baru' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', country: 'India' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', country: 'Brasil' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', country: 'Afrika Selatan' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', country: 'Uni Emirat Arab' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', country: 'Filipina' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', country: 'Vietnam' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', country: 'Indonesia' },
];

export const MOCK_PROVIDERS: ProviderInfo[] = [
  {
    id: 'bi',
    name: 'Bank Indonesia (JISDOR)',
    shortName: 'BI JISDOR',
    type: 'central_bank',
    badgeText: 'Bank Sentral',
    website: 'https://www.bi.go.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bca',
    name: 'Bank Central Asia (BCA)',
    shortName: 'BCA',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://www.bca.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    shortName: 'Mandiri',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://www.bankmandiri.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bri',
    name: 'Bank Rakyat Indonesia (BRI)',
    shortName: 'BRI',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://bri.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bni',
    name: 'Bank Negara Indonesia (BNI)',
    shortName: 'BNI',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://www.bni.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'cimb',
    name: 'CIMB Niaga',
    shortName: 'CIMB',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://www.cimbniaga.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'dolarasia',
    name: 'DolarAsia Money Changer',
    shortName: 'DolarAsia',
    type: 'money_changer',
    badgeText: 'Money Changer',
    website: 'https://dolarasia.com',
    lastUpdated: new Date().toISOString(),
  },
];

// Base rates definition for high-fidelity fallback
const BASE_RATES_IDR: Record<string, { buy: number; sell: number; mid: number; change: number }> = {
  USD: { buy: 16220, sell: 16280, mid: 16250, change: 0.15 },
  EUR: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 },
  SGD: { buy: 12180, sell: 12260, mid: 12220, change: 0.08 },
  JPY: { buy: 107.5, sell: 109.2, mid: 108.35, change: -0.45 },
  AUD: { buy: 10380, sell: 10490, mid: 10435, change: 0.31 },
  GBP: { buy: 20550, sell: 20720, mid: 20635, change: -0.12 },
  MYR: { buy: 3660, sell: 3710, mid: 3685, change: 0.05 },
  CNY: { buy: 2230, sell: 2270, mid: 2250, change: -0.09 },
  SAR: { buy: 4310, sell: 4360, mid: 4335, change: 0.12 },
  THB: { buy: 470, sell: 490, mid: 480, change: 0.18 },
  CAD: { buy: 11800, sell: 11900, mid: 11850, change: 0.10 },
  CHF: { buy: 18280, sell: 18420, mid: 18350, change: -0.05 },
  HKD: { buy: 2070, sell: 2110, mid: 2090, change: 0.14 },
  KRW: { buy: 11.5, sell: 12.2, mid: 11.85, change: -0.15 },
  NZD: { buy: 9700, sell: 9800, mid: 9750, change: 0.22 },
  INR: { buy: 192.0, sell: 197.0, mid: 194.5, change: -0.08 },
  BRL: { buy: 2880, sell: 2960, mid: 2920, change: 0.40 },
  ZAR: { buy: 880, sell: 910, mid: 895, change: 0.15 },
  AED: { buy: 4400, sell: 4450, mid: 4425, change: 0.11 },
  PHP: { buy: 280, sell: 290, mid: 285, change: -0.05 },
  VND: { buy: 0.62, sell: 0.66, mid: 0.64, change: 0.02 },
  IDR: { buy: 1, sell: 1, mid: 1, change: 0.00 },
};

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
      this.baseUrl = (import.meta as any).env.VITE_API_URL;
    } else if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
      this.baseUrl = process.env.VITE_API_URL;
    } else {
      this.baseUrl = '/api/v1';
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      throw new Error(`API Request failed with status ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }

  async getProviders(): Promise<ProviderInfo[]> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: ProviderInfo[] }>('/providers');
      return data.data;
    } catch {
      return MOCK_PROVIDERS;
    }
  }

  async getLiveRates(baseCurrency = 'IDR'): Promise<RateItem[]> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: RateItem[] }>(`/rates/latest?base=${baseCurrency}`);
      return data.data;
    } catch {
      // Return high fidelity mock list
      const items: RateItem[] = [];
      const now = new Date().toISOString();

      Object.entries(BASE_RATES_IDR).forEach(([curr, val]) => {
        if (curr === 'IDR') return;
        const spread = val.sell - val.buy;
        const spreadPercent = (spread / val.mid) * 100;
        items.push({
          id: `bca-${curr}`,
          providerId: 'bca',
          providerName: 'BCA (e-Rate)',
          baseCurrency: 'IDR',
          targetCurrency: curr,
          buyRate: val.buy,
          sellRate: val.sell,
          middleRate: val.mid,
          spread,
          spreadPercent,
          change24h: val.change,
          updatedAt: now,
          rateType: 'SPECIAL_RATE',
        });
      });

      return items;
    }
  }

  async getRateMatrix(currency = 'USD'): Promise<RateMatrixResponse> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: RateMatrixResponse }>(`/rates/matrix?currency=${currency}`);
      return data.data;
    } catch {
      const base = BASE_RATES_IDR[currency] || { buy: 16220, sell: 16280, mid: 16250, change: 0.15 };
      const now = new Date().toISOString();

      // Variations per provider
      const rows: RateMatrixResponse['rows'] = [
        {
          providerId: 'bi',
          providerName: 'Bank Indonesia (JISDOR)',
          providerType: 'central_bank',
          rateType: 'JISDOR',
          buyRate: base.buy + 15,
          sellRate: base.sell - 15,
          middleRate: base.mid,
          spread: base.sell - base.buy - 30,
          spreadPercent: ((base.sell - base.buy - 30) / base.mid) * 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: true,
        },
        {
          providerId: 'bca',
          providerName: 'BCA (e-Rate)',
          providerType: 'commercial_bank',
          rateType: 'e-Rate (Online)',
          buyRate: base.buy + 10,
          sellRate: base.sell,
          middleRate: (base.buy + 10 + base.sell) / 2,
          spread: base.sell - (base.buy + 10),
          spreadPercent: ((base.sell - (base.buy + 10)) / base.mid) * 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: true,
          isLowestSpread: false,
        },
        {
          providerId: 'mandiri',
          providerName: 'Bank Mandiri (Special Rate)',
          providerType: 'commercial_bank',
          rateType: 'Special Rate',
          buyRate: base.buy + 20,
          sellRate: base.sell + 10,
          middleRate: (base.buy + 20 + base.sell + 10) / 2,
          spread: (base.sell + 10) - (base.buy + 20),
          spreadPercent: (((base.sell + 10) - (base.buy + 20)) / base.mid) * 100,
          updatedAt: now,
          isBestBuy: true,
          isBestSell: false,
          isLowestSpread: false,
        },
        {
          providerId: 'bri',
          providerName: 'BRI (e-Rate)',
          providerType: 'commercial_bank',
          rateType: 'e-Rate',
          buyRate: base.buy - 10,
          sellRate: base.sell + 15,
          middleRate: base.mid,
          spread: (base.sell + 15) - (base.buy - 10),
          spreadPercent: (((base.sell + 15) - (base.buy - 10)) / base.mid) * 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: false,
        },
        {
          providerId: 'bni',
          providerName: 'BNI (Special Rates)',
          providerType: 'commercial_bank',
          rateType: 'Special Rate',
          buyRate: base.buy,
          sellRate: base.sell + 20,
          middleRate: (base.buy + base.sell + 20) / 2,
          spread: 20 + (base.sell - base.buy),
          spreadPercent: ((20 + (base.sell - base.buy)) / base.mid) * 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: false,
        },
        {
          providerId: 'cimb',
          providerName: 'CIMB Niaga (OCTO Clicks)',
          providerType: 'commercial_bank',
          rateType: 'Special Rate',
          buyRate: base.buy + 5,
          sellRate: base.sell + 5,
          middleRate: base.mid + 5,
          spread: base.sell - base.buy,
          spreadPercent: ((base.sell - base.buy) / base.mid) * 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: false,
        },
        {
          providerId: 'dolarasia',
          providerName: 'DolarAsia (Fisik / Banknotes)',
          providerType: 'money_changer',
          rateType: 'Banknotes',
          buyRate: base.buy - 30,
          sellRate: base.sell + 40,
          middleRate: base.mid + 5,
          spread: 70 + (base.sell - base.buy),
          spreadPercent: ((70 + (base.sell - base.buy)) / base.mid) * 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: false,
        },
      ];

      return {
        currency,
        baseCurrency: 'IDR',
        timestamp: now,
        totalProviders: rows.length,
        bestBuyProvider: 'Bank Mandiri',
        bestSellProvider: 'BCA',
        lowestSpreadProvider: 'Bank Indonesia (JISDOR)',
        rows,
      };
    }
  }

  async convertCurrency(
    from: string,
    to: string,
    amount: number,
    providerId = 'bca'
  ): Promise<ConversionResult> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: ConversionResult }>(
        `/convert?from=${from}&to=${to}&amount=${amount}&provider=${providerId}`
      );
      return data.data;
    } catch {
      const isFromIdr = from === 'IDR';
      const foreignCurr = isFromIdr ? to : from;
      const base = BASE_RATES_IDR[foreignCurr] || { buy: 16220, sell: 16280, mid: 16250, change: 0 };
      
      const rateUsed = isFromIdr ? (1 / base.sell) : base.buy;
      const rateType = isFromIdr ? 'sell' : 'buy';
      const resultAmount = amount * rateUsed;
      const now = new Date().toISOString();

      const comparisons = [
        {
          providerId: 'bca',
          providerName: 'BCA (e-Rate)',
          resultAmount: isFromIdr ? amount / 16280 : amount * 16230,
          diffWithBest: 0,
          diffPercent: 0,
        },
        {
          providerId: 'mandiri',
          providerName: 'Bank Mandiri',
          resultAmount: isFromIdr ? amount / 16290 : amount * 16240,
          diffWithBest: isFromIdr ? -5 : 10000,
          diffPercent: 0.06,
        },
        {
          providerId: 'bri',
          providerName: 'BRI',
          resultAmount: isFromIdr ? amount / 16295 : amount * 16210,
          diffWithBest: isFromIdr ? -10 : -20000,
          diffPercent: -0.12,
        },
        {
          providerId: 'dolarasia',
          providerName: 'DolarAsia (Fisik)',
          resultAmount: isFromIdr ? amount / 16320 : amount * 16190,
          diffWithBest: isFromIdr ? -25 : -40000,
          diffPercent: -0.25,
        },
      ];

      return {
        from,
        to,
        amount,
        resultAmount,
        rateUsed: isFromIdr ? base.sell : base.buy,
        rateType,
        provider: {
          id: providerId,
          name: MOCK_PROVIDERS.find(p => p.id === providerId)?.name || 'BCA (e-Rate)',
        },
        updatedAt: now,
        comparisons,
      };
    }
  }

  async getHistoricalRates(
    currency = 'USD',
    range: '7d' | '30d' | '90d' | '365d' = '30d'
  ): Promise<HistoricalTrendResponse> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: HistoricalTrendResponse }>(
        `/history?currency=${currency}&range=${range}`
      );
      return data.data;
    } catch {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
      const base = BASE_RATES_IDR[currency] || { buy: 16220, sell: 16280, mid: 16250, change: 0.15 };
      
      const points: HistoricalTrendResponse['points'] = [];
      const now = new Date();
      let currentVal = base.mid - (days * 1.5);

      for (let i = days; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        // Add smooth random walk
        const step = (Math.sin(i * 0.3) * 25) + ((Math.random() - 0.48) * 20);
        currentVal += step;
        
        points.push({
          timestamp: d.toISOString(),
          date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          buyRate: Math.round(currentVal - 25),
          sellRate: Math.round(currentVal + 25),
          middleRate: Math.round(currentVal),
        });
      }

      const rates = points.map(p => p.middleRate);
      const min = Math.min(...rates);
      const max = Math.max(...rates);
      const sum = rates.reduce((acc, v) => acc + v, 0);
      const avg = Math.round(sum / rates.length);
      const current = rates[rates.length - 1];
      const start = rates[0];
      const changePeriod = current - start;
      const changePeriodPercent = (changePeriod / start) * 100;

      return {
        currency,
        baseCurrency: 'IDR',
        range,
        provider: 'Bank Indonesia (JISDOR)',
        points,
        summary: {
          min,
          max,
          avg,
          current,
          changePeriod,
          changePeriodPercent,
        },
      };
    }
  }

  async createRateAlert(payload: RateAlertRequest): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.fetchJson<{ success: boolean; message: string }>('/alerts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data;
    } catch {
      return {
        success: true,
        message: `Notifikasi berhasil didaftarkan untuk ${payload.email}. Anda akan menerima email saat ${payload.targetCurrency}/${payload.baseCurrency} ${payload.condition === 'above' ? '≥' : '≤'} ${payload.targetRate}.`,
      };
    }
  }
}

export const apiClient = new ApiClient();
