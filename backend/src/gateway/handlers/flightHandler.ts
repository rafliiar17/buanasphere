import type { MicroappHandler } from '../types.ts';
import type { Env } from '../../db/index.ts';
import flowCorridorsRawData from '../data/flow_corridors_dataset.json';

export interface FlightCorridorHub {
  volumeM: number;
  workers: number;
  fee: number;
  color: string;
  lat: number;
  lng: number;
  region?: string;
}

export interface FlightCorridorRecord {
  originIso3: string;
  originCoordinates: {
    lat: number;
    lng: number;
  };
  remittanceVolumeMillionUsd: number;
  passengerVolumeEstimate: number;
  averageTransferFeePercent: number;
  region: string;
  color: string;
  distanceKm: number;
}

export interface FlightCorridorsResult {
  destination: {
    iso3: string;
    countryName: string;
    capital: string;
    lat: number;
    lng: number;
  };
  totalCorridors: number;
  corridors: FlightCorridorRecord[];
  source: string;
}

const JAKARTA_DESTINATION = {
  iso3: 'IDN',
  countryName: 'Indonesia',
  capital: 'Jakarta',
  lat: -6.2088,
  lng: 106.8456,
};

/**
 * Computes great circle distance between two lat/lng coordinates in km.
 */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

const allCorridors: FlightCorridorRecord[] = Object.entries(
  flowCorridorsRawData as Record<string, FlightCorridorHub>
).map(([originIso3, hub]) => ({
  originIso3,
  originCoordinates: {
    lat: hub.lat,
    lng: hub.lng,
  },
  remittanceVolumeMillionUsd: hub.volumeM,
  passengerVolumeEstimate: hub.workers,
  averageTransferFeePercent: hub.fee,
  region: hub.region || 'global',
  color: hub.color,
  distanceKm: calculateDistanceKm(
    hub.lat,
    hub.lng,
    JAKARTA_DESTINATION.lat,
    JAKARTA_DESTINATION.lng
  ),
})).sort((a, b) => b.remittanceVolumeMillionUsd - a.remittanceVolumeMillionUsd);

export const flightHandler: MicroappHandler = {
  id: 'flight',
  name: 'Global Flight & Remittance Corridors',
  description:
    'Top international flight corridors, origin-destination coordinates, passenger volume estimates, and remittance volume',
  version: '1.0.0',
  cacheTtlSeconds: 86400,
  async handle(
    params: Record<string, any> = {},
    _env?: Env
  ): Promise<FlightCorridorsResult> {
    let corridors = [...allCorridors];

    if (params.region && params.region !== 'all') {
      const targetRegion = String(params.region).toLowerCase().trim();
      corridors = corridors.filter(
        (c) => c.region.toLowerCase() === targetRegion
      );
    }

    if (params.origin) {
      const targetOrigin = String(params.origin).toUpperCase().trim();
      corridors = corridors.filter((c) => c.originIso3 === targetOrigin);
    }

    if (params.minVolume !== undefined) {
      const minVol = Number(params.minVolume);
      if (!isNaN(minVol)) {
        corridors = corridors.filter(
          (c) => c.remittanceVolumeMillionUsd >= minVol
        );
      }
    }

    return {
      destination: JAKARTA_DESTINATION,
      totalCorridors: corridors.length,
      corridors,
      source: 'Global Flight & Remittance Corridors',
    };
  },
};
