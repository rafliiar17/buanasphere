import type { CountrySpatialMetadata, GeoAppPlugin, GeoPath, InspectorWidget } from '../types';
import TimeBottomDock from '$lib/apps/time/TimeBottomDock.svelte';
import { 
  calculateLocalTime, 
  isDaylight, 
  formatUtcOffset, 
  getDiurnalPhase, 
  interpolateDiurnalColor,
  type DiurnalPhaseInfo 
} from '../geoMath';
import { isCountryMatchingTimeFilter, type TimeFilterType } from '../filterEngine';
import { 
  WORLD_CITIES_TIME, 
  type WorldCityTimeInfo, 
  findCitiesByCountry 
} from '../data/worldCitiesTimeData';

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
  canonicalPath: '/time',
  aliasPaths: [],
  branding: {
    main: 'Time',
    sub: '.World',
    accentColor: '#38bdf8',
    disclaimer: 'Zona waktu & jam digital real-time 195+ negara · Gratis · Tanpa registrasi',
  },
  splash: {
    stepText: 'Memuat Zona Waktu & Jam Digital 195+ Negara...',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-indigo-500',
  },
  filterOptions: [
    { id: 'all', label: 'Semua Zona' },
    { id: 'working', label: 'Jam Kantor (09:00 - 17:00)' },
    { id: 'daylight', label: 'Siang Hari ☀️' },
    { id: 'night', label: 'Malam Hari 🌙' },
    { id: 'golden_hour', label: 'Fajar & Senja 🌅' },
  ],
  filterPredicate: (iso3: string, filterValue: unknown) => {
    return isCountryMatchingTimeFilter(iso3, (filterValue as TimeFilterType) || 'all');
  },
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

  getCustomLabels: (
    _data: Record<string, WorldTimeData>,
    _activeMetric: string,
    theme: 'dark' | 'light',
    selectedIso3?: string,
    simulationDate?: Date
  ) => {
    const isDark = theme === 'dark';
    const now = simulationDate ?? new Date();

    return WORLD_CITIES_TIME.map((city) => {
      const local = calculateLocalTime(now, city.utcOffset);
      const phase = getDiurnalPhase(local.hours, local.minutes);
      const isSelected = selectedIso3 === city.countryIso3;
      const isMajor = city.isMajorHub;

      const displayText = `${city.flagEmoji} ${city.cityName} • ${local.formatted} ${phase.emoji}`;
      const shortText = `${city.cityName} ${local.formatted}`;

      const size = isSelected ? 0.75 : (isMajor ? 0.40 : 0.28);
      const color = isSelected
        ? '#ffffff'
        : (isDark ? 'rgba(241, 245, 249, 0.92)' : 'rgba(15, 23, 42, 0.92)');

      return {
        id: city.id,
        lat: city.lat,
        lng: city.lng,
        text: displayText,
        shortText,
        size,
        color,
        iso3: city.countryIso3,
        cityId: city.id,
        city,
      };
    });
  },

  getPaths: (_data: Record<string, WorldTimeData>, _activeMetric: string, theme: 'dark' | 'light'): GeoPath[] => {
    const isDark = theme === 'dark';
    const paths: GeoPath[] = [];

    const MERIDIAN_REGIONS: Record<number, string[]> = {
      '-12': ['Pulau Baker (AS)', 'Kepulauan Howland (AS)'],
      '-11': ['Samoa Amerika', 'Niue'],
      '-10': ['Hawaii (Honolulu)', 'Tahiti', 'Kepulauan Cook'],
      '-9': ['Alaska (Anchorage, Juneau)'],
      '-8': ['Pantai Barat AS (Los Angeles, San Francisco, Seattle)', 'Vancouver'],
      '-7': ['Pegunungan AS (Denver, Phoenix, Salt Lake City)', 'Calgary'],
      '-6': ['Tengah AS (Chicago, Houston, Dallas)', 'Mexico City'],
      '-5': ['Pantai Timur AS (New York, Washington DC, Miami)', 'Toronto', 'Bogota', 'Lima'],
      '-4': ['Santiago', 'Caracas', 'La Paz', 'Halifax'],
      '-3': ['Buenos Aires', 'Sao Paulo', 'Rio de Janeiro', 'Montevideo'],
      '-2': ['Georgia Selatan', 'Kepulauan Sandwich Selatan'],
      '-1': ['Kepulauan Azores (Portugal)', 'Tanjung Verde'],
      '0': ['Inggris (London GMT)', 'Portugal (Lisbon)', 'Ghana (Accra)', 'Islandia (Reykjavik)'],
      '1': ['Eropa Barat (Paris, Berlin, Roma, Madrid)', 'Nigeria (Lagos)', 'Aljazair'],
      '2': ['Eropa Timur (Athena, Kairo, Helsinki)', 'Afrika Selatan (Johannesburg)'],
      '3': ['Arab Saudi (Riyadh, Makkah)', 'Rusia (Moskow)', 'Turki (Istanbul)', 'Kenya (Nairobi)'],
      '4': ['Uni Emirat Arab (Dubai, Abu Dhabi)', 'Azerbaijan (Baku)', 'Georgia (Tbilisi)'],
      '5': ['Pakistan (Karachi, Islamabad)', 'Uzbekistan (Tashkent)', 'Maladewa'],
      '6': ['Bangladesh (Dhaka)', 'Kazakhstan (Almaty)', 'Bhutan'],
      '7': ['Indonesia (WIB: Jakarta, Surabaya, Medan)', 'Thailand (Bangkok)', 'Vietnam (Hanoi)'],
      '8': ['Indonesia (WITA: Bali, Makassar)', 'Singapura', 'Malaysia (KL)', 'Tiongkok (Beijing)', 'Perth'],
      '9': ['Indonesia (WIT: Jayapura, Ambon)', 'Jepang (Tokyo)', 'Korea Selatan (Seoul)'],
      '10': ['Australia Timur (Sydney, Melbourne, Brisbane)', 'Papua Nugini (Port Moresby)'],
      '11': ['Kaledonia Baru', 'Kepulauan Solomon', 'Vanuatu'],
    };

    // 24 standard timezone meridians (from -180 to +165 in 15-degree steps)
    for (let lng = -180; lng < 180; lng += 15) {
      const utcOffset = Math.round(lng / 15);
      const isWib = lng === 105; // UTC+7 (Jakarta / WIB baseline)
      const isWita = lng === 120; // UTC+8 (WITA / Bali & Makassar)
      const isWit = lng === 135; // UTC+9 (WIT / Maluku & Papua)
      const isGmt = lng === 0;   // UTC 0 (Prime Meridian)
      const isIdl = lng === -180; // International Date Line (±180)

      // Live time calculations along this meridian
      const now = new Date();
      const local = calculateLocalTime(now, utcOffset);
      const phase = getDiurnalPhase(local.hours, local.minutes);
      const diffHours = utcOffset - 7;
      const diffWib = diffHours === 0 
        ? 'Acuan Waktu Nasional (WIB)' 
        : `${diffHours > 0 ? '+' : ''}${diffHours} jam vs WIB Jakarta`;
      const gmtLabel = `GMT${utcOffset >= 0 ? '+' : ''}${utcOffset}:00`;
      const keyRegions = MERIDIAN_REGIONS[utcOffset] ?? [`Zona Waktu Bujur ${lng}°`];

      // Sample latitude coordinates from +85 (North) to -85 (South)
      const coords: Array<[number, number]> = [];
      for (let lat = 85; lat >= -85; lat -= 5) {
        coords.push([lat, lng]);
      }

      let color = isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(14, 116, 144, 0.28)';
      let stroke = 1.0;
      let altitude = 0.003;
      let dashLength: number | undefined;
      let dashGap: number | undefined;
      let label = `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`;

      if (isWib) {
        color = '#10b981'; // Glowing emerald for WIB baseline
        stroke = 2.2;
        altitude = 0.006;
        label = 'WIB (UTC+7 / Jakarta Baseline)';
      } else if (isWita) {
        color = isDark ? '#34d399' : '#059669';
        stroke = 1.6;
        altitude = 0.004;
        label = 'WITA (UTC+8 / Bali & Makassar)';
      } else if (isWit) {
        color = isDark ? '#38bdf8' : '#0284c7';
        stroke = 1.6;
        altitude = 0.004;
        label = 'WIT (UTC+9 / Maluku & Papua)';
      } else if (isGmt) {
        color = '#06b6d4'; // Cyan for Greenwich Prime Meridian
        stroke = 2.0;
        altitude = 0.005;
        label = 'UTC 0 (Prime Meridian / GMT)';
      } else if (isIdl) {
        color = '#f59e0b'; // Amber dashed for International Date Line
        stroke = 1.8;
        altitude = 0.004;
        dashLength = 0.15;
        dashGap = 0.08;
        label = 'International Date Line (UTC±12)';
      }

      const tooltipHtml = `
        <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 16px 36px rgba(0,0,0,0.4); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 14px;">🌐</span>
              <span style="font-weight: 800; font-size: 13px; color: ${isDark ? '#f8fafc' : '#0f172a'};">${label}</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #06b6d4; background: ${isDark ? '#1e293b' : '#ecfeff'}; padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.3);">${gmtLabel}</span>
          </div>
          <div style="font-size: 14px; font-weight: 800; color: ${isWib ? '#10b981' : (isDark ? '#38bdf8' : '#0284c7')}; margin-bottom: 4px;">
            🕒 Jam: ${local.formatted} ${phase.emoji}
          </div>
          <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 6px;">
            ${diffWib}
          </div>
          <div style="font-size: 10px; color: ${isDark ? '#cbd5e1' : '#475569'}; border-top: 1px solid ${isDark ? '#334155' : '#e2e8f0'}; padding-top: 5px;">
            📍 ${keyRegions.slice(0, 3).join(' • ')}
          </div>
          <div style="font-size: 9px; color: #38bdf8; margin-top: 4px; font-weight: 600;">
            👉 Klik garis untuk detail lengkap zona
          </div>
        </div>
      `;

      paths.push({
        id: `meridian-utc-${utcOffset}`,
        coords,
        color,
        stroke,
        altitude,
        dashLength,
        dashGap,
        label,
        utcOffset,
        gmtLabel,
        localTime: local.formatted,
        diffWib,
        keyRegions,
        tooltipHtml,
      });
    }

    return paths;
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
    const diffWib = country.utcOffset - 7;
    const diffWita = country.utcOffset - 8;
    const diffWit = country.utcOffset - 9;
    const formatRel = (diff: number) =>
      diff === 0 ? 'Sama (0 Jam)' : `${diff > 0 ? '+' : ''}${diff} Jam ${diff > 0 ? 'lebih cepat' : 'lebih lambat'}`;

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
        { label: 'Relasi vs WIB (Jakarta)', value: formatRel(diffWib) },
        { label: 'Relasi vs WITA (Bali / IKN)', value: formatRel(diffWita) },
        { label: 'Relasi vs WIT (Jayapura)', value: formatRel(diffWit) },
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
  BottomDockComponent: TimeBottomDock,
};
