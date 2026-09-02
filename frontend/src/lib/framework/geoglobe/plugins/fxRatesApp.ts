import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';
import { BASE_RATES_IDR } from '$lib/api/client';

export interface FxRateData {
  rateToIdr: number;
  buyRate: number;
  sellRate: number;
  change24h: number;
  formattedRate: string;
}

export const fxRatesApp: GeoAppPlugin<FxRateData> = {
  id: 'fx-rates',
  name: 'Kurs World',
  tagline: 'Peta Nilai Tukar & Konversi 195+ Valas Global vs IDR',
  icon: 'Coins',
  category: 'finance',
  defaultMetricId: 'rate',
  metrics: [
    {
      id: 'rate',
      label: 'Nilai Kurs ke Rupiah (Rp)',
      unit: 'Rp',
      formatValue: (val: unknown) =>
        typeof val === 'number'
          ? `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : String(val),
      colorScale: (normalized: number) => {
        if (normalized > 0.8) return '#10b981';
        if (normalized > 0.5) return '#059669';
        if (normalized > 0.2) return '#0d9488';
        return '#0f766e';
      },
    },
    {
      id: 'change',
      label: 'Performa 24 Jam (%)',
      unit: '%',
      formatValue: (val: unknown) => `${Number(val) >= 0 ? '+' : ''}${Number(val).toFixed(2)}%`,
      colorScale: (normalized: number, raw?: unknown) => {
        const change = Number(raw ?? 0);
        if (change > 0) return '#10b981';
        if (change < 0) return '#ef4444';
        return '#64748b';
      },
    },
    {
      id: 'flag',
      label: 'Bendera Negara (Vexillology)',
      formatValue: () => 'Bendera Prosedural WebGL',
      colorScale: () => '#38bdf8',
    },
  ],

  dataLoader: async (countries: CountrySpatialMetadata[]) => {
    const dataMap: Record<string, FxRateData> = {};
    for (const country of countries) {
      const rateInfo = BASE_RATES_IDR[country.currencyCode] ?? {
        buy: 1000,
        sell: 1010,
        mid: 1005,
        change: 0.0,
      };

      dataMap[country.iso3] = {
        rateToIdr: rateInfo.mid,
        buyRate: rateInfo.buy,
        sellRate: rateInfo.sell,
        change24h: rateInfo.change,
        formattedRate: `Rp ${rateInfo.mid.toLocaleString('id-ID')}`,
      };
    }
    return dataMap;
  },

  renderInspector: (country: CountrySpatialMetadata, data: FxRateData): InspectorWidget => {
    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'fx_calculator',
      primaryValue: data?.formattedRate ?? `Rp ${country.currencyCode}`,
      subtitle: `1 ${country.currencyCode} (${country.currencyName})`,
      badge: {
        text: `${(data?.change24h ?? 0) >= 0 ? '+' : ''}${(data?.change24h ?? 0).toFixed(2)}% 24h`,
        variant: (data?.change24h ?? 0) >= 0 ? 'success' : 'danger',
      },
      statsGrid: [
        { label: 'Kurs Beli', value: `Rp ${(data?.buyRate ?? 0).toLocaleString('id-ID')}` },
        { label: 'Kurs Jual', value: `Rp ${(data?.sellRate ?? 0).toLocaleString('id-ID')}` },
        { label: 'Ibukota', value: country.capital },
        { label: 'Kawasan', value: country.region },
      ],
      customData: {
        currencyCode: country.currencyCode,
        currencyName: country.currencyName,
      },
    };
  },
};
