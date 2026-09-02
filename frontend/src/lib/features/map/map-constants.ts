import { COUNTRY_CURRENCY_LIST, type Region } from './country-mapping';
import { BASE_RATES_IDR } from '../../api/client';

export type MetricType = 'rate' | 'change' | 'flag';
export type RegionId = 'all' | 'asean' | 'east_asia' | 'europe' | 'americas' | 'middle_east' | 'africa' | 'oceania';

export interface RegionFilter {
  id: RegionId;
  label: string;
  emoji: string;
  lon: number;
  lat: number;
  zoom: number;
  iso3List?: string[];
}

export interface MapCountryData {
  iso3: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  flag: string;
  regionId: RegionId;
  regionLabel: string;
  buyRate: number;
  sellRate: number;
  middleRate: number;
  spread: number;
  spreadPercent: number;
  change24h: number;
  rateType?: string;
  isEurozone?: boolean;
}

// Region Definitions (195+ Countries Coverage across all major world economic zones)
export const REGION_FILTERS: readonly RegionFilter[] = [
  { id: 'all', label: 'Global (195+ Negara)', emoji: '🌏', lon: 0, lat: 20, zoom: 1 },
  { id: 'asean', label: 'ASEAN', emoji: '🌴', lon: 115, lat: 5, zoom: 3.5, iso3List: ['IDN', 'SGP', 'MYS', 'THA', 'PHL', 'VNM', 'BRN', 'KHM', 'LAO', 'MMR'] },
  { id: 'east_asia', label: 'Asia Timur & Selatan', emoji: '🏯', lon: 125, lat: 35, zoom: 3.0, iso3List: ['JPN', 'CHN', 'HKG', 'KOR', 'TWN', 'IND', 'PAK', 'BGD', 'LKA', 'NPL', 'MNG'] },
  { id: 'europe', label: 'Eropa', emoji: '🏰', lon: 15, lat: 52, zoom: 2.8, iso3List: ['DEU', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL', 'AUT', 'PRT', 'IRL', 'FIN', 'GBR', 'CHE', 'SWE', 'NOR', 'DNK', 'TUR', 'POL', 'CZE', 'GRC'] },
  { id: 'americas', label: 'Amerika', emoji: '🗽', lon: -80, lat: 10, zoom: 1.8, iso3List: ['USA', 'CAN', 'BRA', 'MEX', 'ARG', 'CHL', 'COL', 'PER', 'VEN', 'ECU', 'URY', 'PRY', 'BOL', 'PAN', 'CRI'] },
  { id: 'middle_east', label: 'Timur Tengah', emoji: '🕌', lon: 48, lat: 26, zoom: 3.8, iso3List: ['SAU', 'ARE', 'QAT', 'KWT', 'OMN', 'BHR', 'JOR', 'LBN', 'IRQ', 'ISR', 'IRN', 'YEM'] },
  { id: 'africa', label: 'Afrika', emoji: '🌍', lon: 20, lat: 0, zoom: 2.2, iso3List: ['ZAF', 'EGY', 'NGA', 'KEN', 'MAR', 'DZA', 'TUN', 'ETH', 'TZA', 'UGA', 'GHA', 'CIV', 'SEN', 'CMR', 'AGO', 'MOZ'] },
  { id: 'oceania', label: 'Oceania', emoji: '🦘', lon: 145, lat: -28, zoom: 2.8, iso3List: ['AUS', 'NZL', 'FJI', 'PNG', 'SLB', 'VUT', 'WSM', 'TON'] },
];

function getRegionId(region: Region, iso3: string): RegionId {
  if (['IDN', 'SGP', 'MYS', 'THA', 'PHL', 'VNM', 'BRN', 'KHM', 'LAO', 'MMR'].includes(iso3)) {
    return 'asean';
  }
  switch (region) {
    case 'Asia':
      return 'east_asia';
    case 'Middle East':
      return 'middle_east';
    case 'Europe':
      return 'europe';
    case 'Americas':
      return 'americas';
    case 'Oceania':
      return 'oceania';
    case 'Africa':
      return 'africa';
    default:
      return 'all';
  }
}

function getRegionLabel(regionId: RegionId): string {
  switch (regionId) {
    case 'asean': return 'ASEAN';
    case 'east_asia': return 'Asia Timur & Selatan';
    case 'middle_east': return 'Timur Tengah';
    case 'europe': return 'Eropa';
    case 'americas': return 'Amerika';
    case 'oceania': return 'Oceania';
    case 'africa': return 'Afrika';
    default: return 'Global';
  }
}

// Map entries generated directly from the global 201 countries dataset
export const COUNTRY_CURRENCY_MAP: Array<{
  iso3: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  flag: string;
  regionId: RegionId;
  regionLabel: string;
  isEurozone?: boolean;
  defaultRate: { buy: number; sell: number; mid: number; change: number };
}> = COUNTRY_CURRENCY_LIST.map((entry) => {
  const regId = getRegionId(entry.region, entry.iso3);
  const regLabel = getRegionLabel(regId);
  const baseRate = BASE_RATES_IDR[entry.currencyCode] || { buy: 17730, sell: 17790, mid: 17765, change: 0 };
  
  return {
    iso3: entry.iso3,
    countryName: entry.countryName,
    currencyCode: entry.currencyCode,
    currencyName: entry.currencyName,
    flag: entry.flagEmoji,
    regionId: regId,
    regionLabel: regLabel,
    isEurozone: entry.currencyCode === 'EUR',
    defaultRate: baseRate,
  };
});

export const PRESET_AMOUNTS = [1, 10, 50, 100, 500, 1000];

