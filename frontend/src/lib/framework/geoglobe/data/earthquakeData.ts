/**
 * Kurs World / GeoGlobe — Global Seismic & Earthquake Disaster Dataset (ADR 0044 / ADR 0047).
 * Comprehensive dataset tracking real-time significant seismic events (M4.5+),
 * tectonic plate boundaries, fault lines, and national earthquake vulnerability tiers.
 * Decoupled into earthquake_dataset.json for modular loading.
 */

import earthquakeRaw from './earthquake_dataset.json';

export interface EarthquakeRecord {
  id: string;
  lat: number;
  lng: number;
  magnitude: number;
  depthKm: number;
  place: string;
  timestamp: string;
  tsunamiWarning: boolean;
  seismicRiskTier: 'high' | 'moderate' | 'low';
  countryIso3: string;
}

export interface CountrySeismicProfile {
  iso3: string;
  countryName: string;
  seismicRiskTier: 'high' | 'moderate' | 'low';
  seismicRiskScore: number; // 0 - 100
  tectonicPlate: string;
  faultLines: string[];
  historicalMaxMagnitude: number;
  recentEvents: EarthquakeRecord[];
  activeAlertCount: number;
  tsunamiRisk: boolean;
  primaryRiskDescription: string;
}

/**
 * Significant Recent Earthquakes Worldwide (M4.5+)
 */
export const GLOBAL_EARTHQUAKES: EarthquakeRecord[] = earthquakeRaw.earthquakes as unknown as EarthquakeRecord[];

/**
 * Detailed Seismic Profiles for Sovereign States
 */
export const COUNTRY_SEISMIC_DATASET: Record<string, Partial<CountrySeismicProfile>> =
  earthquakeRaw.countryProfiles as unknown as Record<string, Partial<CountrySeismicProfile>>;

/**
 * Retrieve seismic and earthquake profile for any country with robust defaults
 */
export function getEarthquakeDataForCountry(iso3: string, countryName?: string): CountrySeismicProfile {
  const base = COUNTRY_SEISMIC_DATASET[iso3];
  const countryEvents = GLOBAL_EARTHQUAKES.filter((e) => e.countryIso3 === iso3);

  if (base) {
    return {
      iso3,
      countryName: base.countryName || countryName || iso3,
      seismicRiskTier: base.seismicRiskTier || (countryEvents.length > 0 ? 'high' : 'low'),
      seismicRiskScore: base.seismicRiskScore ?? (countryEvents.length > 0 ? 80 : 25),
      tectonicPlate: base.tectonicPlate || 'Lempeng Kontinental Stabil',
      faultLines: base.faultLines || ['Patahan Lokal Minor'],
      historicalMaxMagnitude: base.historicalMaxMagnitude || (countryEvents[0]?.magnitude ?? 5.0),
      recentEvents: countryEvents,
      activeAlertCount: countryEvents.filter((e) => e.tsunamiWarning || e.magnitude >= 6.0).length,
      tsunamiRisk: base.tsunamiRisk ?? countryEvents.some((e) => e.tsunamiWarning),
      primaryRiskDescription: base.primaryRiskDescription || 'Aktivitas seismik tektonik terpantau dalam parameter normal stabil.',
    };
  }

  // Fallback for stable continental shield countries
  return {
    iso3,
    countryName: countryName || iso3,
    seismicRiskTier: 'low',
    seismicRiskScore: 20,
    tectonicPlate: 'Lempeng Tektonik Intraplate Stabil',
    faultLines: ['Patahan Seismik Purba Tidak Aktif'],
    historicalMaxMagnitude: 4.5,
    recentEvents: countryEvents,
    activeAlertCount: 0,
    tsunamiRisk: false,
    primaryRiskDescription: 'Wilayah perisai kontinental stabil dengan risiko gempa destruktif tergolong sangat rendah.',
  };
}
