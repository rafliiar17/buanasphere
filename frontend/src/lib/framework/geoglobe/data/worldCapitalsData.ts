/**
 * Kurs World / GeoGlobe — World Capitals, Foundation & Independence Dataset (ADR 0039 & ADR 0047).
 * Decoupled pure JSON dataset for 195+ sovereign countries.
 */
import { EXTENDED_COUNTRIES_DATA } from '../countrySpatialData';
import { 
  type NationalAnthem, 
  CAPITAL_COORDINATES_MAP, 
  NATIONAL_ANTHEMS_MAP 
} from './worldCapitalsDetail';
import capitalDatasetJson from './capital_dataset.json';

export type { NationalAnthem };

export type HistoricalEra = 
  | 'ancient'              // Kuno / Sebelum 1800 (Kerajaan kuno, tanpa penjajahan modern)
  | '19th_century'         // Abad ke-19 (1800 - 1899)
  | 'post_ww1'             // Pasca-Perang Dunia I & Antar-Perang (1900 - 1944)
  | 'post_ww2'             // Pasca-Perang Dunia II & Kemerdekaan Awal (1945 - 1959)
  | 'decolonization'       // Gelombang Dekolonisasi Asia & Afrika (1960 - 1989)
  | 'modern_post_soviet';  // Era Pasca-Perang Dingin & Pembubaran Uni Soviet (1990+)

export type CapitalType =
  | 'Administrative'
  | 'Planned Capital'
  | 'Historic & Cultural'
  | 'Dual/Triple Capital';

export interface WorldCapitalData {
  iso3: string;
  countryName: string;
  capital: string;
  capitalType: CapitalType;
  capitalCoordinates?: { lat: number; lng: number };
  foundationDate: string;           // Tanggal resmi berdiri / terbentuknya entitas negara
  independenceDay: string;          // Hari Kemerdekaan resmi / Hari Nasional
  independenceYear: number;         // Tahun kemerdekaan (atau tahun berdirinya monarki/negara)
  nationalDayMonth: number;         // Bulan kalender (1 - 12)
  sovereigntyFrom: string;          // Pihak asal kedaulatan diperoleh / Penjajah sebelumnya
  historicalEra: HistoricalEra;
  eraLabel: string;
  nationalAnthem?: NationalAnthem;
  trivia: string;
}

export const WORLD_CAPITALS_DATASET: Record<string, WorldCapitalData> = 
  capitalDatasetJson as unknown as Record<string, WorldCapitalData>;

/**
 * Resolves capital city and historic foundation data for any ISO-3 code.
 * Falls back gracefully to spatial data if a specific historic entry is pending.
 */
export function getCapitalDataForCountry(iso3: string): WorldCapitalData {
  const code = iso3.toUpperCase();
  const custom = WORLD_CAPITALS_DATASET[code];
  const coords = CAPITAL_COORDINATES_MAP[code];
  const anthem = NATIONAL_ANTHEMS_MAP[code];

  if (custom) {
    return {
      ...custom,
      capitalCoordinates: custom.capitalCoordinates ?? coords,
      nationalAnthem: custom.nationalAnthem ?? anthem,
    };
  }

  const spatial = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === code);
  const cap = spatial?.capital || 'Ibukota Tidak Diketahui';
  const name = spatial?.countryName || code;
  const continent = spatial?.continent || 'Dunia';

  // Default fallback entry for any unlisted small island or territory
  return {
    iso3: code,
    countryName: name,
    capital: cap,
    capitalType: 'Administrative',
    capitalCoordinates: coords ?? (spatial ? { lat: spatial.lat, lng: spatial.lng } : undefined),
    foundationDate: 'Abad ke-20 Masehi',
    independenceDay: 'Hari Nasional Resmi',
    independenceYear: 1960,
    nationalDayMonth: 1,
    sovereigntyFrom: 'Kedaulatan Nasional Yang Diakui PBB',
    historicalEra: 'decolonization',
    eraLabel: 'Dekolonisasi & Kedaulatan Modern',
    nationalAnthem: anthem,
    trivia: `${cap} adalah pusat pemerintahan dan ibukota resmi dari negara ${name} di kawasan ${continent}.`,
  };
}
