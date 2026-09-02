import { EXTENDED_COUNTRIES_DATA } from './countrySpatialData';
import { calculateLocalTime, isDaylight } from './geoMath';

export type TimeFilterType = 'all' | 'working' | 'daylight' | 'night';
export type FlightCorridorFilterType = 'all' | 'mideast' | 'asean' | 'eastasia' | 'west';
export type PassportVisaFilterType = 'all' | 'free' | 'voa' | 'required';

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
export function isCountryMatchingTimeFilter(iso3: string, filter: TimeFilterType, date: Date = new Date()): boolean {
  if (filter === 'all') return true;
  const spatial = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === iso3);
  if (!spatial) return false;

  const local = calculateLocalTime(date, spatial.utcOffset);
  const isDay = isDaylight(local.hours);
  const isWorking = local.hours >= 9 && local.hours < 17;

  switch (filter) {
    case 'working':
      return isWorking;
    case 'daylight':
      return isDay;
    case 'night':
      return !isDay;
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
 * Universal matcher across any active app
 */
export function isCountryMatchingAppFilter(
  iso3: string,
  appId: string,
  filters: {
    timeFilter?: TimeFilterType;
    flightFilter?: FlightCorridorFilterType;
    passportFilter?: PassportVisaFilterType;
    region?: string;
  } = {}
): boolean {
  if (appId === 'world-time') {
    return isCountryMatchingTimeFilter(iso3, filters.timeFilter || 'all');
  }
  if (appId === 'remittance-flow') {
    return isCountryMatchingFlightFilter(iso3, filters.flightFilter || 'all');
  }
  if (appId === 'passport-power') {
    return isCountryMatchingPassportFilter(iso3, filters.passportFilter || 'all');
  }
  // fx-rates
  if (filters.region && filters.region !== 'all') {
    const spatial = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === iso3);
    return spatial?.region.toLowerCase() === filters.region.toLowerCase();
  }
  return true;
}
