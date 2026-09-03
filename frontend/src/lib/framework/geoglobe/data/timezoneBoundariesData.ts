import rawTimezoneData from './timezone_boundaries_dataset.json';

export interface TimezoneBoundarySegment {
  o: number;
  c: Array<[number, number]>;
  utcOffset: number;
  coords: Array<[number, number]>;
  id?: string;
  name?: string;
  isIndonesianBoundary?: boolean;
  isDateLine?: boolean;
}

export const TIMEZONE_BOUNDARIES: TimezoneBoundarySegment[] = (rawTimezoneData as Array<{ o: number; c: Array<[number, number]> }>).map((seg, idx) => {
  const isIndo = (seg.o === 7 || seg.o === 8 || seg.o === 9) && seg.c.some(([lat, lng]) => lat >= -11 && lat <= 7 && lng >= 95 && lng <= 142);
  const isDateLine = seg.o === 12 || seg.o === -12 || seg.o === 13 || seg.o === 14 || seg.c.some(([, lng]) => Math.abs(lng) >= 168);
  return {
    o: seg.o,
    c: seg.c,
    utcOffset: seg.o,
    coords: seg.c,
    id: `tz-seg-${idx}-utc${seg.o >= 0 ? '+' : ''}${seg.o}`,
    name: seg.o === 7 ? 'WIB (UTC+7)' : seg.o === 8 ? 'WITA (UTC+8)' : seg.o === 9 ? 'WIT (UTC+9)' : `UTC${seg.o >= 0 ? '+' : ''}${seg.o}`,
    isIndonesianBoundary: isIndo,
    isDateLine,
  };
});

export function getTimezoneBoundariesByOffset(offset: number): TimezoneBoundarySegment[] {
  return TIMEZONE_BOUNDARIES.filter((seg) => seg.o === offset);
}

export function getSpecialTimezoneBoundaries(): {
  wibWita: TimezoneBoundarySegment[];
  witaWit: TimezoneBoundarySegment[];
  idl: TimezoneBoundarySegment[];
} {
  const wibWita = TIMEZONE_BOUNDARIES.filter((seg) => {
    if (seg.o !== 7 && seg.o !== 8) return false;
    return seg.c.some(([lat, lng]) => lat >= -11 && lat <= 7 && lng >= 109 && lng <= 120);
  });

  const witaWit = TIMEZONE_BOUNDARIES.filter((seg) => {
    if (seg.o !== 8 && seg.o !== 9) return false;
    return seg.c.some(([lat, lng]) => lat >= -11 && lat <= 7 && lng >= 120 && lng <= 142);
  });

  const idl = TIMEZONE_BOUNDARIES.filter((seg) => {
    const o = seg.o;
    if (o === 12 || o === -12 || o === 13 || o === 14 || o === 12.75) return true;
    return seg.c.some(([, lng]) => Math.abs(lng) >= 168);
  });

  return { wibWita, witaWit, idl };
}
