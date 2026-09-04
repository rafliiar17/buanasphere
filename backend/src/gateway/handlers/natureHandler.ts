import type { MicroappHandler } from '../types.ts';
import type { Env } from '../../db/index.ts';
import floraFaunaRawData from '../data/flora_fauna_dataset.json';

export interface AnimalEmblem {
  commonName: string;
  scientificName: string;
  emoji: string;
  iucnStatus: string;
  category: string;
}

export interface PlantEmblem {
  commonName: string;
  scientificName: string;
  emoji: string;
  type: string;
  conservationStatus: string;
}

export interface CountryFloraFaunaRecord {
  iso3: string;
  nationalAnimal: AnimalEmblem;
  nationalBird: string;
  nationalFlower: PlantEmblem;
  conservationStatus: string;
  biodiversityScore: number;
  globalBiodiversityRank: number;
  primaryBiome: string;
  isMegadiverse: boolean;
  endemicSpeciesHighlights: string[];
  conservationHotspot: boolean;
}

export interface NatureCatalogResult {
  totalCountries: number;
  countries: CountryFloraFaunaRecord[];
  source: string;
}

function extractNationalBird(
  animal: AnimalEmblem,
  highlights: string[] = []
): string {
  if (animal.category.toLowerCase() === 'bird') {
    return animal.commonName;
  }
  const birdKeywords = [
    'eagle',
    'crane',
    'condor',
    'bird',
    'pheasant',
    'falcon',
    'peafowl',
    'robin',
    'toucan',
    'parrot',
    'macaw',
    'owl',
  ];
  const parts = animal.commonName.split('&').map((s) => s.trim());
  for (const part of parts) {
    if (birdKeywords.some((k) => part.toLowerCase().includes(k))) {
      return part;
    }
  }
  for (const h of highlights) {
    if (birdKeywords.some((k) => h.toLowerCase().includes(k))) {
      return h;
    }
  }
  return 'National Avian Species';
}

const parsedRecords: Record<string, CountryFloraFaunaRecord> = {};
const allCountryList: CountryFloraFaunaRecord[] = [];

for (const [iso3, raw] of Object.entries(
  floraFaunaRawData as Record<string, any>
)) {
  const animal = raw.animal || {
    commonName: 'Unknown Fauna',
    scientificName: 'N/A',
    emoji: '🐾',
    iucnStatus: 'Data Deficient',
    category: 'Wildlife',
  };
  const plant = raw.plant || {
    commonName: 'Unknown Flora',
    scientificName: 'N/A',
    emoji: '🌿',
    type: 'Flora',
    conservationStatus: 'Data Deficient',
  };
  const highlights = raw.endemicSpeciesHighlights || [];
  const nationalBird = extractNationalBird(animal, highlights);

  const record: CountryFloraFaunaRecord = {
    iso3,
    nationalAnimal: animal,
    nationalBird,
    nationalFlower: plant,
    conservationStatus: animal.iucnStatus || plant.conservationStatus || 'Protected',
    biodiversityScore: raw.biodiversityScore ?? 0,
    globalBiodiversityRank: raw.globalBiodiversityRank ?? 999,
    primaryBiome: raw.primaryBiome || 'Various',
    isMegadiverse: Boolean(raw.isMegadiverse),
    endemicSpeciesHighlights: highlights,
    conservationHotspot: Boolean(raw.conservationHotspot),
  };

  parsedRecords[iso3] = record;
  allCountryList.push(record);
}

// Sort by global biodiversity rank ascending
allCountryList.sort((a, b) => a.globalBiodiversityRank - b.globalBiodiversityRank);

export const natureHandler: MicroappHandler = {
  id: 'nature',
  name: 'Flora & Fauna National Emblems',
  description:
    'National animal, national bird, national flower, and conservation status per country ISO-3',
  version: '1.0.0',
  cacheTtlSeconds: 86400,
  async handle(
    params: Record<string, any> = {},
    _env?: Env
  ): Promise<CountryFloraFaunaRecord | NatureCatalogResult | { error: string; found: boolean }> {
    const rawIso = params.iso3 || params.country || params.code;

    if (rawIso) {
      const targetIso = String(rawIso).trim().toUpperCase();
      const record = parsedRecords[targetIso];

      if (!record) {
        return {
          error: `Country ISO-3 '${targetIso}' not found in flora & fauna database`,
          found: false,
        };
      }

      return {
        ...record,
        found: true,
      } as any;
    }

    return {
      totalCountries: allCountryList.length,
      countries: allCountryList,
      source: 'Flora & Fauna National Emblems',
    };
  },
};
