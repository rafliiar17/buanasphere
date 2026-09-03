/**
 * Kurs World / GeoGlobe — Global Seismic & Earthquake Disaster Dataset (ADR 0044).
 * Comprehensive dataset tracking real-time significant seismic events (M4.5+),
 * tectonic plate boundaries, fault lines, and national earthquake vulnerability tiers.
 */

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
export const GLOBAL_EARTHQUAKES: EarthquakeRecord[] = [
  // 🇮🇩 Indonesia (Ring of Fire & Megathrust Zones)
  {
    id: 'eq-idn-sunda-2026',
    lat: -6.48,
    lng: 105.15,
    magnitude: 6.2,
    depthKm: 42,
    place: 'Selat Sunda, Banten (Zona Megathrust Selat Sunda)',
    timestamp: '2026-08-28T04:15:00Z',
    tsunamiWarning: true,
    seismicRiskTier: 'high',
    countryIso3: 'IDN',
  },
  {
    id: 'eq-idn-mentawai-2026',
    lat: -1.95,
    lng: 99.42,
    magnitude: 5.8,
    depthKm: 24,
    place: 'Kepulauan Mentawai, Sumatera Barat (Sesar Mentawai)',
    timestamp: '2026-08-20T11:22:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'high',
    countryIso3: 'IDN',
  },
  {
    id: 'eq-idn-banda-2026',
    lat: -6.82,
    lng: 129.75,
    magnitude: 5.5,
    depthKm: 160,
    place: 'Laut Banda, Maluku (Subduksi Laut Dalam Banda)',
    timestamp: '2026-08-15T18:05:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'moderate',
    countryIso3: 'IDN',
  },
  {
    id: 'eq-idn-cianjur-2026',
    lat: -6.84,
    lng: 107.09,
    magnitude: 5.6,
    depthKm: 11,
    place: 'Cianjur, Jawa Barat (Sesar Aktif Cugenang)',
    timestamp: '2026-08-05T06:21:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'high',
    countryIso3: 'IDN',
  },

  // 🇯🇵 Japan (Nankai Trough & Pacific Ring of Fire)
  {
    id: 'eq-jpn-nankai-2026',
    lat: 31.80,
    lng: 131.70,
    magnitude: 7.1,
    depthKm: 30,
    place: 'Miyazaki, Kyushu (Zona Palung Nankai), Japan',
    timestamp: '2026-08-08T07:43:00Z',
    tsunamiWarning: true,
    seismicRiskTier: 'high',
    countryIso3: 'JPN',
  },

  // 🇹🇷 Türkiye (East Anatolian Fault System)
  {
    id: 'eq-tur-marash-2026',
    lat: 37.52,
    lng: 36.93,
    magnitude: 6.8,
    depthKm: 14,
    place: 'Kahramanmaraş, Türkiye (Sesar Anatolia Timur)',
    timestamp: '2026-07-29T14:10:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'high',
    countryIso3: 'TUR',
  },

  // 🇨🇱 Chile (Peru-Chile Subduction Trench)
  {
    id: 'eq-chl-valpo-2026',
    lat: -32.82,
    lng: -71.65,
    magnitude: 6.5,
    depthKm: 28,
    place: 'Lepas Pantai Valparaíso (Palung Peru-Chili)',
    timestamp: '2026-08-12T22:30:00Z',
    tsunamiWarning: true,
    seismicRiskTier: 'high',
    countryIso3: 'CHL',
  },

  // 🇺🇸 United States (Aleutian Arc & California San Andreas)
  {
    id: 'eq-usa-alaska-2026',
    lat: 54.18,
    lng: -164.55,
    magnitude: 6.3,
    depthKm: 19,
    place: 'Fox Islands, Palung Aleutian, Alaska, USA',
    timestamp: '2026-08-19T03:50:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'high',
    countryIso3: 'USA',
  },

  // 🇵🇭 Philippines (Philippine Mobile Belt & Trench)
  {
    id: 'eq-phl-mindanao-2026',
    lat: 7.78,
    lng: 126.32,
    magnitude: 6.0,
    depthKm: 35,
    place: 'Davao Oriental, Mindanao (Palung Filipina)',
    timestamp: '2026-08-14T09:15:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'high',
    countryIso3: 'PHL',
  },

  // 🇹🇼 Taiwan (Eurasian & Philippine Sea Plate Boundary)
  {
    id: 'eq-twn-hualien-2026',
    lat: 23.98,
    lng: 121.62,
    magnitude: 6.1,
    depthKm: 15,
    place: 'Hualien County (Sesar Longitudinal Lembah), Taiwan',
    timestamp: '2026-08-17T21:05:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'high',
    countryIso3: 'TWN',
  },

  // 🇲🇽 Mexico (Cocos Plate Subduction / Middle America Trench)
  {
    id: 'eq-mex-oaxaca-2026',
    lat: 16.22,
    lng: -97.82,
    magnitude: 5.9,
    depthKm: 22,
    place: 'Oaxaca, Mexico (Zona Subduksi Lempeng Cocos)',
    timestamp: '2026-08-10T19:40:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'moderate',
    countryIso3: 'MEX',
  },

  // 🇳🇿 New Zealand (Alpine Fault & Hikurangi Trench)
  {
    id: 'eq-nzl-kermadec-2026',
    lat: -35.21,
    lng: 178.43,
    magnitude: 5.7,
    depthKm: 45,
    place: 'Palung Kermadec, North Island, New Zealand',
    timestamp: '2026-08-02T13:12:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'moderate',
    countryIso3: 'NZL',
  },

  // 🇬🇷 Greece (Hellenic Subduction Arc)
  {
    id: 'eq-grc-crete-2026',
    lat: 35.12,
    lng: 25.34,
    magnitude: 5.2,
    depthKm: 18,
    place: 'Heraklion, Pulau Kreta (Busur Hellenik), Yunani',
    timestamp: '2026-08-04T08:00:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'moderate',
    countryIso3: 'GRC',
  },

  // 🇮🇸 Iceland (Mid-Atlantic Ridge Spreading Center)
  {
    id: 'eq-isl-reykjanes-2026',
    lat: 63.88,
    lng: -22.42,
    magnitude: 4.9,
    depthKm: 5,
    place: 'Semenanjung Reykjanes (Punggung Atlantik Tengah), Islandia',
    timestamp: '2026-08-25T16:45:00Z',
    tsunamiWarning: false,
    seismicRiskTier: 'moderate',
    countryIso3: 'ISL',
  },
];

/**
 * Detailed Seismic Profiles for Sovereign States
 */
export const COUNTRY_SEISMIC_DATASET: Record<string, Partial<CountrySeismicProfile>> = {
  IDN: {
    iso3: 'IDN',
    countryName: 'Indonesia',
    seismicRiskTier: 'high',
    seismicRiskScore: 96,
    tectonicPlate: 'Pertemuan Lempeng Indo-Australia, Eurasia & Pasifik',
    faultLines: ['Megathrust Sunda', 'Sesar Besar Sumatera (Semangko)', 'Sesar Palu-Koro', 'Sesar Cimandiri', 'Sesar Opak'],
    historicalMaxMagnitude: 9.1, // Gempa & Tsunami Aceh 2004
    tsunamiRisk: true,
    primaryRiskDescription: 'Titik temu 3 lempeng tektonik aktif utama dunia dengan potensi megathrust dan tsunami berkekuatan ekstrem.',
  },
  JPN: {
    iso3: 'JPN',
    countryName: 'Jepang',
    seismicRiskTier: 'high',
    seismicRiskScore: 98,
    tectonicPlate: 'Pertemuan Lempeng Pasifik, Laut Filipina & Amerika Utara',
    faultLines: ['Palung Nankai', 'Palung Jepang', 'Sesar Garis Median (MTL)'],
    historicalMaxMagnitude: 9.1, // Tohoku 2011
    tsunamiRisk: true,
    primaryRiskDescription: 'Aktivitas seismik harian sangat tinggi dengan sistem deteksi dini gempa tercanggih di dunia.',
  },
  TUR: {
    iso3: 'TUR',
    countryName: 'Türkiye',
    seismicRiskTier: 'high',
    seismicRiskScore: 92,
    tectonicPlate: 'Lempeng Anatolia terhimpit Lempeng Arab & Eurasia',
    faultLines: ['Sesar Anatolia Utara (NAF)', 'Sesar Anatolia Timur (EAF)'],
    historicalMaxMagnitude: 7.8, // Kahramanmaraş 2023
    tsunamiRisk: false,
    primaryRiskDescription: 'Sesar geser darat aktif dangkal berenergi masif yang melintasi pusat permukiman padat.',
  },
  CHL: {
    iso3: 'CHL',
    countryName: 'Chili',
    seismicRiskTier: 'high',
    seismicRiskScore: 95,
    tectonicPlate: 'Subduksi Lempeng Nazca ke bawah Lempeng Amerika Selatan',
    faultLines: ['Palung Peru-Chili', 'Sesar Liquiñe-Ofqui'],
    historicalMaxMagnitude: 9.5, // Gempa Valdivia 1960 (Terbesar dalam Sejarah Manusia)
    tsunamiRisk: true,
    primaryRiskDescription: 'Garis pantai subduksi terpanjang di Pasifik dengan standar konstruksi tahan gempa terkuat.',
  },
  USA: {
    iso3: 'USA',
    countryName: 'Amerika Serikat',
    seismicRiskTier: 'high',
    seismicRiskScore: 84,
    tectonicPlate: 'Lempeng Pasifik & Amerika Utara',
    faultLines: ['Sesar San Andreas', 'Zona Subduksi Cascadia', 'Palung Aleutian'],
    historicalMaxMagnitude: 9.2, // Alaska 1964
    tsunamiRisk: true,
    primaryRiskDescription: 'Risiko gempa megathrust Cascadia di Pasifik Barat Laut dan patahan sesar mendatar San Andreas California.',
  },
  PHL: {
    iso3: 'PHL',
    countryName: 'Filipina',
    seismicRiskTier: 'high',
    seismicRiskScore: 93,
    tectonicPlate: 'Philippine Mobile Belt & Lempeng Laut Filipina',
    faultLines: ['Sesar Filipina', 'Palung Filipina', 'Palung Manila'],
    historicalMaxMagnitude: 8.0, // Teluk Moro 1976
    tsunamiRisk: true,
    primaryRiskDescription: 'Kepulauan cincin api vulkanik aktif dengan frekuensi gempa intra-plate dan busur kepulauan tinggi.',
  },
  TWN: {
    iso3: 'TWN',
    countryName: 'Taiwan',
    seismicRiskTier: 'high',
    seismicRiskScore: 90,
    tectonicPlate: 'Tumbukan Lempeng Laut Filipina & Eurasia',
    faultLines: ['Sesar Longitudinal Valley', 'Palung Ryukyu', 'Palung Manila'],
    historicalMaxMagnitude: 7.7, // Chi-Chi 1999
    tsunamiRisk: false,
    primaryRiskDescription: 'Laju tumbukan tektonik mencapai 8 cm/tahun memicu kegempaan dangkal berkala di pesisir timur.',
  },
  MEX: {
    iso3: 'MEX',
    countryName: 'Meksiko',
    seismicRiskTier: 'high',
    seismicRiskScore: 88,
    tectonicPlate: 'Subduksi Lempeng Cocos & Rivera di bawah Lempeng Amerika Utara',
    faultLines: ['Palung Amerika Tengah (MAT)', 'Sesar San Andreas Selatan'],
    historicalMaxMagnitude: 8.2, // Chiapas 2017
    tsunamiRisk: true,
    primaryRiskDescription: 'Karakteristik tanah lunak lembah Mexico City memperkuat resonansi gelombang gempa subduksi laut.',
  },
  NZL: {
    iso3: 'NZL',
    countryName: 'Selandia Baru',
    seismicRiskTier: 'high',
    seismicRiskScore: 87,
    tectonicPlate: 'Batas Lempeng Pasifik & Indo-Australia',
    faultLines: ['Sesar Alpine', 'Zona Subduksi Hikurangi', 'Palung Puysegur'],
    historicalMaxMagnitude: 8.2, // Wairarapa 1855
    tsunamiRisk: true,
    primaryRiskDescription: 'Tumbukan transpresional menghasilkan pegunungan Southern Alps dan aktivitas seismik reguler.',
  },
  GRC: {
    iso3: 'GRC',
    countryName: 'Yunani',
    seismicRiskTier: 'moderate',
    seismicRiskScore: 78,
    tectonicPlate: 'Busur Subduksi Hellenik & Mikro-lempeng Aegea',
    faultLines: ['Busur Hellenik', 'Palung Pliny-Strabo', 'Sesar Teluk Korintus'],
    historicalMaxMagnitude: 7.5, // Amorgos 1956
    tsunamiRisk: true,
    primaryRiskDescription: 'Wilayah paling aktif secara seismik di benua Eropa dengan potensi gempa dangkal di kepulauan Mediterania.',
  },
  ISL: {
    iso3: 'ISL',
    countryName: 'Islandia',
    seismicRiskTier: 'moderate',
    seismicRiskScore: 75,
    tectonicPlate: 'Punggung Tengah Atlantik (Lempeng Amerika Utara & Eurasia)',
    faultLines: ['Zona Retakan Reykjanes', 'Zona Vulkanik Bárðarbunga'],
    historicalMaxMagnitude: 7.1, // South Iceland 1784
    tsunamiRisk: false,
    primaryRiskDescription: 'Gempa swarm akibat pergerakan magma vulkanik dan pemisahan lempeng tektonik samudera.',
  },
  ITA: {
    iso3: 'ITA',
    countryName: 'Italia',
    seismicRiskTier: 'moderate',
    seismicRiskScore: 76,
    tectonicPlate: 'Mikro-lempeng Adria & Pegunungan Apennine',
    faultLines: ['Sesar Sesar Apennine', 'Busur Calabria'],
    historicalMaxMagnitude: 7.1, // Messina 1908
    tsunamiRisk: true,
    primaryRiskDescription: 'Sesar ekstensional dangkal di sepanjang punggung semenanjung Italia rawan merusak bangunan bersejarah.',
  },
};

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
