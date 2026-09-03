import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';
import { isCountryMatchingPassportFilter, PASSPORT_ENTRY_STATUS_MAP, type PassportVisaFilterType } from '../filterEngine';
import PassportBottomDock from '$lib/apps/passport/PassportBottomDock.svelte';

import passportDataset from '../data/passport_dataset.json';

export interface PassportData {
  visaFreeCount: number;
  globalRank: number;
  mobilityScore: number;
  visaRequirementForIndonesian: 'Visa Free' | 'Visa on Arrival' | 'eVisa' | 'Visa Required';
}

export type PassportRequirementType = 'Visa Free' | 'Visa on Arrival' | 'eVisa' | 'Visa Required';

export interface PassportScoreItem {
  visaFree: number;
  rank: number;
  indoRequirement: PassportRequirementType;
}

export const PASSPORT_SCORES: Record<string, PassportScoreItem> = (
  passportDataset.scores || passportDataset.PASSPORT_SCORES
) as Record<string, PassportScoreItem>;

export const passportWorldApp: GeoAppPlugin<PassportData> = {
  id: 'passport-power',
  name: 'Passport World',
  tagline: 'Peta Kekuatan Paspor & Indeks Akses Bebas Visa Global',
  icon: 'BookOpen',
  category: 'travel',
  defaultMetricId: 'visa_free',
  canonicalPath: '/passport',
  aliasPaths: [],
  branding: {
    main: 'Passport',
    sub: '.World',
    accentColor: '#8b5cf6',
    disclaimer: 'Indeks kekuatan paspor & akses bebas visa 195+ negara · Data publik · Gratis',
  },
  splash: {
    stepText: 'Memuat Indeks Kekuatan Paspor & Bebas Visa...',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
  },
  filterOptions: [
    { id: 'all', label: 'Semua Paspor' },
    { id: 'free', label: 'Bebas Visa WNI 🟢' },
    { id: 'voa', label: 'VoA / eVisa 🟡' },
    { id: 'required', label: 'Butuh Visa 🔴' },
  ],
  filterPredicate: (iso3: string, filterValue: unknown, data?: PassportData, _country?: CountrySpatialMetadata) => {
    if (!filterValue || filterValue === 'all') return true;
    const status = data?.visaRequirementForIndonesian ?? PASSPORT_SCORES[iso3]?.indoRequirement ?? PASSPORT_ENTRY_STATUS_MAP[iso3] ?? 'Visa Required';
    if (filterValue === 'free') return status === 'Visa Free';
    if (filterValue === 'voa') return status === 'Visa on Arrival' || status === 'eVisa';
    if (filterValue === 'required') return status === 'Visa Required';
    return true;
  },
  metrics: [
    {
      id: 'visa_free',
      label: 'Jumlah Negara Bebas Visa (Mobility Score)',
      unit: 'Negara',
      formatValue: (val: unknown) => `${val} Destinasi Bebas Visa`,
      colorScale: (normalized: number, raw?: unknown) => {
        const count = Number(raw ?? 50);
        if (count >= 180) return '#10b981';
        if (count >= 120) return '#06b6d4';
        if (count >= 70) return '#f59e0b';
        return '#ef4444';
      },
    },
    {
      id: 'rank',
      label: 'Peringkat Paspor Global',
      unit: 'Rank',
      formatValue: (val: unknown) => `Peringkat #${val}`,
      colorScale: (normalized: number, raw?: unknown) => {
        const rank = Number(raw ?? 100);
        if (rank <= 10) return '#10b981';
        if (rank <= 30) return '#06b6d4';
        if (rank <= 70) return '#eab308';
        return '#64748b';
      },
    },
  ],

  dataLoader: async (countries: CountrySpatialMetadata[]) => {
    const dataMap: Record<string, PassportData> = {};

    for (const country of countries) {
      const score = PASSPORT_SCORES[country.iso3] ?? {
        visaFree: Math.max(40, Math.min(170, Math.round(75 + (country.lat * 0.5)))),
        rank: 70,
        indoRequirement: 'Visa Required',
      };

      dataMap[country.iso3] = {
        visaFreeCount: score.visaFree,
        globalRank: score.rank,
        mobilityScore: score.visaFree,
        visaRequirementForIndonesian: score.indoRequirement,
      };
    }

    return dataMap;
  },

  getPolygonColor: (country: CountrySpatialMetadata, data: any, _activeMetric: string, _theme: 'dark' | 'light'): string => {
    const pScore = data?.visaFreeCount ?? PASSPORT_SCORES[country.iso3]?.visaFree ?? 75;
    if (pScore >= 180) return 'rgba(16, 185, 129, 0.85)';
    if (pScore >= 120) return 'rgba(6, 182, 212, 0.80)';
    if (pScore >= 70) return 'rgba(245, 158, 11, 0.80)';
    return 'rgba(244, 63, 94, 0.80)';
  },

  getTooltipHtml: (country: CountrySpatialMetadata, data: any, _activeMetric: string, theme: 'dark' | 'light'): string => {
    const isDark = theme === 'dark';
    const name = country.countryName;
    const pScore = data?.visaFreeCount ?? PASSPORT_SCORES[country.iso3]?.visaFree ?? 75;
    const rank = data?.globalRank ?? PASSPORT_SCORES[country.iso3]?.rank ?? 70;
    const req = data?.visaRequirementForIndonesian ?? PASSPORT_SCORES[country.iso3]?.indoRequirement ?? 'Visa Required';
    const reqColor = req === 'Visa Free' ? '#10b981' : (req === 'Visa on Arrival' || req === 'eVisa' ? '#f59e0b' : '#f43f5e');

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">${country.flagEmoji}</span>
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
          </div>
          <span style="font-size: 10px; font-weight: 700; color: #10b981; font-family: monospace;">Rank #${rank}</span>
        </div>
        <div style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'}; margin-bottom: 4px;">
          Akses Bebas: ${pScore} Destinasi
        </div>
        <div style="font-size: 11px; font-weight: 700; color: ${reqColor};">
          Bagi WNI: ${req}
        </div>
      </div>
    `;
  },

  getPinLabel: (country: CountrySpatialMetadata, data: any): { text: string; shortText: string } => {
    const pScore = data?.visaFreeCount ?? PASSPORT_SCORES[country.iso3]?.visaFree ?? 75;
    return {
      text: `${country.countryName} (${pScore} Destinasi)`,
      shortText: `${pScore}`,
    };
  },

  renderInspector: (country: CountrySpatialMetadata, data: PassportData | undefined): InspectorWidget => {
    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'passport',
      primaryValue: `${data?.visaFreeCount ?? 70} Destinasi Bebas Visa`,
      subtitle: `Peringkat #${data?.globalRank ?? 70} Dunia`,
      badge: {
        text: `Syarat bagi WNI: ${data?.visaRequirementForIndonesian ?? 'Visa Required'}`,
        variant:
          data?.visaRequirementForIndonesian === 'Visa Free'
            ? 'success'
            : data?.visaRequirementForIndonesian === 'Visa on Arrival' || data?.visaRequirementForIndonesian === 'eVisa'
              ? 'warning'
              : 'info',
      },
      statsGrid: [
        { label: 'Akses Bebas Visa', value: `${data?.visaFreeCount ?? 70} Negara` },
        { label: 'Peringkat Paspor', value: `Top #${data?.globalRank ?? 70}` },
        { label: 'Syarat Masuk (WNI)', value: data?.visaRequirementForIndonesian ?? 'Visa Required' },
        { label: 'Ibukota', value: country.capital },
      ],
    };
  },
  BottomDockComponent: PassportBottomDock,
};
