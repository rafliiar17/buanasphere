import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';
import { 
  type FloraFaunaData, 
  getFloraFaunaDataForCountry, 
  FLORA_FAUNA_DATASET 
} from '../data/floraFaunaData';
import { isCountryMatchingNatureFilter, type NatureFilterType } from '../filterEngine';

export const floraFaunaApp: GeoAppPlugin<FloraFaunaData> = {
  id: 'flora-fauna',
  name: 'Nature World',
  tagline: 'Peta Keanekaragaman Hayati, Satwa Ikonik & Flora Global',
  icon: 'Trees',
  category: 'nature',
  defaultMetricId: 'biodiversity',
  canonicalPath: '/nature',
  aliasPaths: ['/flora-fauna', '/flora', '/fauna', '/wildlife', '/biodiversity'],
  branding: {
    main: 'Nature',
    sub: '.World',
    accentColor: '#10b981',
  },
  splash: {
    stepText: 'Memuat Keanekaragaman Hayati & Satwa Global...',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-green-600',
  },
  filterOptions: [
    { id: 'all', label: 'Semua Wilayah' },
    { id: 'megadiverse', label: 'Megadiverse 17 🌟' },
    { id: 'endangered', label: 'Satwa Terancam 🔴' },
    { id: 'rainforest', label: 'Hutan Hujan 🌴' },
    { id: 'endemic', label: 'Spesies Endemik Tinggi 🦎' },
  ],
  filterPredicate: (iso3: string, filterValue: unknown) => {
    return isCountryMatchingNatureFilter(iso3, (filterValue as NatureFilterType) || 'all');
  },
  metrics: [
    {
      id: 'biodiversity',
      label: 'Indeks Keanekaragaman Hayati (Biodiversity Score)',
      unit: 'Poin',
      formatValue: (val: unknown) => `${val} Poin Keanekaragaman`,
      colorScale: (normalized: number, raw?: unknown) => {
        const score = Number(raw ?? 60);
        if (score >= 90) return '#059669';
        if (score >= 80) return '#10b981';
        if (score >= 65) return '#06b6d4';
        if (score >= 50) return '#eab308';
        return '#64748b';
      },
    },
    {
      id: 'iucn_risk',
      label: 'Status Konservasi Satwa (IUCN Red List Alert)',
      unit: 'Status',
      formatValue: (val: unknown) => `${val}`,
      colorScale: (normalized: number, raw?: unknown) => {
        const status = String(raw ?? 'Least Concern');
        if (status.includes('Critically')) return '#ef4444';
        if (status.includes('Endangered')) return '#f97316';
        if (status.includes('Vulnerable')) return '#eab308';
        if (status.includes('Near')) return '#38bdf8';
        return '#10b981';
      },
    },
    {
      id: 'biome',
      label: 'Bioma & Habitat Dominan',
      unit: 'Bioma',
      formatValue: (val: unknown) => `${val}`,
      colorScale: (normalized: number, raw?: unknown) => {
        const biome = String(raw ?? 'Temperate Forest');
        if (biome.includes('Rainforest')) return '#047857';
        if (biome.includes('Savanna')) return '#d97706';
        if (biome.includes('Desert')) return '#ca8a04';
        if (biome.includes('Taiga') || biome.includes('Boreal')) return '#0284c7';
        if (biome.includes('Tundra')) return '#93c5fd';
        return '#15803d';
      },
    },
  ],

  dataLoader: async (countries: CountrySpatialMetadata[]) => {
    const dataMap: Record<string, FloraFaunaData> = {};

    for (const country of countries) {
      dataMap[country.iso3] = getFloraFaunaDataForCountry(country.iso3);
    }

    return dataMap;
  },

  getPolygonColor: (country: CountrySpatialMetadata, data: any, activeMetric: string, theme: 'dark' | 'light'): string => {
    const isDark = theme === 'dark';
    const bio = data ?? getFloraFaunaDataForCountry(country.iso3);

    if (activeMetric === 'iucn_risk') {
      const iucn = bio.animal.iucnStatus;
      if (iucn === 'Critically Endangered' || iucn === 'Endangered') return 'rgba(239, 68, 68, 0.85)';
      if (iucn === 'Vulnerable') return 'rgba(245, 158, 11, 0.85)';
      return 'rgba(16, 185, 129, 0.85)';
    }

    if (activeMetric === 'biome') {
      const biome = bio.primaryBiome;
      if (biome.includes('Rainforest')) return 'rgba(4, 120, 87, 0.90)';
      if (biome.includes('Savanna')) return 'rgba(217, 119, 6, 0.85)';
      if (biome.includes('Desert')) return 'rgba(202, 138, 4, 0.85)';
      if (biome.includes('Taiga') || biome.includes('Boreal')) return 'rgba(2, 132, 199, 0.85)';
      return 'rgba(21, 128, 61, 0.85)';
    }

    const score = bio.biodiversityScore;
    if (score >= 90) return 'rgba(5, 150, 105, 0.95)';
    if (score >= 80) return 'rgba(16, 185, 129, 0.85)';
    if (score >= 65) return 'rgba(6, 182, 212, 0.80)';
    if (score >= 50) return 'rgba(245, 158, 11, 0.75)';
    return isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.6)';
  },

  getTooltipHtml: (country: CountrySpatialMetadata, data: any, _activeMetric: string, theme: 'dark' | 'light'): string => {
    const isDark = theme === 'dark';
    const name = country.countryName;
    const bio = data ?? getFloraFaunaDataForCountry(country.iso3);
    const iucnColor = bio.animal.iucnStatus.includes('Endangered') || bio.animal.iucnStatus.includes('Critically')
      ? '#ef4444'
      : bio.animal.iucnStatus === 'Vulnerable' ? '#f59e0b' : '#10b981';

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#065f46' : '#a7f3d0'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">${country.flagEmoji}</span>
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
          </div>
          ${bio.isMegadiverse ? `<span style="font-size: 10px; font-weight: 700; color: #34d399; font-family: monospace;">Rank #${bio.globalBiodiversityRank}</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'}; margin-bottom: 4px;">
          <span>${bio.animal.emoji}</span>
          <span>${bio.animal.commonName}</span>
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 4px;">
          ${bio.plant.emoji} ${bio.plant.commonName} • ${bio.primaryBiome}
        </div>
        <div style="font-size: 10px; font-weight: 700; color: ${iucnColor};">
          IUCN: ${bio.animal.iucnStatus}
        </div>
      </div>
    `;
  },

  getPinLabel: (country: CountrySpatialMetadata, data: any): { text: string; shortText: string } => {
    const bio = data ?? getFloraFaunaDataForCountry(country.iso3);
    return {
      text: `${bio.animal.emoji} ${country.countryName} (${bio.animal.commonName})`,
      shortText: bio.animal.emoji,
    };
  },

  renderInspector: (country: CountrySpatialMetadata, data: FloraFaunaData | undefined): InspectorWidget => {
    const safeData = data ?? getFloraFaunaDataForCountry(country.iso3);
    const iucn = safeData.animal.iucnStatus;

    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'stats',
      primaryValue: `${safeData.animal.emoji} ${safeData.animal.commonName}`,
      subtitle: `${safeData.animal.scientificName} • Bioma: ${safeData.primaryBiome}`,
      badge: {
        text: safeData.isMegadiverse
          ? `🌟 Megadiverse Rank #${safeData.globalBiodiversityRank}`
          : `🌿 Status: ${iucn}`,
        variant:
          iucn === 'Critically Endangered' || iucn === 'Endangered'
            ? 'danger'
            : iucn === 'Vulnerable'
              ? 'warning'
              : 'success',
      },
      statsGrid: [
        { 
          label: 'Satwa Ikonik / Nasional', 
          value: `${safeData.animal.emoji} ${safeData.animal.commonName}` 
        },
        { 
          label: 'Status IUCN Satwa', 
          value: safeData.animal.iucnStatus 
        },
        { 
          label: 'Bunga / Flora Khas', 
          value: `${safeData.plant.emoji} ${safeData.plant.commonName}` 
        },
        { 
          label: 'Bioma & Habitat', 
          value: safeData.primaryBiome 
        },
        { 
          label: 'Skor Keanekaragaman', 
          value: `${safeData.biodiversityScore} / 100 (Rank #${safeData.globalBiodiversityRank})` 
        },
        { 
          label: 'Hotspot Konservasi', 
          value: safeData.conservationHotspot ? '🔥 Prioritas Global' : 'Standar Regional' 
        },
      ],
    };
  },
};
