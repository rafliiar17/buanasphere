import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';
import { BASE_RATES_IDR } from '$lib/api/client';
import { formatRupiah, formatPercent } from '$lib/formatters/currency';
import { getCountryFlagColor } from '$lib/features/map/country-flag-colors';

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
  canonicalPath: '/kurs',
  aliasPaths: ['/'],
  branding: {
    main: 'Kurs',
    sub: '.World',
    accentColor: '#10b981',
  },
  splash: {
    stepText: 'Memuat Nilai Tukar 195+ Valuta Asing Dunia...',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
  },
  filterOptions: [
    { id: 'all', label: 'Semua Kawasan' },
    { id: 'asia', label: 'Asia' },
    { id: 'europe', label: 'Eropa' },
    { id: 'americas', label: 'Amerika' },
    { id: 'africa', label: 'Afrika' },
    { id: 'oceania', label: 'Oseania' },
  ],
  filterPredicate: (iso3: string, filterValue: unknown, _data?: FxRateData, country?: CountrySpatialMetadata) => {
    if (!filterValue || filterValue === 'all') return true;
    const val = String(filterValue).toLowerCase();
    return country?.region.toLowerCase() === val || country?.continent.toLowerCase() === val;
  },
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

  getPolygonColor: (country: CountrySpatialMetadata, data: any, activeMetric: string, theme: 'dark' | 'light'): string => {
    const isDark = theme === 'dark';
    const rate = data?.middleRate ?? data?.rateToIdr ?? BASE_RATES_IDR[country.currencyCode]?.mid ?? 1000;
    const chg = data?.change24h ?? BASE_RATES_IDR[country.currencyCode]?.change ?? 0;

    if (activeMetric === 'rate') {
      if (rate > 20000) return isDark ? 'rgba(99, 102, 241, 0.90)' : 'rgba(79, 70, 229, 0.90)';
      if (rate > 14000) return isDark ? 'rgba(37, 99, 235, 0.90)' : 'rgba(29, 78, 216, 0.90)';
      if (rate > 3000)  return isDark ? 'rgba(6, 182, 212, 0.85)' : 'rgba(8, 145, 178, 0.85)';
      if (rate > 500)   return isDark ? 'rgba(245, 158, 11, 0.85)' : 'rgba(217, 119, 6, 0.85)';
      return isDark ? 'rgba(234, 88, 12, 0.80)' : 'rgba(194, 65, 12, 0.80)';
    } else if (activeMetric === 'change') {
      if (chg >= 0.20) return isDark ? 'rgba(16, 185, 129, 0.95)' : 'rgba(5, 150, 105, 0.95)';
      if (chg > 0.02)  return isDark ? 'rgba(34, 197, 94, 0.90)' : 'rgba(22, 163, 74, 0.90)';
      if (chg > 0.00)  return isDark ? 'rgba(52, 211, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)';
      if (chg <= -0.20) return isDark ? 'rgba(225, 29, 72, 0.95)' : 'rgba(190, 18, 60, 0.95)';
      if (chg < -0.02) return isDark ? 'rgba(244, 63, 94, 0.90)' : 'rgba(225, 29, 72, 0.90)';
      if (chg < 0.00)  return isDark ? 'rgba(251, 113, 133, 0.85)' : 'rgba(244, 63, 94, 0.85)';
      return isDark ? 'rgba(100, 116, 139, 0.70)' : 'rgba(148, 163, 184, 0.75)';
    } else {
      return getCountryFlagColor(country.iso3, isDark);
    }
  },

  getTooltipHtml: (country: CountrySpatialMetadata, data: any, activeMetric: string, theme: 'dark' | 'light'): string => {
    const isDark = theme === 'dark';
    const name = country.countryName;
    const code = country.currencyCode;
    const currName = country.currencyName;
    const midRate = data?.middleRate ?? data?.rateToIdr ?? BASE_RATES_IDR[code]?.mid ?? 1000;
    const chg = data?.change24h ?? BASE_RATES_IDR[code]?.change ?? 0;
    const midFormatted = formatRupiah(midRate);
    const chgFormatted = formatPercent(chg);
    const chgColor = chg >= 0 ? '#10b981' : '#ef4444';

    if (activeMetric === 'change') {
      return `
        <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 16px;">${country.flagEmoji}</span>
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
            ${code ? `<span style="font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${code}</span>` : ''}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: ${chgColor}; margin: 6px 0 3px 0;">
            📈 Tren 24 Jam: ${chgFormatted} (${chg >= 0 ? 'Menguat' : 'Melemah'})
          </div>
          <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 2px;">
            Kurs Tengah: ${midFormatted}
          </div>
          <div style="font-size: 10px; color: #38bdf8; margin-top: 4px; font-weight: 600;">
            👉 Klik untuk pilih • Bandingkan bank
          </div>
        </div>
      `;
    }

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 16px;">${country.flagEmoji}</span>
          <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
          ${code ? `<span style="font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${code}</span>` : ''}
        </div>
        ${currName ? `<div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 6px;">${currName}</div>` : ''}
        <div style="font-size: 12px; font-weight: 700; color: #10b981; margin-bottom: 2px;">
          Kurs Tengah: ${midFormatted}
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'};">
          24 Jam: <span style="font-weight: 700; color: ${chgColor};">${chgFormatted}</span>
        </div>
        <div style="font-size: 10px; color: #38bdf8; margin-top: 4px; font-weight: 600;">
          👉 Klik untuk inspeksi perbandingan kurs
        </div>
      </div>
    `;
  },

  getPinLabel: (country: CountrySpatialMetadata): { text: string; shortText: string } => {
    const rawName = country.countryName;
    const curr = country.currencyCode;
    return {
      text: `${rawName} (${curr || country.iso3})`,
      shortText: curr || country.iso3,
    };
  },

  renderInspector: (country: CountrySpatialMetadata, data: FxRateData | undefined): InspectorWidget => {
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
