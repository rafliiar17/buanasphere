import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';
import { 
  calculateLocalTime, 
  isDaylight, 
  formatUtcOffset, 
  getDiurnalPhase, 
  interpolateDiurnalColor,
  type DiurnalPhaseInfo 
} from '../geoMath';

export interface WorldTimeData {
  hours: number;
  minutes: number;
  formattedTime: string;
  utcOffset: number;
  utcOffsetFormatted: string;
  isDaylight: boolean;
  isWorkingHours: boolean;
  differenceFromWibHours: number;
  phase: DiurnalPhaseInfo;
}

export const worldTimeApp: GeoAppPlugin<WorldTimeData> = {
  id: 'world-time',
  name: 'TimeWorld',
  tagline: 'Jam Global Real-time, Spektrum Diurnal 8 Fase & Selisih vs WIB',
  icon: 'Clock',
  category: 'time',
  defaultMetricId: 'local_hour',
  metrics: [
    {
      id: 'diurnal_cycle',
      label: 'Siklus Diurnal 24 Jam (8 Spektrum Waktu Surya)',
      unit: 'Waktu',
      formatValue: (val: unknown) => `${String(val).padStart(2, '0')}:00`,
      colorScale: (normalized: number, raw?: unknown) => {
        const hour = Number(raw ?? 12);
        return interpolateDiurnalColor(hour, 'dark');
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
      const phase = getDiurnalPhase(localTime.hours, localTime.minutes);

      dataMap[country.iso3] = {
        hours: localTime.hours,
        minutes: localTime.minutes,
        formattedTime: localTime.formatted,
        utcOffset: country.utcOffset,
        utcOffsetFormatted: formatUtcOffset(country.utcOffset),
        isDaylight: daylight,
        isWorkingHours: isWorking,
        differenceFromWibHours: diffWib,
        phase,
      };
    }

    return dataMap;
  },

  getPolygonColor: (country: CountrySpatialMetadata, data: WorldTimeData | undefined, activeMetric: string, theme: 'dark' | 'light'): string => {
    if (activeMetric === 'diff_wib') {
      const diff = country.utcOffset - 7;
      if (diff === 0) return 'rgba(16, 185, 129, 0.90)'; // Emerald Jakarta baseline
      if (diff > 0) return 'rgba(139, 92, 246, 0.85)';  // Purple ahead of WIB
      return 'rgba(6, 182, 212, 0.85)';                // Cyan behind WIB
    }

    const now = new Date();
    const local = calculateLocalTime(now, country.utcOffset);
    const hourFraction = local.hours + local.minutes / 60;
    return interpolateDiurnalColor(hourFraction, theme);
  },

  getPinLabel: (country: CountrySpatialMetadata, data: WorldTimeData | undefined, _activeMetric: string): { text: string; shortText: string } => {
    const now = new Date();
    const local = calculateLocalTime(now, country.utcOffset);
    const phase = getDiurnalPhase(local.hours, local.minutes);
    return {
      text: `${country.countryName} ${local.formatted} ${phase.emoji}`,
      shortText: `${local.formatted} ${phase.emoji}`,
    };
  },

  getTooltipHtml: (country: CountrySpatialMetadata, data: WorldTimeData | undefined, _activeMetric: string, theme: 'dark' | 'light'): string => {
    const isDark = theme === 'dark';
    const now = new Date();
    const offset = country.utcOffset ?? 0;
    const local = calculateLocalTime(now, offset);
    const phase = getDiurnalPhase(local.hours, local.minutes);
    const diffHours = offset - 7;
    const diffStr = diffHours === 0 ? 'Waktu Acuan Lokal (WIB UTC+7)' : `${diffHours > 0 ? '+' : ''}${diffHours} jam vs WIB Jakarta`;

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 14px; padding: 10px 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.4); font-family: Inter, sans-serif; pointer-events: none; min-width: 230px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 18px;">${country.flagEmoji}</span>
            <span style="font-weight: 700; font-size: 13px; color: ${isDark ? '#f8fafc' : '#0f172a'};">${country.countryName}</span>
          </div>
          <span style="font-size: 10px; font-family: monospace; font-weight: 700; color: #f59e0b; background: ${isDark ? '#1e293b' : '#fef3c7'}; padding: 2px 6px; border-radius: 6px;">
            ${formatUtcOffset(offset)}
          </span>
        </div>
        
        <div style="background: ${isDark ? 'rgba(2, 6, 23, 0.6)' : '#f8fafc'}; border: 1px solid ${isDark ? '#1e293b' : '#e2e8f0'}; border-radius: 10px; padding: 8px 10px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; font-weight: 500;">Jam Lokal:</span>
          <span style="font-size: 16px; font-family: monospace; font-weight: 800; color: #ffffff;">${local.formatted}</span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 10px;">
          <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 6px; font-weight: 700; background: ${phase.colorRgba}; color: #ffffff;">
            ${phase.emoji} ${phase.label}
          </span>
          <span style="color: ${isDark ? '#cbd5e1' : '#475569'}; font-size: 10px; font-weight: 600;">
            ${diffStr}
          </span>
        </div>
      </div>
    `;
  },

  renderInspector: (country: CountrySpatialMetadata, data: WorldTimeData | undefined): InspectorWidget => {
    const now = new Date();
    const local = calculateLocalTime(now, country.utcOffset);
    const phase = getDiurnalPhase(local.hours, local.minutes);
    const diffHours = country.utcOffset - 7;
    const diffStr =
      diffHours === 0
        ? 'Waktu Acuan Lokal (WIB UTC+7)'
        : `${Math.abs(diffHours)} Jam ${diffHours > 0 ? 'lebih cepat' : 'lebih lambat'} dari Jakarta`;

    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'clock',
      primaryValue: local.formatted,
      subtitle: `${country.capital} • ${formatUtcOffset(country.utcOffset)}`,
      badge: {
        text: `${phase.emoji} ${phase.label}`,
        variant: phase.isDaylight ? 'warning' : 'info',
      },
      statsGrid: [
        { label: 'Fase Surya / Diurnal', value: `${phase.emoji} ${phase.label} (${phase.description})` },
        { label: 'Status Bisnis & Kantor', value: data?.isWorkingHours ? '🟢 Jam Kerja Aktif (09:00 - 17:00)' : '🔴 Di Luar Jam Kantor' },
        { label: 'Relasi vs Waktu Indonesia', value: diffStr },
        { label: 'Zona Waktu Baku', value: formatUtcOffset(country.utcOffset) },
        { label: 'Ibukota Negara', value: country.capital },
      ],
      customData: {
        hours: local.hours,
        minutes: local.minutes,
        isDaylight: phase.isDaylight,
        phase: phase.phaseId,
      },
    };
  },
};
