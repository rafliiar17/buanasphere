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
import { TIMEZONE_BOUNDARIES } from '../data/timezoneBoundariesData';

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
    return {
      text: `${country.countryName} ${local.formatted}`,
      shortText: `${local.formatted}`,
    };
  },

  getCustomLabels: (
    _data: Record<string, WorldTimeData>,
    _activeMetric: string,
    theme: 'dark' | 'light',
    selectedIso3?: string,
    simulationDate?: Date,
    cameraAltitude?: number
  ) => {
    const isDark = theme === 'dark';
    const now = simulationDate ?? new Date();
    const alt = cameraAltitude ?? 2.2;
    const isZoomedOut = alt > 1.4;

    // Zoom-aware LOD: when zoomed out far (> 1.4), only render major global hubs
    // or cities belonging to the currently selected country.
    // For Indonesia (ADR 0070): when zoomed out, only show the 3 primary timezone pillars
    // (Jakarta for WIB, Denpasar for WITA, Jayapura for WIT) to prevent visual clutter.
    // When zoomed in (<= 1.4), render all 28 Indonesian cities and 120+ global cities in full detail!
    const INDO_TIMEZONE_PILLARS = new Set(['id-jkt', 'id-dps', 'id-djj']);

    const filteredCities = isZoomedOut
      ? WORLD_CITIES_TIME.filter((city) => {
          if (city.countryIso3 === 'IDN') {
            return INDO_TIMEZONE_PILLARS.has(city.id);
          }
          return city.isMajorHub || (selectedIso3 && city.countryIso3 === selectedIso3);
        })
      : WORLD_CITIES_TIME;

    return filteredCities.map((city) => {
      const isSelected = selectedIso3 === city.countryIso3;
      const isMajor = city.isMajorHub;

      const displayText = city.cityName;
      const shortText = city.cityName;

      const pop = city.population ?? (isMajor ? 8000000 : 1500000);
      const dotRadius = isSelected
        ? 0.35
        : Math.max(0.08, Math.min(0.48, Math.sqrt(pop) * 6.5e-5));
      const size = isSelected ? 0.75 : (isMajor ? 0.40 : 0.28);

      // Solar diurnal phase reactive coloring (golden for day, cyan for night)
      const localTime = calculateLocalTime(now, city.utcOffset);
      const phase = getDiurnalPhase(localTime.hours, localTime.minutes);
      const isDaytime = phase.isDaylight;

      const color = isSelected
        ? '#ffffff'
        : isDaytime
          ? 'rgba(251, 191, 36, 0.92)'   // Solar Golden Amber
          : (isDark ? 'rgba(56, 189, 248, 0.85)' : 'rgba(14, 116, 144, 0.85)'); // Cyan Night Dot

      return {
        id: city.id,
        lat: city.lat,
        lng: city.lng,
        text: displayText,
        shortText,
        size,
        color,
        dotRadius,
        iso3: city.countryIso3,
        cityId: city.id,
        city,
      };
    });
  },

  getPaths: (_data: Record<string, WorldTimeData>, _activeMetric: string, theme: 'dark' | 'light'): GeoPath[] => {
    const isDark = theme === 'dark';
    const paths: GeoPath[] = [];

    const MERIDIAN_REGIONS: Record<string, string[]> = {
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
      '5.5': ['India (New Delhi, Mumbai)', 'Sri Lanka (Kolombo)'],
      '5.75': ['Nepal (Kathmandu)'],
      '6': ['Bangladesh (Dhaka)', 'Kazakhstan (Almaty)', 'Bhutan'],
      '6.5': ['Myanmar (Yangon)', 'Kepulauan Cocos'],
      '7': ['Indonesia (WIB: Jakarta, Surabaya, Medan, Pontianak)', 'Thailand (Bangkok)', 'Vietnam (Hanoi)'],
      '8': ['Indonesia (WITA: Bali, Makassar, Balikpapan)', 'Singapura', 'Malaysia (KL)', 'Tiongkok (Beijing)', 'Perth'],
      '9': ['Indonesia (WIT: Jayapura, Ambon, Manokwari)', 'Jepang (Tokyo)', 'Korea Selatan (Seoul)'],
      '9.5': ['Australia Tengah (Adelaide, Darwin)'],
      '10': ['Australia Timur (Sydney, Melbourne, Brisbane)', 'Papua Nugini (Port Moresby)'],
      '11': ['Kaledonia Baru', 'Kepulauan Solomon', 'Vanuatu'],
      '12': ['Selandia Baru (Auckland, Wellington)', 'Fiji', 'Tuvalu', 'Rusia (Kamchatka)'],
      '12.75': ['Kepulauan Chatham (Selandia Baru)'],
      '13': ['Samoa (Apia)', 'Tonga (Nukuʻalofa)', 'Kepulauan Phoenix'],
      '14': ['Kiribati (Line Islands: Kiritimati / Christmas Island)'],
    };

    const now = new Date();

    for (let i = 0; i < TIMEZONE_BOUNDARIES.length; i++) {
      const seg = TIMEZONE_BOUNDARIES[i];
      const coords = seg.c || seg.coords;
      if (!coords || coords.length === 0) continue;

      const utcOffset = seg.o ?? seg.utcOffset ?? 0;
      const isIdl = Math.abs(utcOffset) === 12 || utcOffset === 14 || utcOffset === 13 || utcOffset === 12.75 || seg.isDateLine === true || coords.some(([, lng]) => Math.abs(lng) >= 168);
      const isWib = !isIdl && utcOffset === 7;
      const isWita = !isIdl && utcOffset === 8;
      const isWit = !isIdl && utcOffset === 9;

      const local = calculateLocalTime(now, utcOffset);
      const phase = getDiurnalPhase(local.hours, local.minutes);
      const diffHours = utcOffset - 7;
      const diffWib = diffHours === 0
        ? 'Acuan Waktu Nasional (WIB)'
        : `${diffHours > 0 ? '+' : ''}${diffHours} jam vs WIB Jakarta`;
      const gmtLabel = `GMT${utcOffset >= 0 ? '+' : ''}${utcOffset}:00`;
      const keyRegions = MERIDIAN_REGIONS[String(utcOffset)] ?? MERIDIAN_REGIONS[String(Math.round(utcOffset))] ?? [`Zona Geopolitik UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`];

      let color = isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 116, 144, 0.35)';
      let stroke = 1.0;
      let altitude = 0.003;
      let dashLength: number | undefined;
      let dashGap: number | undefined;
      let label = `Batas Geopolitik UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`;
      let id = `tz-boundary-utc-${utcOffset}-${i}`;

      if (isWib) {
        color = '#10b981';
        stroke = 2.2;
        altitude = 0.006;
        label = 'Batas Geopolitik WIB (UTC+7 / Jakarta)';
        id = !paths.some(p => p.id === 'meridian-utc-7') ? 'meridian-utc-7' : `meridian-utc-7-${i}`;
      } else if (isWita) {
        color = '#34d399';
        stroke = 1.8;
        altitude = 0.005;
        label = 'Batas Geopolitik WITA (UTC+8 / Bali & Makassar)';
        id = !paths.some(p => p.id === 'meridian-utc-8') ? 'meridian-utc-8' : `meridian-utc-8-${i}`;
      } else if (isWit) {
        color = '#38bdf8';
        stroke = 1.8;
        altitude = 0.005;
        label = 'Batas Geopolitik WIT (UTC+9 / Maluku & Papua)';
        id = !paths.some(p => p.id === 'meridian-utc-9') ? 'meridian-utc-9' : `meridian-utc-9-${i}`;
      } else if (isIdl) {
        color = '#f59e0b';
        stroke = 2.0;
        altitude = 0.005;
        dashLength = 0.15;
        dashGap = 0.08;
        label = 'International Date Line (Garis Batas Tanggal Internasional)';
        id = !paths.some(p => p.id === 'meridian-idl') ? 'meridian-idl' : `meridian-idl-${i}`;
      } else if (utcOffset === 0) {
        color = '#06b6d4';
        stroke = 2.0;
        altitude = 0.005;
        label = 'UTC 0 (Prime Meridian / GMT)';
        id = !paths.some(p => p.id === 'meridian-utc-0') ? 'meridian-utc-0' : `meridian-utc-0-${i}`;
      }

      const tooltipHtml = `
        <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 16px 36px rgba(0,0,0,0.4); font-family: Inter, sans-serif; pointer-events: none; min-width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 14px;">🌐</span>
              <span style="font-weight: 800; font-size: 13px; color: ${isDark ? '#f8fafc' : '#0f172a'};">${label}</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #06b6d4; background: ${isDark ? '#1e293b' : '#ecfeff'}; padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.3);">${gmtLabel}</span>
          </div>
          <div style="font-size: 14px; font-weight: 800; color: ${isWib ? '#10b981' : isWita ? '#34d399' : isWit ? '#38bdf8' : isIdl ? '#f59e0b' : (isDark ? '#38bdf8' : '#0284c7')}; margin-bottom: 4px;">
            🕒 Jam: ${local.formatted} ${phase.emoji}
          </div>
          <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 6px;">
            ${diffWib}
          </div>
          <div style="font-size: 10px; color: ${isDark ? '#cbd5e1' : '#475569'}; border-top: 1px solid ${isDark ? '#334155' : '#e2e8f0'}; padding-top: 5px;">
            📍 ${keyRegions.slice(0, 3).join(' • ')}
          </div>
          <div style="font-size: 9px; color: #38bdf8; margin-top: 4px; font-weight: 600;">
            👉 Klik garis batas untuk detail lengkap zona
          </div>
        </div>
      `;

      paths.push({
        id,
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
