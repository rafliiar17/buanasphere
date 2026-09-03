/**
 * Kurs World / GeoGlobe — Comprehensive Global Biodiversity Dataset (ADR 0034 / ADR 0047).
 * Covers 195+ Sovereign States & Territories with iconic wildlife, national flora,
 * IUCN conservation status, biomes, and megadiversity rankings.
 * Data decoupled into flora_fauna_dataset.json for modular loading.
 */

import floraFaunaRaw from './flora_fauna_dataset.json';

export interface FloraFaunaData {
  animal: {
    commonName: string;
    scientificName: string;
    emoji: string;
    iucnStatus: 'Critically Endangered' | 'Endangered' | 'Vulnerable' | 'Near Threatened' | 'Least Concern';
    category: 'Mammal' | 'Reptile' | 'Bird' | 'Amphibian' | 'Marine' | 'Insect';
  };
  plant: {
    commonName: string;
    scientificName: string;
    emoji: string;
    type: 'Flower' | 'Tree' | 'Medicinal' | 'Carnivorous' | 'Fern';
    conservationStatus: string;
  };
  biodiversityScore: number; // 0 - 100
  globalBiodiversityRank: number; // #1 Brazil, #2 Colombia, #3 Indonesia, etc.
  primaryBiome: 'Tropical Rainforest' | 'Savanna' | 'Temperate Forest' | 'Boreal / Taiga' | 'Desert' | 'Mediterranean' | 'Tundra' | 'Marine & Coral';
  isMegadiverse: boolean;
  endemicSpeciesHighlights: string[];
  conservationHotspot: boolean;
}

/**
 * 17 Globally Recognized Megadiverse Countries (UNEP-WCMC)
 */
export const MEGADIVERSE_ISO3_LIST: string[] = [
  'BRA', // #1 Brazil
  'COL', // #2 Colombia
  'IDN', // #3 Indonesia
  'CHN', // #4 China
  'MEX', // #5 Mexico
  'PER', // #6 Peru
  'AUS', // #7 Australia
  'IND', // #8 India
  'ECU', // #9 Ecuador
  'VEN', // #10 Venezuela
  'USA', // #11 United States
  'MDG', // #12 Madagascar
  'COD', // #13 DR Congo
  'ZAF', // #14 South Africa
  'MYS', // #15 Malaysia
  'PNG', // #16 Papua New Guinea
  'PHL', // #17 Philippines
];

/**
 * Comprehensive Biodiversity Records for Key Sovereign States & Territories
 * Loaded from decoupled JSON dataset (ADR 0047).
 */
export const FLORA_FAUNA_DATASET: Record<string, Partial<FloraFaunaData>> = floraFaunaRaw as unknown as Record<string, Partial<FloraFaunaData>>;

/**
 * Procedural Fallback Generator for Countries not specifically hardcoded
 */
export function getFloraFaunaDataForCountry(iso3: string): FloraFaunaData {
  const custom = FLORA_FAUNA_DATASET[iso3];
  if (custom && custom.animal && custom.plant) {
    return {
      animal: custom.animal as FloraFaunaData['animal'],
      plant: custom.plant as FloraFaunaData['plant'],
      biodiversityScore: custom.biodiversityScore ?? 65,
      globalBiodiversityRank: custom.globalBiodiversityRank ?? 50,
      primaryBiome: custom.primaryBiome ?? 'Temperate Forest',
      isMegadiverse: custom.isMegadiverse ?? MEGADIVERSE_ISO3_LIST.includes(iso3),
      endemicSpeciesHighlights: custom.endemicSpeciesHighlights ?? ['Satwa Liar Lokal', 'Flora Endemik Wilayah'],
      conservationHotspot: custom.conservationHotspot ?? false,
    };
  }

  const isMega = MEGADIVERSE_ISO3_LIST.includes(iso3);

  return {
    animal: {
      commonName: 'Fauna Asli Wilayah',
      scientificName: 'Fauna indigena',
      emoji: isMega ? '🐆' : '🦅',
      iucnStatus: isMega ? 'Vulnerable' : 'Least Concern',
      category: 'Mammal',
    },
    plant: {
      commonName: 'Flora & Bunga Nasional',
      scientificName: 'Flora nationalis',
      emoji: isMega ? '🌺' : '🌿',
      type: 'Flower',
      conservationStatus: 'Protected',
    },
    biodiversityScore: isMega ? 88 : Math.max(45, Math.min(85, Math.round(55 + (iso3.charCodeAt(0) % 30)))),
    globalBiodiversityRank: isMega ? 15 : Math.max(20, Math.min(150, Math.round(40 + (iso3.charCodeAt(1) % 100)))),
    primaryBiome: isMega ? 'Tropical Rainforest' : 'Temperate Forest',
    isMegadiverse: isMega,
    endemicSpeciesHighlights: isMega ? ['Spesies Endemik Tropis', 'Satwa Langka Konservasi'] : ['Fauna Asli Terlindungi'],
    conservationHotspot: isMega,
  };
}
