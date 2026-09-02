import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';
import { calculateLocalTime, isDaylight, formatUtcOffset } from '../geoMath';

export interface WorldTimeData {
  hours: number;
  minutes: number;
  formattedTime: string;
  utcOffset: number;
  utcOffsetFormatted: string;
  isDaylight: boolean;
  isWorkingHours: boolean;
  differenceFromWibHours: number;
}

export const worldTimeApp: GeoAppPlugin<WorldTimeData> = {
  id: 'world-time',
  name: 'TimeWorld',
  tagline: 'Jam Global Real-time, Solar Daylight & Selisih Waktu vs WIB',
  icon: 'Clock',
  category: 'time',
  defaultMetricId: 'local_hour',
  metrics: [
    {
      id: 'local_hour',
      label: 'Zona Waktu & Jam Lokal (Siang / Malam)',
      unit: 'Jam',
      formatValue: (val: unknown) => `${String(val).padStart(2, '0')}:00`,
      colorScale: (normalized: number, raw?: unknown) => {
        const hour = Number(raw ?? 12);
        if (hour >= 6 && hour < 18) {
          return '#f59e0b';
        }
        return '#3b82f6';
      },
    },
    {
      id: 'diff_wib',
      label: 'Selisih Waktu vs Indonesia (WIB UTC+7)',
      unit: 'Jam',
      formatValue: (val: unknown) => `${Number(val) >= 0 ? '+' : ''}${val} Jam`,
      colorScale: (normalized: number, raw?: unknown) => {
        const diff = Number(raw ?? 0);
        if (diff === 0) return '#10b981';
        if (diff > 0) return '#8b5cf6';
        return '#06b6d4';
      },
    },
  ],

  dataLoader: async (countries: CountrySpatialMetadata[]) => {
    const now = new Date();
    const dataMap: Record<string, WorldTimeData> = {};

    for (const country of countries) {
      const localTime = calculateLocalTime(now, country.utcOffset);
      const daylight = isDaylight(localTime.hours);
      const isWorking = localTime.hours >= 9 && localTime.hours < 17;
      const diffWib = country.utcOffset - 7;

      dataMap[country.iso3] = {
        hours: localTime.hours,
        minutes: localTime.minutes,
        formattedTime: localTime.formatted,
        utcOffset: country.utcOffset,
        utcOffsetFormatted: formatUtcOffset(country.utcOffset),
        isDaylight: daylight,
        isWorkingHours: isWorking,
        differenceFromWibHours: diffWib,
      };
    }

    return dataMap;
  },

  renderInspector: (country: CountrySpatialMetadata, data: WorldTimeData): InspectorWidget => {
    const diffStr =
      (data?.differenceFromWibHours ?? 0) === 0
        ? 'Sama dengan WIB (UTC+7)'
        : `${Math.abs(data?.differenceFromWibHours ?? 0)} Jam ${(data?.differenceFromWibHours ?? 0) > 0 ? 'lebih cepat' : 'lebih lambat'} dari Jakarta`;

    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'clock',
      primaryValue: data?.formattedTime ?? '--:--',
      subtitle: `${country.capital} • ${data?.utcOffsetFormatted ?? 'UTC+00:00'}`,
      badge: {
        text: data?.isDaylight ? '☀️ Siang Hari' : '🌙 Malam Hari',
        variant: data?.isDaylight ? 'warning' : 'info',
      },
      statsGrid: [
        { label: 'Status Kantor / Bisnis', value: data?.isWorkingHours ? '🟢 Jam Kerja Aktif' : '🔴 Di Luar Jam Kerja' },
        { label: 'Relasi vs Waktu Indonesia', value: diffStr },
        { label: 'Zona Waktu Baku', value: data?.utcOffsetFormatted ?? 'UTC+00:00' },
        { label: 'Ibukota', value: country.capital },
      ],
      customData: {
        hours: data?.hours ?? 12,
        minutes: data?.minutes ?? 0,
        isDaylight: data?.isDaylight ?? true,
      },
    };
  },
};
