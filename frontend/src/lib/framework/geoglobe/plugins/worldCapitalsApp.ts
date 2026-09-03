/**
 * Kurs World / GeoGlobe — World Capitals & Independence History Plugin (ADR 0039).
 * Visualizes 195+ sovereign country capitals, foundation dates, and national independence days.
 */
import type { 
  CountrySpatialMetadata, 
  GeoAppPlugin, 
  InspectorWidget 
} from '../types';
import { 
  type WorldCapitalData, 
  getCapitalDataForCountry 
} from '../data/worldCapitalsData';
import { getCountryFlagColor } from '$lib/features/map/country-flag-colors';

export type { WorldCapitalData };

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const worldCapitalsApp: GeoAppPlugin<WorldCapitalData> = {
  id: 'world-capitals',
  name: 'Ibukota & Kemerdekaan',
  tagline: 'Peta 195+ Ibukota Negara Global, Tanggal Berdiri & Hari Kemerdekaan',
  icon: 'Landmark',
  category: 'history',
  defaultMetricId: 'era',

  // 1. Auto-Routing (ADR 0038)
  canonicalPath: '/capitals',
  aliasPaths: ['/ibukota', '/capital', '/independence', '/kemerdekaan'],

  branding: {
    main: 'Capitals',
    sub: '.World',
    accentColor: '#f59e0b',
    disclaimer: 'Data ibukota & sejarah kemerdekaan 195+ negara · Gratis · Tanpa registrasi',
  },
  splash: {
    stepText: 'Memuat Peta Ibukota & Sejarah Kemerdekaan Global...',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-rose-500',
  },
  filterOptions: [
    { id: 'all', label: 'Semua Era' },
    { id: 'ancient', label: 'Peradaban Kuno' },
    { id: '19th_century', label: 'Abad ke-19' },
    { id: 'post_ww1', label: 'Pasca PD I (1918-1939)' },
    { id: 'post_ww2', label: 'Pasca PD II (1945-1959)' },
    { id: 'decolonization', label: 'Dekolonisasi (1960-1989)' },
    { id: 'post_1990', label: 'Modern Pasca-1990' },
  ],

  // 2. Metrics Definition
  metrics: [
    {
      id: 'era',
      label: 'Era Kemerdekaan / Pembentukan Negara',
      unit: 'Era',
      formatValue: (_val: unknown, raw?: any) => {
        const item = raw as WorldCapitalData | undefined;
        return item?.eraLabel ?? 'Kedaulatan Bersejarah';
      },
      colorScale: (_norm: number, raw?: any) => {
        const era = (raw as WorldCapitalData | undefined)?.historicalEra;
        switch (era) {
          case 'ancient': return '#d97706';            // Emas Kuno
          case '19th_century': return '#8b5cf6';       // Ungu Abad 19
          case 'post_ww1': return '#3b82f6';           // Biru Antar-Perang
          case 'post_ww2': return '#10b981';           // Zamrud Pasca-PD II
          case 'decolonization': return '#f59e0b';     // Amber Dekolonisasi
          case 'modern_post_soviet': return '#06b6d4'; // Cyan Pasca-1990
          default: return '#10b981';
        }
      },
    },
    {
      id: 'national_month',
      label: 'Bulan Peringatan Hari Nasional (Jan–Des)',
      unit: 'Bulan',
      formatValue: (val: unknown) => {
        const m = Number(val);
        return m >= 1 && m <= 12 ? MONTH_NAMES[m - 1] : String(val);
      },
      colorScale: (norm: number) => {
        const hue = Math.round(norm * 330);
        return `hsl(${hue}, 75%, 55%)`;
      },
      min: 1,
      max: 12,
    },
    {
      id: 'flag',
      label: 'Bendera Negara',
      unit: 'Bendera',
      formatValue: (_val: unknown, raw?: any) => {
        const item = raw as WorldCapitalData | undefined;
        return item?.capital ? `Ibukota: ${item.capital}` : 'Warna Bendera';
      },
      colorScale: (_norm: number) => '#3b82f6',
    },
  ],

  // 3. Data Loader
  dataLoader: async (countries: CountrySpatialMetadata[]) => {
    const result: Record<string, WorldCapitalData> = {};
    for (const c of countries) {
      result[c.iso3] = getCapitalDataForCountry(c.iso3);
    }
    return result;
  },

  // 4. WebGL Polygon Coloring Hook
  getPolygonColor: (
    country: CountrySpatialMetadata,
    data: WorldCapitalData,
    activeMetric: string,
    theme: 'dark' | 'light',
    state?: { isMatched?: boolean; isSelected?: boolean; isHovered?: boolean }
  ) => {
    const isDark = theme === 'dark';

    if (activeMetric === 'flag') {
      return getCountryFlagColor(country.iso3);
    }

    if (state?.isSelected) return '#38bdf8';
    if (state?.isHovered) return '#34d399';

    // Dim non-matching countries when filtering is active
    if (state?.isMatched === false) {
      return isDark ? 'rgba(30, 41, 59, 0.20)' : 'rgba(226, 232, 240, 0.35)';
    }

    if (!data) {
      return isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.6)';
    }

    if (activeMetric === 'national_month') {
      const m = data.nationalDayMonth;
      const hue = Math.round(((m - 1) / 11) * 320);
      return isDark 
        ? `hsla(${hue}, 80%, 55%, 0.85)` 
        : `hsla(${hue}, 75%, 45%, 0.85)`;
    }

    // Default: 'era'
    switch (data.historicalEra) {
      case 'ancient':
        return isDark ? 'rgba(217, 119, 6, 0.85)' : 'rgba(180, 83, 9, 0.85)';    // Amber Emas
      case '19th_century':
        return isDark ? 'rgba(139, 92, 246, 0.85)' : 'rgba(124, 58, 237, 0.85)'; // Ungu Royalti
      case 'post_ww1':
        return isDark ? 'rgba(59, 130, 246, 0.85)' : 'rgba(37, 99, 235, 0.85)';   // Biru Cobalt
      case 'post_ww2':
        return isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(5, 150, 105, 0.85)';  // Zamrud Kemerdekaan
      case 'decolonization':
        return isDark ? 'rgba(245, 158, 11, 0.85)' : 'rgba(217, 119, 6, 0.85)'; // Amber Dekolonisasi
      case 'modern_post_soviet':
        return isDark ? 'rgba(6, 182, 212, 0.85)' : 'rgba(8, 145, 178, 0.85)';   // Cyan Pasca-1990
      default:
        return isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(5, 150, 105, 0.85)';
    }
  },

  // 5. Interactive Tooltip Hook
  getTooltipHtml: (
    country: CountrySpatialMetadata,
    data: WorldCapitalData,
    _activeMetric: string,
    theme: 'dark' | 'light'
  ) => {
    const isDark = theme === 'dark';
    const cap = data?.capital ?? country.capital;
    const foundation = data?.foundationDate ?? 'Tanggal Tidak Tercatat';
    const nationalDay = data?.independenceDay ?? 'Hari Nasional';
    const sovereignty = data?.sovereigntyFrom ?? 'Kedaulatan Nasional';
    const eraText = data?.eraLabel ?? 'Kedaulatan Bersejarah';

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 240px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">${country.flagEmoji}</span>
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${country.countryName}</span>
          </div>
          <span style="font-size: 10px; font-weight: 700; color: #38bdf8; font-family: monospace;">${country.iso3}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 900; color: #38bdf8; margin-bottom: 4px;">
          <span>🏛️</span>
          <span>${cap}</span>
        </div>

        <div style="font-size: 11px; font-weight: 700; color: #10b981; margin-bottom: 2px;">
          🎉 Hari Kemerdekaan: ${nationalDay}
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 2px;">
          📅 Berdiri: ${foundation}
        </div>
        <div style="font-size: 10px; color: ${isDark ? '#cbd5e1' : '#64748b'}; margin-bottom: 4px;">
          🚩 Asal: ${sovereignty}
        </div>

        ${data?.nationalAnthem?.title ? `
          <div style="font-size: 11px; font-weight: 700; color: #f59e0b; margin-bottom: 4px;">
            🎵 Lagu Kebangsaan: ${data.nationalAnthem.title}
          </div>
        ` : ''}

        <div style="display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
          ${eraText}
        </div>
      </div>
    `;
  },

  // 6. 3D Globe Landmark Pin Labels
  getPinLabel: (country: CountrySpatialMetadata, data: WorldCapitalData) => {
    const cap = data?.capital ?? country.capital;
    const flag = country.flagEmoji || '🏛️';
    return {
      text: `${flag} ${cap} • ${country.countryName}`,
      shortText: `${flag} ${cap}`,
      lat: data?.capitalCoordinates?.lat,
      lng: data?.capitalCoordinates?.lng,
    };
  },

  // 7. Dynamic Filter Predicate
  filterPredicate: (
    _iso3: string,
    filterValue: unknown,
    data?: WorldCapitalData,
    country?: CountrySpatialMetadata
  ): boolean => {
    const filter = String(filterValue ?? 'all');
    if (filter === 'all') return true;

    // Filter by Continent / Region
    if (['asia', 'europe', 'africa', 'americas', 'oceania'].includes(filter.toLowerCase())) {
      if (!country) return true;
      return country.region.toLowerCase() === filter.toLowerCase() || country.continent.toLowerCase() === filter.toLowerCase();
    }

    if (!data) return true;

    // Filter by Era
    switch (filter) {
      case 'ancient':
        return data.historicalEra === 'ancient';
      case '19th_century':
        return data.historicalEra === '19th_century';
      case 'post_ww1':
        return data.historicalEra === 'post_ww1';
      case 'post_ww2':
        return data.historicalEra === 'post_ww2';
      case 'decolonization':
        return data.historicalEra === 'decolonization';
      case 'post_1990':
      case 'modern_post_soviet':
        return data.historicalEra === 'modern_post_soviet';
      default:
        return true;
    }
  },

  // 8. Cinematic Camera Presets
  cameraPresets: {
    all: { lat: 10, lng: 110, altitude: 2.2 },
    asean: { lat: 4, lng: 108, altitude: 1.6 },
    asia: { lat: 25, lng: 95, altitude: 1.8 },
    europe: { lat: 50, lng: 15, altitude: 1.6 },
    americas: { lat: 10, lng: -75, altitude: 2.0 },
    africa: { lat: 0, lng: 20, altitude: 1.9 },
    oceania: { lat: -25, lng: 135, altitude: 1.9 },
  },

  // 9. Inspector Drawer Widget
  renderInspector: (country: CountrySpatialMetadata, data: WorldCapitalData): InspectorWidget => {
    const cap = data?.capital ?? country.capital;
    const foundation = data?.foundationDate ?? '-';
    const independence = data?.independenceDay ?? '-';
    const sovereignty = data?.sovereigntyFrom ?? '-';
    const trivia = data?.trivia ?? `${cap} adalah pusat pemerintahan resmi ${country.countryName}.`;
    const anthem = data?.nationalAnthem;
    const anthemText = anthem ? `${anthem.title}${anthem.composer ? ` (Komposer: ${anthem.composer})` : ''}` : '-';

    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'stats',
      primaryValue: cap,
      subtitle: `Ibukota Negara • Hari Nasional: ${independence}`,
      badge: {
        text: data?.eraLabel ?? 'Kedaulatan Bersejarah',
        variant: 'info',
      },
      statsGrid: [
        { label: 'Nama Resmi Ibukota', value: cap },
        { label: 'Tipe Ibukota', value: data?.capitalType ?? 'Administrative' },
        { label: '🎵 Lagu Kebangsaan', value: anthemText },
        { label: 'Hari Kemerdekaan / Nasional', value: independence },
        { label: 'Tanggal / Tahun Berdiri', value: foundation },
        { label: 'Asal Kedaulatan', value: sovereignty },
        { label: 'Kawasan Spasial', value: country.region },
        { label: 'Fakta Sejarah', value: trivia },
      ],
      customData: {
        capital: cap,
        independenceDay: independence,
        foundationDate: foundation,
        era: data?.historicalEra,
        nationalAnthem: anthem,
        trivia,
      },
    };
  },
};
