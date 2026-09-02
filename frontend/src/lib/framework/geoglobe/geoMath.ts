import type { GeoArc } from './types';

export type DiurnalPhaseId =
  | 'deep_night'
  | 'dawn'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'sunset'
  | 'dusk'
  | 'night';

export interface DiurnalPhaseInfo {
  phaseId: DiurnalPhaseId;
  label: string;
  emoji: string;
  description: string;
  isDaylight: boolean;
  isGoldenHour: boolean;
  isWorkingHours: boolean;
  colorHex: string;
  colorRgba: string;
}

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

/**
 * 8-Phase Diurnal Solar Model (ADR 0037)
 * Calculates the solar time phase, emoji, Indonesian label, and color.
 */
export function getDiurnalPhase(hours: number, minutes: number = 0): DiurnalPhaseInfo {
  const fractional = (hours % 24) + minutes / 60;
  const isWorking = fractional >= 9 && fractional < 17;
  const daylight = fractional >= 6 && fractional < 18;
  const isGolden = (fractional >= 4.5 && fractional < 6.5) || (fractional >= 17.5 && fractional < 19.0);

  if (fractional >= 0.0 && fractional < 4.5) {
    return {
      phaseId: 'deep_night',
      label: 'Dini Hari',
      emoji: '🌌',
      description: 'Malam pekat bertabur bintang & waktu hening',
      isDaylight: false,
      isGoldenHour: false,
      isWorkingHours: isWorking,
      colorHex: '#0f172a',
      colorRgba: 'rgba(15, 23, 42, 0.88)',
    };
  }

  if (fractional >= 4.5 && fractional < 6.5) {
    return {
      phaseId: 'dawn',
      label: 'Fajar / Subuh',
      emoji: '🌅',
      description: 'Cahaya fajar merekah di ufuk timur',
      isDaylight: daylight,
      isGoldenHour: true,
      isWorkingHours: isWorking,
      colorHex: '#f43f5e',
      colorRgba: 'rgba(244, 63, 94, 0.88)',
    };
  }

  if (fractional >= 6.5 && fractional < 11.0) {
    return {
      phaseId: 'morning',
      label: 'Pagi',
      emoji: '☀️',
      description: 'Sinar pagi cerah & awal aktivitas harian',
      isDaylight: true,
      isGoldenHour: false,
      isWorkingHours: isWorking,
      colorHex: '#0284c7',
      colorRgba: 'rgba(2, 132, 199, 0.88)',
    };
  }

  if (fractional >= 11.0 && fractional < 15.0) {
    return {
      phaseId: 'noon',
      label: 'Siang Terik',
      emoji: '🌞',
      description: 'Matahari tepat di atas kepala / puncak siang',
      isDaylight: true,
      isGoldenHour: false,
      isWorkingHours: isWorking,
      colorHex: '#f59e0b',
      colorRgba: 'rgba(245, 158, 11, 0.90)',
    };
  }

  if (fractional >= 15.0 && fractional < 17.5) {
    return {
      phaseId: 'afternoon',
      label: 'Sore',
      emoji: '🌤️',
      description: 'Sinar matahari sore hangat & teduh',
      isDaylight: true,
      isGoldenHour: false,
      isWorkingHours: isWorking,
      colorHex: '#ea580c',
      colorRgba: 'rgba(234, 88, 12, 0.88)',
    };
  }

  if (fractional >= 17.5 && fractional < 19.0) {
    return {
      phaseId: 'sunset',
      label: 'Senja / Sunset',
      emoji: '🌇',
      description: 'Matahari terbenam keemasan / golden hour',
      isDaylight: false,
      isGoldenHour: true,
      isWorkingHours: isWorking,
      colorHex: '#ec4899',
      colorRgba: 'rgba(236, 72, 153, 0.90)',
    };
  }

  if (fractional >= 19.0 && fractional < 21.5) {
    return {
      phaseId: 'dusk',
      label: 'Petang / Twilight',
      emoji: '🌆',
      description: 'Rembang petang, Maghrib & transisi malam',
      isDaylight: false,
      isGoldenHour: false,
      isWorkingHours: isWorking,
      colorHex: '#6366f1',
      colorRgba: 'rgba(99, 102, 241, 0.88)',
    };
  }

  // 21.5 - 24.0 (Night / Malam)
  return {
    phaseId: 'night',
    label: 'Malam',
    emoji: '🌙',
    description: 'Malam tenang istirahat & pergantian hari',
    isDaylight: false,
    isGoldenHour: false,
    isWorkingHours: isWorking,
    colorHex: '#1e1b4b',
    colorRgba: 'rgba(30, 27, 75, 0.88)',
  };
}

/**
 * Continuous Diurnal Color Spectrum Interpolator (ADR 0037)
 * Returns a smoothly blended RGBA color across 24 hours of local solar time.
 */
export function interpolateDiurnalColor(hourFraction: number, theme: 'dark' | 'light' = 'dark'): string {
  const normHour = ((hourFraction % 24) + 24) % 24;
  const alpha = theme === 'dark' ? 0.88 : 0.85;

  // Key solar color anchor stops: [hour, [r, g, b]]
  const STOPS: Array<[number, [number, number, number]]> = [
    [0.0, [9, 13, 22]],       // Deep Midnight Abyss #090d16
    [3.5, [15, 23, 42]],      // Pre-Dawn Obsidian #0f172a
    [5.0, [244, 63, 94]],     // Dawn Rose Coral #f43f5e
    [6.5, [251, 146, 60]],    // Sunrise Amber #fb923c
    [8.5, [2, 132, 199]],     // Morning Sky Cyan #0284c7
    [11.5, [234, 179, 8]],    // Daylight Gold #eab308
    [13.0, [245, 158, 11]],   // Solar Zenith Amber #f59e0b
    [16.0, [234, 88, 12]],    // Afternoon Warm Gold #ea580c
    [17.8, [236, 72, 153]],   // Sunset Magenta Pink #ec4899
    [18.8, [147, 51, 234]],   // Sunset Violet #9333ea
    [20.0, [99, 102, 241]],   // Twilight Indigo #6366f1
    [22.0, [30, 27, 75]],     // Deep Night Navy #1e1b4b
    [24.0, [9, 13, 22]],      // Cycle wrap to 0.0
  ];

  // Find surrounding color anchors
  let lower = STOPS[0];
  let upper = STOPS[STOPS.length - 1];

  for (let i = 0; i < STOPS.length - 1; i++) {
    if (normHour >= STOPS[i][0] && normHour <= STOPS[i + 1][0]) {
      lower = STOPS[i];
      upper = STOPS[i + 1];
      break;
    }
  }

  const range = upper[0] - lower[0];
  const t = range > 0 ? (normHour - lower[0]) / range : 0;

  // Linear RGB Interpolation
  const r = Math.round(lower[1][0] + (upper[1][0] - lower[1][0]) * t);
  const g = Math.round(lower[1][1] + (upper[1][1] - lower[1][1]) * t);
  const b = Math.round(lower[1][2] + (upper[1][2] - lower[1][2]) * t);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
