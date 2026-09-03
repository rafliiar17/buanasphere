import type { CountrySpatialMetadata, GeoAppPlugin, GeoArc, InspectorWidget } from '../types';
import { generateGreatCircleArc } from '../geoMath';
import { 
  FLIGHT_CORRIDOR_REGIONS, 
  type FlightCorridorFilterType,
  isCountryMatchingFlightFilter 
} from '../filterEngine';

export interface RemittanceCorridorData {
  annualVolumeMillionUsd: number;
  migrantWorkersCount: number;
  averageTransferFeePercent: number;
  isOriginToIndonesia: boolean;
}

export const REMITTANCE_HUBS: Record<
  string,
  { volumeM: number; workers: number; fee: number; color: string; lat: number; lng: number }
> = {
  SAU: { volumeM: 3200, workers: 950000, fee: 3.2, color: '#10b981', lat: 24.71, lng: 46.67 },
  MYS: { volumeM: 2800, workers: 1400000, fee: 2.5, color: '#06b6d4', lat: 3.13, lng: 101.68 },
  TWN: { volumeM: 1900, workers: 320000, fee: 2.8, color: '#3b82f6', lat: 25.03, lng: 121.56 },
  HKG: { volumeM: 1600, workers: 170000, fee: 2.1, color: '#8b5cf6', lat: 22.31, lng: 114.16 },
  SGP: { volumeM: 1500, workers: 140000, fee: 1.8, color: '#ec4899', lat: 1.35, lng: 103.81 },
  JPN: { volumeM: 1100, workers: 85000, fee: 3.5, color: '#f59e0b', lat: 35.67, lng: 139.65 },
  USA: { volumeM: 950, workers: 65000, fee: 3.8, color: '#6366f1', lat: 38.90, lng: -77.03 },
  KOR: { volumeM: 800, workers: 55000, fee: 3.1, color: '#14b8a6', lat: 37.56, lng: 126.97 },
  ARE: { volumeM: 750, workers: 60000, fee: 3.3, color: '#eab308', lat: 24.45, lng: 54.37 },
  AUS: { volumeM: 620, workers: 45000, fee: 2.9, color: '#f97316', lat: -35.28, lng: 149.13 },
};

const REMITTANCE_HUBS_SET = new Set(Object.keys(REMITTANCE_HUBS));

export const flowCorridorsApp: GeoAppPlugin<RemittanceCorridorData> = {
  id: 'remittance-flow',
  name: 'Flow Corridors',
  tagline: 'Jalur Arus Remitansi & Koridor Pengiriman Dana Global ke Indonesia',
  icon: 'Plane',
  category: 'finance',
  defaultMetricId: 'volume',
  canonicalPath: '/flight',
  aliasPaths: ['/flow'],
  branding: {
    main: 'Flow',
    sub: '.Corridors',
    accentColor: '#06b6d4',
  },
  splash: {
    stepText: 'Memuat Rute Koridor Remitansi 3D ke Jakarta...',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
  },
  filterOptions: [
    { id: 'all', label: 'Semua Rute (10 Hub)' },
    { id: 'mideast', label: 'Timur Tengah 🕌' },
    { id: 'asean', label: 'ASEAN Hub 🌴' },
    { id: 'eastasia', label: 'Asia Timur 🏯' },
    { id: 'west', label: 'Barat & Pasifik 🌐' },
  ],
  filterPredicate: (iso3: string, filterValue: unknown) => {
    return isCountryMatchingFlightFilter(iso3, (filterValue as FlightCorridorFilterType) || 'all');
  },
  metrics: [
    {
      id: 'volume',
      label: 'Volume Remitansi Tahunan (Juta USD)',
      unit: 'M USD',
      formatValue: (val: unknown) => `$${Number(val).toLocaleString()} Juta USD`,
      colorScale: (normalized: number, raw?: unknown) => {
        const vol = Number(raw ?? 0);
        if (vol > 2000) return '#10b981';
        if (vol > 1000) return '#06b6d4';
        if (vol > 500) return '#3b82f6';
        return '#334155';
      },
    },
    {
      id: 'fee',
      label: 'Rata-rata Biaya Transfer (%)',
      unit: '%',
      formatValue: (val: unknown) => `${Number(val).toFixed(1)}%`,
      colorScale: (normalized: number, raw?: unknown) => {
        const fee = Number(raw ?? 5);
        if (fee <= 2.5) return '#10b981';
        if (fee <= 3.5) return '#f59e0b';
        return '#ef4444';
      },
    },
  ],

  dataLoader: async (countries: CountrySpatialMetadata[]) => {
    const dataMap: Record<string, RemittanceCorridorData> = {};

    for (const country of countries) {
      const hub = REMITTANCE_HUBS[country.iso3];
      if (hub) {
        dataMap[country.iso3] = {
          annualVolumeMillionUsd: hub.volumeM,
          migrantWorkersCount: hub.workers,
          averageTransferFeePercent: hub.fee,
          isOriginToIndonesia: true,
        };
      } else {
        dataMap[country.iso3] = {
          annualVolumeMillionUsd: 0,
          migrantWorkersCount: 0,
          averageTransferFeePercent: 4.5,
          isOriginToIndonesia: false,
        };
      }
    }

    return dataMap;
  },

  getPolygonColor: (country: CountrySpatialMetadata, _data: any, _activeMetric: string, theme: 'dark' | 'light'): string => {
    const isDark = theme === 'dark';
    const iso3 = country.iso3;
    if (iso3 === 'IDN') return 'rgba(56, 189, 248, 0.95)';
    if (REMITTANCE_HUBS_SET.has(iso3)) return 'rgba(16, 185, 129, 0.85)';
    return isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.6)';
  },

  getTooltipHtml: (country: CountrySpatialMetadata, _data: any, _activeMetric: string, theme: 'dark' | 'light'): string => {
    const isDark = theme === 'dark';
    const iso3 = country.iso3;
    const name = country.countryName;
    const isHub = REMITTANCE_HUBS_SET.has(iso3);
    const hub = REMITTANCE_HUBS[iso3];

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">${country.flagEmoji}</span>
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
          </div>
          <span style="font-size: 10px; font-weight: 700; color: ${isHub ? '#10b981' : '#64748b'};">
            ${isHub ? '✈️ Koridor Aktif' : 'Non-Hub'}
          </span>
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 4px;">
          Rute: ${country.capital || name} ➔ Jakarta
        </div>
        ${isHub ? `
          <div style="font-size: 11px; color: #10b981; font-weight: 700; margin-bottom: 2px;">
            Volume: $${hub.volumeM} Juta USD / Thn
          </div>
        ` : ''}
        <div style="font-size: 10px; color: #38bdf8; font-weight: 600;">
          👉 Klik untuk rincian arus remitansi 3D
        </div>
      </div>
    `;
  },

  getPinLabel: (country: CountrySpatialMetadata): { text: string; shortText: string } => {
    const isHub = REMITTANCE_HUBS_SET.has(country.iso3);
    return {
      text: isHub ? `✈️ ${country.countryName}` : country.countryName,
      shortText: country.iso3,
    };
  },

  getArcData: (selectedCountry: CountrySpatialMetadata, _allData: Record<string, RemittanceCorridorData>): GeoArc[] => {
    const destination = {
      lat: selectedCountry.lat,
      lng: selectedCountry.lng,
      label: selectedCountry.countryName,
    };
    const arcs: GeoArc[] = [];
    for (const [iso3, hub] of Object.entries(REMITTANCE_HUBS)) {
      if (iso3 === selectedCountry.iso3) continue;
      const arc = generateGreatCircleArc(
        { lat: hub.lat, lng: hub.lng, label: iso3 },
        destination,
        {
          color: [hub.color, '#10b981'],
          altitude: 0.25 + (hub.volumeM / 3200) * 0.20,
          stroke: 1.5 + (hub.volumeM / 3200) * 1.5,
          dashLength: 0.4,
          dashGap: 0.2,
          dashAnimateTime: 2500,
          label: `${iso3} ➔ ${selectedCountry.countryName} ($${hub.volumeM}M USD)`,
        }
      );
      arcs.push(arc);
    }
    return arcs;
  },

  getArcs: (_data: any, activeFilter: string = 'all'): GeoArc[] => {
    const destination = {
      lat: -6.2,
      lng: 106.81,
      label: 'Jakarta (Indonesia)',
    };
    const arcs: GeoArc[] = [];
    const validIsoList = FLIGHT_CORRIDOR_REGIONS[activeFilter as FlightCorridorFilterType] || FLIGHT_CORRIDOR_REGIONS.all;

    for (const [iso3, hub] of Object.entries(REMITTANCE_HUBS)) {
      if (iso3 === 'IDN') continue;
      if (!validIsoList.includes(iso3)) continue;

      const arc = generateGreatCircleArc(
        { lat: hub.lat, lng: hub.lng, label: iso3 },
        destination,
        {
          color: [hub.color, '#10b981'],
          altitude: 0.25 + (hub.volumeM / 3200) * 0.20,
          stroke: 1.5 + (hub.volumeM / 3200) * 1.5,
          dashLength: 0.4,
          dashGap: 0.2,
          dashAnimateTime: 2500,
          label: `${iso3} ➔ Indonesia ($${hub.volumeM}M USD)`,
        }
      );
      arcs.push(arc);
    }

    return arcs;
  },

  renderInspector: (country: CountrySpatialMetadata, data: RemittanceCorridorData | undefined): InspectorWidget => {
    const isHub = data?.isOriginToIndonesia ?? false;

    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'corridors',
      primaryValue: isHub ? `$${data?.annualVolumeMillionUsd} Juta USD/Tahun` : 'Koridor Sekunder',
      subtitle: isHub ? `Rute Remitansi Utama ➔ Jakarta, Indonesia` : `Estimasi Pengiriman Dana Non-Utama`,
      badge: {
        text: isHub ? '✈️ Koridor Aktif 3D' : 'Non-Koridor',
        variant: isHub ? 'success' : 'info',
      },
      statsGrid: isHub
        ? [
            { label: 'Volume Remitansi', value: `$${data?.annualVolumeMillionUsd} Juta USD` },
            { label: 'Estimasi Pekerja Migran', value: `${data?.migrantWorkersCount.toLocaleString()} Jiwa` },
            { label: 'Rata-rata Biaya Transfer', value: `${data?.averageTransferFeePercent}%` },
            { label: 'Tujuan Transfer', value: 'Indonesia (IDR)' },
          ]
        : [
            { label: 'Ibukota', value: country.capital },
            { label: 'Mata Uang', value: `${country.currencyCode} (${country.currencyName})` },
            { label: 'Kawasan', value: country.region },
          ],
    };
  },
};
