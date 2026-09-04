import type { MicroappHandler } from '../types.ts';
import type { Env } from '../../db/index.ts';

export const MAJOR_TIMEZONE_OFFSETS: Record<string, number> = {
  UTC: 0,
  GMT: 0,
  WIB: 7,
  WITA: 8,
  WIT: 9,
  SGT: 8,
  JST: 9,
  KST: 9,
  CST_CHINA: 8,
  IST: 5.5,
  GST: 4,
  MSK: 3,
  EET: 2,
  CET: 1,
  CEST: 2,
  BST: 1,
  AEST: 10,
  AEDT: 11,
  NZST: 12,
  EST: -5,
  EDT: -4,
  CST_US: -6,
  CDT_US: -5,
  MST: -7,
  MDT: -6,
  PST: -8,
  PDT: -7,
  AKST: -9,
  HST: -10,
};

export interface SubsolarCoordinates {
  latitude: number;
  longitude: number;
  declinationDeg: number;
  equationOfTimeMinutes: number;
}

/**
 * Calculates solar declination and subsolar latitude & longitude coordinates.
 * Utilizes Spencer (1971) solar declination and equation-of-time algorithms.
 */
export function calculateSubsolarPoint(date: Date = new Date()): SubsolarCoordinates {
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffMs = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  // Fractional year in radians
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (utcHours - 12) / 24);

  // Equation of time in minutes (Spencer 1971)
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination in radians (Spencer 1971)
  const declRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const declDeg = Number(((declRad * 180) / Math.PI).toFixed(4));

  // Subsolar longitude in degrees:
  // Earth rotates 15 degrees per hour. Solar noon occurs at Greenwich when (utcHours + eqtime / 60) = 12.
  let subsolarLon = (12 - (utcHours + eqtime / 60)) * 15;
  while (subsolarLon > 180) subsolarLon -= 360;
  while (subsolarLon < -180) subsolarLon += 360;
  subsolarLon = Number(subsolarLon.toFixed(4));

  return {
    latitude: declDeg,
    longitude: subsolarLon,
    declinationDeg: declDeg,
    equationOfTimeMinutes: Number(eqtime.toFixed(2)),
  };
}

export function formatTimeWithOffset(
  date: Date,
  offsetHours: number
): {
  localHours: number;
  localMinutes: number;
  formatted: string;
  isDaylight: boolean;
} {
  const totalMinutes =
    date.getUTCHours() * 60 + date.getUTCMinutes() + Math.round(offsetHours * 60);
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const localHours = Math.floor(normalizedMinutes / 60);
  const localMinutes = normalizedMinutes % 60;
  const formatted = `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;
  const isDaylight = localHours >= 6 && localHours < 18;

  return {
    localHours,
    localMinutes,
    formatted,
    isDaylight,
  };
}

export interface TimeHandlerResult {
  utc: string;
  unixTimestampMs: number;
  unixTimestampSec: number;
  dayOfYear: number;
  year: number;
  subsolarPoint: SubsolarCoordinates;
  timezoneOffsets: Record<string, number>;
  source: string;
}

export const timeHandler: MicroappHandler = {
  id: 'time',
  name: 'World Time & Solar Position',
  description:
    'Live server UTC time, ISO 8601 string, UNIX timestamp in ms, solar subsolar point calculation, and timezone offset helpers',
  version: '1.0.0',
  cacheTtlSeconds: 10,
  async handle(
    params: Record<string, any> = {},
    _env?: Env
  ): Promise<TimeHandlerResult> {
    const rawTimestamp = params.timestamp ?? params.time;
    let targetDate = new Date();

    if (rawTimestamp !== undefined && rawTimestamp !== null) {
      if (typeof rawTimestamp === 'number') {
        targetDate = new Date(rawTimestamp);
      } else if (typeof rawTimestamp === 'string') {
        const parsed = Number(rawTimestamp);
        targetDate = isNaN(parsed) ? new Date(rawTimestamp) : new Date(parsed);
      }
    }

    const startOfYear = new Date(Date.UTC(targetDate.getUTCFullYear(), 0, 1));
    const dayOfYear =
      Math.floor((targetDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    const subsolar = calculateSubsolarPoint(targetDate);

    return {
      utc: targetDate.toISOString(),
      unixTimestampMs: targetDate.getTime(),
      unixTimestampSec: Math.floor(targetDate.getTime() / 1000),
      dayOfYear,
      year: targetDate.getUTCFullYear(),
      subsolarPoint: subsolar,
      timezoneOffsets: MAJOR_TIMEZONE_OFFSETS,
      source: 'World Time & Solar Position',
    };
  },
};
