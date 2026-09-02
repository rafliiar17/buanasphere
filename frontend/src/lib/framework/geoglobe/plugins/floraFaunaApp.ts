import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';
import { 
  type FloraFaunaData, 
  getFloraFaunaDataForCountry, 
  FLORA_FAUNA_DATASET 
} from '../data/floraFaunaData';

export const floraFaunaApp: GeoAppPlugin<FloraFaunaData> = {
  id: 'flora-fauna',
  name: 'Nature World',
  tagline: 'Peta Keanekaragaman Hayati, Satwa Ikonik & Flora Global',
  icon: 'Trees',
  category: 'nature',
  defaultMetricId: 'biodiversity',
  metrics: [
    {
      id: 'biodiversity',
      label: 'Indeks Keanekaragaman Hayati (Biodiversity Score)',
      unit: 'Poin',
      formatValue: (val: unknown) => `${val} Poin Keanekaragaman`,
      colorScale: (normalized: number, raw?: unknown) => {
        const score = Number(raw ?? 60);
        if (score >= 90) return '#059669'; // Deep Lush Emerald (Megadiverse)
        if (score >= 80) return '#10b981'; // Vibrant Green
        if (score >= 65) return '#06b6d4'; // Cyan
        if (score >= 50) return '#eab308'; // Amber
        return '#64748b'; // Muted Slate
      },
    },
    {
      id: 'iucn_risk',
      label: 'Status Konservasi Satwa (IUCN Red List Alert)',
      unit: 'Status',
      formatValue: (val: unknown) => `${val}`,
      colorScale: (normalized: number, raw?: unknown) => {
        const status = String(raw ?? 'Least Concern');
        if (status.includes('Critically')) return '#ef4444'; // Red (Kritis)
        if (status.includes('Endangered')) return '#f97316'; // Orange (Terancam)
        if (status.includes('Vulnerable')) return '#eab308'; // Yellow (Rentan)
        if (status.includes('Near')) return '#38bdf8'; // Sky Blue (Hampir Terancam)
        return '#10b981'; // Green (Risiko Rendah / Aman)
      },
    },
    {
      id: 'biome',
      label: 'Bioma & Habitat Dominan',
      unit: 'Bioma',
      formatValue: (val: unknown) => `${val}`,
      colorScale: (normalized: number, raw?: unknown) => {
        const biome = String(raw ?? 'Temperate Forest');
        if (biome.includes('Rainforest')) return '#047857'; // Deep Rainforest Green
        if (biome.includes('Savanna')) return '#d97706'; // Amber Savanna
        if (biome.includes('Desert')) return '#ca8a04'; // Desert Gold
        if (biome.includes('Taiga') || biome.includes('Boreal')) return '#0284c7'; // Boreal Blue
        if (biome.includes('Tundra')) return '#93c5fd'; // Ice Tundra
        return '#15803d'; // Standard Forest
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

  renderInspector: (country: CountrySpatialMetadata, data: FloraFaunaData): InspectorWidget => {
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
