import { EXTENDED_COUNTRIES_DATA } from './countrySpatialData';
import { calculateLocalTime, isDaylight } from './geoMath';
import { 
  MEGADIVERSE_ISO3_LIST, 
  getFloraFaunaDataForCountry 
} from './data/floraFaunaData';
import { geoRegistry } from './appRegistry';

export type TimeFilterType = 'all' | 'working' | 'daylight' | 'night' | 'golden_hour';
export type FlightCorridorFilterType = 'all' | 'mideast' | 'asean' | 'eastasia' | 'west';
export type PassportVisaFilterType = 'all' | 'free' | 'voa' | 'required';
export type NatureFilterType = 'all' | 'megadiverse' | 'endangered' | 'rainforest' | 'endemic';

export const FLIGHT_CORRIDOR_REGIONS: Record<FlightCorridorFilterType, string[]> = {
  all: ['SAU', 'MYS', 'TWN', 'HKG', 'SGP', 'JPN', 'USA', 'KOR', 'ARE', 'AUS', 'IDN'],
  mideast: ['SAU', 'ARE', 'QAT', 'KWT', 'OMN', 'BHR', 'IDN'],
  asean: ['MYS', 'SGP', 'BRN', 'THA', 'PHL', 'IDN'],
  eastasia: ['TWN', 'HKG', 'JPN', 'KOR', 'CHN', 'IDN'],
  west: ['USA', 'AUS', 'CAN', 'GBR', 'IDN'],
};

export const PASSPORT_ENTRY_STATUS_MAP: Record<string, 'Visa Free' | 'Visa on Arrival' | 'eVisa' | 'Visa Required'> = {
  SGP: 'Visa Free',
  JPN: 'Visa Free',
  DEU: 'Visa Required',
  FRA: 'Visa Required',
  ITA: 'Visa Required',
  ESP: 'Visa Required',
  KOR: 'Visa Free',
  GBR: 'Visa Required',
  USA: 'Visa Required',
  MYS: 'Visa Free',
  ARE: 'eVisa',
  BRN: 'Visa Free',
  THA: 'Visa Free',
  IDN: 'Visa Free',
  PHL: 'Visa Free',
  VNM: 'Visa Free',
  IND: 'Visa on Arrival',
  CHN: 'Visa Required',
  SAU: 'eVisa',
  TUR: 'Visa Free',
  KHM: 'Visa Free',
  LAO: 'Visa Free',
  MMR: 'Visa Free',
  TLS: 'Visa on Arrival',
  QAT: 'Visa on Arrival',
  MDV: 'Visa on Arrival',
  NPL: 'Visa on Arrival',
  JOR: 'Visa on Arrival',
  EGY: 'Visa on Arrival',
  MAR: 'Visa Free',
  CHL: 'Visa Free',
  BRA: 'Visa Free',
  COL: 'Visa Free',
  PER: 'Visa Free',
  ECU: 'Visa Free',
};

/**
 * Validates if country matches the TimeWorld filter
 */
export function isCountryMatchingTimeFilter(iso3: string, filter: TimeFilterType, dateOrHour: Date | number = new Date()): boolean {
  if (filter === 'all') return true;
  const spatial = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === iso3);
  if (!spatial) return false;

  let localHours = 0;
  if (typeof dateOrHour === 'number') {
    localHours = dateOrHour;
  } else {
    const local = calculateLocalTime(dateOrHour, spatial.utcOffset);
    localHours = local.hours + local.minutes / 60;
  }

  const isDay = isDaylight(Math.floor(localHours));
  const isWorking = localHours >= 9 && localHours < 17;
  const isGolden = (localHours >= 4.5 && localHours < 6.5) || (localHours >= 17.5 && localHours < 19.0);

  switch (filter) {
    case 'working':
      return isWorking;
    case 'daylight':
      return isDay;
    case 'night':
      return !isDay;
    case 'golden_hour':
      return isGolden;
    default:
      return true;
  }
}

/**
 * Validates if country matches the Flight Corridors filter
 */
export function isCountryMatchingFlightFilter(iso3: string, filter: FlightCorridorFilterType): boolean {
  if (filter === 'all') return FLIGHT_CORRIDOR_REGIONS.all.includes(iso3);
  const regionList = FLIGHT_CORRIDOR_REGIONS[filter] || [];
  return regionList.includes(iso3);
}

/**
 * Validates if country matches the Passport World visa filter
 */
export function isCountryMatchingPassportFilter(iso3: string, filter: PassportVisaFilterType): boolean {
  if (filter === 'all') return true;
  const status = PASSPORT_ENTRY_STATUS_MAP[iso3] || 'Visa Required';

  switch (filter) {
    case 'free':
      return status === 'Visa Free';
    case 'voa':
      return status === 'Visa on Arrival' || status === 'eVisa';
    case 'required':
      return status === 'Visa Required';
    default:
      return true;
  }
}

/**
 * Validates if country matches the Nature World (Flora & Fauna) filter (ADR 0034)
 */
export function isCountryMatchingNatureFilter(iso3: string, filter: NatureFilterType): boolean {
  if (filter === 'all') return true;
  const data = getFloraFaunaDataForCountry(iso3);

  switch (filter) {
    case 'megadiverse':
      return data.isMegadiverse || MEGADIVERSE_ISO3_LIST.includes(iso3);
    case 'endangered':
      return (
        data.animal.iucnStatus === 'Critically Endangered' ||
        data.animal.iucnStatus === 'Endangered' ||
        data.plant.conservationStatus.toLowerCase().includes('endangered')
      );
    case 'rainforest':
      return data.primaryBiome === 'Tropical Rainforest';
    case 'endemic':
      return (
        data.endemicSpeciesHighlights.length > 0 &&
        (data.isMegadiverse || ['MDG', 'AUS', 'NZL', 'IDN', 'ECU', 'PER'].includes(iso3))
      );
    default:
      return true;
  }
}

/**
 * Universal matcher across any active app
 */
export function isCountryMatchingAppFilter(
  iso3: string,
  appId: string,
  filters: {
    timeFilter?: TimeFilterType;
    flightFilter?: FlightCorridorFilterType;
    passportFilter?: PassportVisaFilterType;
    natureFilter?: NatureFilterType;
    customFilter?: unknown;
    appData?: Record<string, any>;
    region?: string;
  } = {}
): boolean {
  const plugin = geoRegistry.getApp(appId);
  if (plugin?.filterPredicate && filters.customFilter !== undefined) {
    const data = filters.appData?.[iso3] ?? geoRegistry.getAppData(appId)?.[iso3];
    const spatial = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === iso3);
    return plugin.filterPredicate(iso3, filters.customFilter, data, spatial);
  }

  if (appId === 'world-time') {
    return isCountryMatchingTimeFilter(iso3, filters.timeFilter || 'all');
  }
  if (appId === 'remittance-flow') {
    return isCountryMatchingFlightFilter(iso3, filters.flightFilter || 'all');
  }
  if (appId === 'passport-power') {
    return isCountryMatchingPassportFilter(iso3, filters.passportFilter || 'all');
  }
  if (appId === 'flora-fauna') {
    return isCountryMatchingNatureFilter(iso3, filters.natureFilter || 'all');
  }
  // fx-rates
  if (filters.region && filters.region !== 'all') {
    const spatial = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === iso3);
    return spatial?.region.toLowerCase() === filters.region.toLowerCase();
  }
  return true;
}
