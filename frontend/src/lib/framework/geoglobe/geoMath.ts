import type { GeoArc } from './types';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function calculateLocalTime(
  utcDate: Date,
  utcOffset: number
): {
  hours: number;
  minutes: number;
  formatted: string;
  isNextDay: boolean;
  isPrevDay: boolean;
} {
  const utcHours = utcDate.getUTCHours();
  const utcMinutes = utcDate.getUTCMinutes();

  const totalMinutes = utcHours * 60 + utcMinutes + Math.round(utcOffset * 60);
  let normalizedMinutes = (totalMinutes % 1440 + 1440) % 1440;

  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return {
    hours,
    minutes,
    formatted,
    isNextDay: totalMinutes >= 1440,
    isPrevDay: totalMinutes < 0,
  };
}

export function isDaylight(localHour: number): boolean {
  return localHour >= 6 && localHour < 18;
}

export function formatUtcOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - hours) * 60);
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function generateGreatCircleArc(
  origin: { lat: number; lng: number; label?: string },
  destination: { lat: number; lng: number; label?: string },
  options?: {
    color?: string | string[];
    altitude?: number;
    stroke?: number;
    dashLength?: number;
    dashGap?: number;
    dashAnimateTime?: number;
    label?: string;
  }
): GeoArc {
  return {
    startLat: origin.lat,
    startLng: origin.lng,
    endLat: destination.lat,
    endLng: destination.lng,
    color: options?.color ?? ['#06b6d4', '#10b981'],
    altitude: options?.altitude ?? 0.35,
    stroke: options?.stroke ?? 1.5,
    dashLength: options?.dashLength ?? 0.4,
    dashGap: options?.dashGap ?? 0.2,
    dashAnimateTime: options?.dashAnimateTime ?? 2500,
    label: options?.label ?? `${origin.label ?? ''} ➔ ${destination.label ?? ''}`,
  };
}
