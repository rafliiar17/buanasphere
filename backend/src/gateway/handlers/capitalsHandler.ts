import type { MicroappHandler } from '../types.ts';
import type { Env } from '../../db/index.ts';
import capitalRawData from '../data/capital_dataset.json';

export interface NationalAnthemInfo {
  title: string;
  composer: string;
  adoptedYear?: number;
  audioUrl?: string;
}

export interface CapitalCityRecord {
  iso3: string;
  countryName: string;
  capital: string;
  capitalType?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  elevationMeters: number;
  nationalAnthem: NationalAnthemInfo;
  foundationDate?: string;
  independenceDay?: string;
  independenceYear?: number;
  trivia?: string;
}

export interface CapitalsListResult {
  totalCapitals: number;
  capitals: CapitalCityRecord[];
  source: string;
}

/**
 * Standard elevation table for world capitals (meters above sea level).
 */
const CAPITAL_ELEVATIONS: Record<string, number> = {
  IDN: 8,     // Jakarta
  SGP: 15,    // Singapore
  MYS: 66,    // Kuala Lumpur
  JPN: 44,    // Tokyo
  USA: 12,    // Washington, D.C.
  CHN: 43,    // Beijing
  GBR: 11,    // London
  FRA: 35,    // Paris
  DEU: 34,    // Berlin
  AUS: 580,   // Canberra
  CHE: 540,   // Bern
  SAU: 612,   // Riyadh
  KOR: 38,    // Seoul
  THA: 2,     // Bangkok
  PHL: 7,     // Manila
  VNM: 25,    // Hanoi
  IND: 216,   // New Delhi
  BRA: 1172,  // Brasilia
  CAN: 70,    // Ottawa
  EGY: 23,    // Cairo
  ZAF: 1339,  // Pretoria
  RUS: 156,   // Moscow
  ITA: 20,    // Rome
  ESP: 667,   // Madrid
  NLD: -2,    // Amsterdam
  BOL: 3640,  // La Paz
  ECU: 2850,  // Quito
  COL: 2640,  // Bogota
  ETH: 2355,  // Addis Ababa
  BTN: 2334,  // Thimphu
  MEX: 2240,  // Mexico City
  AFG: 1790,  // Kabul
  KEN: 1661,  // Nairobi
  NPL: 1400,  // Kathmandu
  TUR: 938,   // Ankara
  IRN: 1189,  // Tehran
  NZL: 20,    // Wellington
  ARG: 25,    // Buenos Aires
  CHL: 570,   // Santiago
  PER: 161,   // Lima
};

const capitalRecords: Record<string, CapitalCityRecord> = {};
const allCapitalsList: CapitalCityRecord[] = [];

for (const [iso3, raw] of Object.entries(capitalRawData as Record<string, any>)) {
  const coords = raw.capitalCoordinates || { lat: 0, lng: 0 };
  const elevation = CAPITAL_ELEVATIONS[iso3] ?? (Math.abs(coords.lat) > 30 ? 120 : 45);

  const anthem: NationalAnthemInfo = raw.nationalAnthem || {
    title: 'National Anthem',
    composer: 'Unknown',
  };

  const record: CapitalCityRecord = {
    iso3,
    countryName: raw.countryName || iso3,
    capital: raw.capital || 'N/A',
    capitalType: raw.capitalType,
    coordinates: {
      lat: coords.lat,
      lng: coords.lng,
    },
    elevationMeters: elevation,
    nationalAnthem: anthem,
    foundationDate: raw.foundationDate,
    independenceDay: raw.independenceDay,
    independenceYear: raw.independenceYear,
    trivia: raw.trivia,
  };

  capitalRecords[iso3] = record;
  allCapitalsList.push(record);
}

// Sort alphabetically by country name
allCapitalsList.sort((a, b) => a.countryName.localeCompare(b.countryName));

export const capitalsHandler: MicroappHandler = {
  id: 'capitals',
  name: 'World Capitals & National Anthems',
  description:
    'Capital city name, latitude, longitude, elevation, and national anthem info per country ISO-3',
  version: '1.0.0',
  cacheTtlSeconds: 86400,
  async handle(
    params: Record<string, any> = {},
    _env?: Env
  ): Promise<CapitalCityRecord | CapitalsListResult | { error: string; found: boolean }> {
    const rawIso = params.iso3 || params.country || params.code;

    if (rawIso) {
      const targetIso = String(rawIso).trim().toUpperCase();
      const record = capitalRecords[targetIso];

      if (!record) {
        return {
          error: `Country ISO-3 '${targetIso}' not found in world capitals database`,
          found: false,
        };
      }

      return {
        ...record,
        found: true,
      } as any;
    }

    return {
      totalCapitals: allCapitalsList.length,
      capitals: allCapitalsList,
      source: 'World Capitals & National Anthems',
    };
  },
};
