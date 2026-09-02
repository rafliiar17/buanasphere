import type { CountrySpatialMetadata, GeoAppPlugin, GeoArc, InspectorWidget } from '../types';
import { generateGreatCircleArc } from '../geoMath';

export interface RemittanceCorridorData {
  annualVolumeMillionUsd: number;
  migrantWorkersCount: number;
  averageTransferFeePercent: number;
  isOriginToIndonesia: boolean;
}

const REMITTANCE_HUBS: Record<
  string,
  { volumeM: number; workers: number; fee: number; color: string }
> = {
  SAU: { volumeM: 3200, workers: 950000, fee: 3.2, color: '#10b981' },
  MYS: { volumeM: 2800, workers: 1400000, fee: 2.5, color: '#06b6d4' },
  TWN: { volumeM: 1900, workers: 320000, fee: 2.8, color: '#3b82f6' },
  HKG: { volumeM: 1600, workers: 170000, fee: 2.1, color: '#8b5cf6' },
  SGP: { volumeM: 1500, workers: 140000, fee: 1.8, color: '#ec4899' },
  JPN: { volumeM: 1100, workers: 85000, fee: 3.5, color: '#f59e0b' },
  USA: { volumeM: 950, workers: 65000, fee: 3.8, color: '#6366f1' },
  KOR: { volumeM: 800, workers: 55000, fee: 3.1, color: '#14b8a6' },
  ARE: { volumeM: 750, workers: 60000, fee: 3.3, color: '#eab308' },
  AUS: { volumeM: 620, workers: 45000, fee: 2.9, color: '#f97316' },
};

export const flowCorridorsApp: GeoAppPlugin<RemittanceCorridorData> = {
  id: 'remittance-flow',
  name: 'Flow Corridors',
  tagline: 'Jalur Arus Remitansi & Koridor Pengiriman Dana Global ke Indonesia',
  icon: 'Plane',
  category: 'finance',
  defaultMetricId: 'volume',
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

  getArcData: (selectedCountry: CountrySpatialMetadata, allData: Record<string, RemittanceCorridorData>): GeoArc[] => {
    const destination = {
      lat: selectedCountry.lat,
      lng: selectedCountry.lng,
      label: `${selectedCountry.capital} (${selectedCountry.countryName})`,
    };
    const arcs: GeoArc[] = [];

    for (const [iso3, hub] of Object.entries(REMITTANCE_HUBS)) {
      if (iso3 === selectedCountry.iso3) continue;
      const origin = { lat: 0, lng: 0 };
      if (iso3 === 'SAU') { origin.lat = 24.71; origin.lng = 46.67; }
      else if (iso3 === 'MYS') { origin.lat = 3.13; origin.lng = 101.68; }
      else if (iso3 === 'TWN') { origin.lat = 25.03; origin.lng = 121.56; }
      else if (iso3 === 'HKG') { origin.lat = 22.31; origin.lng = 114.16; }
      else if (iso3 === 'SGP') { origin.lat = 1.35; origin.lng = 103.81; }
      else if (iso3 === 'JPN') { origin.lat = 35.67; origin.lng = 139.65; }
      else if (iso3 === 'USA') { origin.lat = 38.90; origin.lng = -77.03; }
      else if (iso3 === 'KOR') { origin.lat = 37.56; origin.lng = 126.97; }
      else if (iso3 === 'ARE') { origin.lat = 24.45; origin.lng = 54.37; }
      else if (iso3 === 'AUS') { origin.lat = -35.28; origin.lng = 149.13; }

      const arc = generateGreatCircleArc(
        { lat: origin.lat, lng: origin.lng, label: iso3 },
        destination,
        {
          color: [hub.color, '#10b981'],
          altitude: 0.3 + (hub.volumeM / 3200) * 0.25,
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

  renderInspector: (country: CountrySpatialMetadata, data: RemittanceCorridorData): InspectorWidget => {
    const isHub = data?.isOriginToIndonesia ?? false;

    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'corridors',
      primaryValue: isHub ? `$${data.annualVolumeMillionUsd} Juta USD/Tahun` : 'Koridor Sekunder',
      subtitle: isHub ? `Rute Remitansi Utama ➔ Jakarta, Indonesia` : `Estimasi Pengiriman Dana Non-Utama`,
      badge: {
        text: isHub ? '✈️ Koridor Aktif 3D' : 'Non-Koridor',
        variant: isHub ? 'success' : 'info',
      },
      statsGrid: isHub
        ? [
            { label: 'Volume Remitansi', value: `$${data.annualVolumeMillionUsd} Juta USD` },
            { label: 'Estimasi Pekerja Migran', value: `${data.migrantWorkersCount.toLocaleString()} Jiwa` },
            { label: 'Rata-rata Biaya Transfer', value: `${data.averageTransferFeePercent}%` },
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
