import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';

export interface PassportData {
  visaFreeCount: number;
  globalRank: number;
  mobilityScore: number;
  visaRequirementForIndonesian: 'Visa Free' | 'Visa on Arrival' | 'eVisa' | 'Visa Required';
}

const PASSPORT_SCORES: Record<string, { visaFree: number; rank: number; indoRequirement: 'Visa Free' | 'Visa on Arrival' | 'eVisa' | 'Visa Required' }> = {
  SGP: { visaFree: 195, rank: 1, indoRequirement: 'Visa Free' },
  JPN: { visaFree: 194, rank: 2, indoRequirement: 'Visa Free' },
  DEU: { visaFree: 193, rank: 3, indoRequirement: 'Visa Required' },
  FRA: { visaFree: 193, rank: 3, indoRequirement: 'Visa Required' },
  ITA: { visaFree: 193, rank: 3, indoRequirement: 'Visa Required' },
  ESP: { visaFree: 193, rank: 3, indoRequirement: 'Visa Required' },
  KOR: { visaFree: 192, rank: 4, indoRequirement: 'Visa Free' },
  GBR: { visaFree: 191, rank: 5, indoRequirement: 'Visa Required' },
  USA: { visaFree: 188, rank: 8, indoRequirement: 'Visa Required' },
  MYS: { visaFree: 183, rank: 12, indoRequirement: 'Visa Free' },
  ARE: { visaFree: 182, rank: 13, indoRequirement: 'eVisa' },
  BRN: { visaFree: 166, rank: 20, indoRequirement: 'Visa Free' },
  THA: { visaFree: 82, rank: 64, indoRequirement: 'Visa Free' },
  IDN: { visaFree: 78, rank: 68, indoRequirement: 'Visa Free' },
  PHL: { visaFree: 69, rank: 75, indoRequirement: 'Visa Free' },
  VNM: { visaFree: 55, rank: 88, indoRequirement: 'Visa Free' },
  IND: { visaFree: 62, rank: 80, indoRequirement: 'Visa on Arrival' },
  CHN: { visaFree: 85, rank: 60, indoRequirement: 'Visa Required' },
  SAU: { visaFree: 88, rank: 58, indoRequirement: 'eVisa' },
  TUR: { visaFree: 118, rank: 52, indoRequirement: 'Visa Free' },
};

export const passportWorldApp: GeoAppPlugin<PassportData> = {
  id: 'passport-power',
  name: 'Passport World',
  tagline: 'Peta Kekuatan Paspor & Indeks Akses Bebas Visa Global',
  icon: 'BookOpen',
  category: 'travel',
  defaultMetricId: 'visa_free',
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

  renderInspector: (country: CountrySpatialMetadata, data: PassportData): InspectorWidget => {
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
};
