/**
 * Kurs World / GeoGlobe — Earthquake & Natural Disaster Tracker Micro-App Plugin (ADR 0044).
 * Monitors global real-time seismic activities (M4.5+), tectonic plate margins,
 * fault systems, and pulses 3D epicenter wave propagation rings on Globe.gl.
 */

import type { CountrySpatialMetadata, GeoAppPlugin, GeoRing, InspectorWidget } from '../types';
import {
  type CountrySeismicProfile,
  type EarthquakeRecord,
  getEarthquakeDataForCountry,
  GLOBAL_EARTHQUAKES,
} from '../data/earthquakeData';
import {
  fetchLiveEarthquakes,
  getLiveEarthquakeRings,
} from '$lib/features/map/services/liveEarthquakeService';

export const earthquakeApp: GeoAppPlugin<CountrySeismicProfile> = {
  id: 'earthquake-tracker',
  name: 'Earthquake & Disaster Tracker',
  tagline: 'Pemantauan Aktivitas Seismik Global Real-Time & Peta Risiko Gempa Bumi',
  icon: 'Activity',
  category: 'disaster',
  defaultMetricId: 'seismic_risk',
  canonicalPath: '/quake',
  aliasPaths: ['/earthquake', '/gempa'],
  branding: {
    main: 'Quake',
    sub: '.World',
    accentColor: '#ef4444',
    disclaimer: 'Data seismik & peta risiko gempa bumi global · Sumber: USGS & BMKG · Gratis',
  },
  splash: {
    stepText: 'Memuat Pemantauan Seismik Global & Peta Risiko Gempa...',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-amber-600',
  },
  filterOptions: [
    { id: 'all', label: 'Semua Wilayah Seismik' },
    { id: 'high_risk', label: 'Risiko Tinggi (Ring of Fire) 🔴' },
    { id: 'm6_plus', label: 'Gempa Kuat (M6.0+) ⚡' },
    { id: 'tsunami_alert', label: 'Peringatan Tsunami 🌊' },
  ],
  filterPredicate: (iso3: string, filterValue: unknown, data?: CountrySeismicProfile) => {
    const profile = data ?? getEarthquakeDataForCountry(iso3);
    const filter = String(filterValue || 'all');
    if (filter === 'all') return true;
    if (filter === 'high_risk') return profile.seismicRiskTier === 'high';
    if (filter === 'm6_plus') return profile.recentEvents.some((e) => e.magnitude >= 6.0);
    if (filter === 'tsunami_alert') return profile.recentEvents.some((e) => e.tsunamiWarning) || profile.tsunamiRisk;
    return true;
  },
  metrics: [
    {
      id: 'seismic_risk',
      label: 'Tingkat Risiko Seismik',
      unit: 'Tingkat',
      formatValue: (val: unknown) => {
        const tier = String(val ?? 'low');
        if (tier === 'high') return 'Tinggi (High Risk)';
        if (tier === 'moderate') return 'Sedang (Moderate Risk)';
        return 'Rendah (Low Risk)';
      },
      colorScale: (_normalized: number, raw?: unknown) => {
        const tier = String(raw ?? 'low');
        if (tier === 'high') return '#ef4444';
        if (tier === 'moderate') return '#f97316';
        return '#10b981';
      },
    },
    {
      id: 'magnitude',
      label: 'Magnitudo Gempa Terkini',
      unit: 'Mw',
      formatValue: (val: unknown) => {
        const mag = Number(val ?? 0);
        return mag > 0 ? `M ${mag.toFixed(1)} Mw` : 'Tidak Ada Data';
      },
      colorScale: (_normalized: number, raw?: unknown) => {
        const mag = Number(raw ?? 0);
        if (mag >= 6.0) return '#ef4444';
        if (mag >= 5.0) return '#f97316';
        if (mag >= 4.5) return '#eab308';
        return '#64748b';
      },
    },
  ],

  dataLoader: async (countries: CountrySpatialMetadata[]): Promise<Record<string, CountrySeismicProfile>> => {
    const liveResult = await fetchLiveEarthquakes();
    const liveEvents = liveResult.events;

    const dataMap: Record<string, CountrySeismicProfile> = {};
    for (const country of countries) {
      const base = getEarthquakeDataForCountry(country.iso3, country.countryName);
      const matchedEvents = liveEvents.filter(
        (e) => e.countryIso3 === country.iso3 || (base.recentEvents && base.recentEvents.some((be) => be.id === e.id))
      );

      dataMap[country.iso3] = {
        ...base,
        recentEvents: matchedEvents.length > 0 ? matchedEvents : base.recentEvents,
        activeAlertCount: matchedEvents.filter((e) => e.magnitude >= 5.0).length,
      };
    }
    return dataMap;
  },

  getRingData: (country: CountrySpatialMetadata, allData: Record<string, CountrySeismicProfile>): GeoRing[] => {
    const events: EarthquakeRecord[] = [];
    if (country?.iso3 && allData?.[country.iso3]?.recentEvents?.length) {
      events.push(...allData[country.iso3].recentEvents);
    } else if (allData && Object.keys(allData).length > 0) {
      for (const c of Object.values(allData)) {
        if (c?.recentEvents?.length) {
          events.push(...c.recentEvents);
        }
      }
    }

    const safeEvents = events.length > 0 ? events : GLOBAL_EARTHQUAKES;
    return getLiveEarthquakeRings(safeEvents);
  },

  getPolygonColor: (
    country: CountrySpatialMetadata,
    data: CountrySeismicProfile | undefined,
    activeMetric: string,
    theme: 'dark' | 'light'
  ): string => {
    const isDark = theme === 'dark';
    const cData = data ?? getEarthquakeDataForCountry(country.iso3, country.countryName);
    const tier = cData?.seismicRiskTier ?? 'low';

    if (activeMetric === 'magnitude') {
      const latestMag = cData?.recentEvents?.[0]?.magnitude ?? 0;
      if (latestMag >= 6.0) return 'rgba(239, 68, 68, 0.85)';
      if (latestMag >= 5.0) return 'rgba(249, 115, 22, 0.80)';
      if (latestMag >= 4.5) return 'rgba(234, 179, 8, 0.75)';
      return isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(203, 213, 225, 0.45)';
    }

    // activeMetric === 'seismic_risk' (default)
    if (tier === 'high') return 'rgba(239, 68, 68, 0.85)';
    if (tier === 'moderate') return 'rgba(249, 115, 22, 0.75)';
    return isDark ? 'rgba(30, 41, 59, 0.40)' : 'rgba(226, 232, 240, 0.50)';
  },

  getTooltipHtml: (
    country: CountrySpatialMetadata,
    data: CountrySeismicProfile | undefined,
    _activeMetric: string,
    theme: 'dark' | 'light'
  ): string => {
    const isDark = theme === 'dark';
    const cData = data ?? getEarthquakeDataForCountry(country.iso3, country.countryName);
    const latest = cData.recentEvents?.[0];
    const riskColor =
      cData.seismicRiskTier === 'high'
        ? '#ef4444'
        : cData.seismicRiskTier === 'moderate'
          ? '#f97316'
          : '#10b981';
    const riskLabel =
      cData.seismicRiskTier === 'high'
        ? 'Tinggi (High Risk)'
        : cData.seismicRiskTier === 'moderate'
          ? 'Sedang (Moderate)'
          : 'Rendah (Low Risk)';

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#e2e8f0'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 240px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">${country.flagEmoji}</span>
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${country.countryName}</span>
          </div>
          <span style="font-size: 10px; font-weight: 700; color: ${riskColor}; font-family: monospace; border: 1px solid ${riskColor}; padding: 2px 6px; border-radius: 9999px;">${riskLabel}</span>
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 4px;">
          ${cData.tectonicPlate}
        </div>
        ${
          latest
            ? `
          <div style="font-size: 12px; font-weight: 700; color: ${isDark ? '#f8fafc' : '#0f172a'}; margin-top: 4px;">
            ⚡ M ${latest.magnitude.toFixed(1)} — ${latest.place}
          </div>
          <div style="font-size: 10px; color: ${isDark ? '#cbd5e1' : '#475569'}; margin-top: 2px;">
            Kedalaman: ${latest.depthKm} km ${latest.tsunamiWarning ? '• <span style="color: #ef4444; font-weight: 700;">⚠️ Peringatan Tsunami</span>' : ''}
          </div>
        `
            : `
          <div style="font-size: 11px; color: ${isDark ? '#64748b' : '#94a3b8'}; margin-top: 4px;">
            Tidak ada gempa kuat terbaru dalam pemantauan.
          </div>
        `
        }
      </div>
    `;
  },

  getPinLabel: (
    country: CountrySpatialMetadata,
    data: CountrySeismicProfile | undefined,
    _activeMetric: string
  ): { text: string; shortText: string } => {
    const cData = data ?? getEarthquakeDataForCountry(country.iso3, country.countryName);
    const latest = cData.recentEvents?.[0];
    if (latest) {
      return {
        text: `⚡ ${country.countryName} (M${latest.magnitude.toFixed(1)})`,
        shortText: `M${latest.magnitude.toFixed(1)}`,
      };
    }
    const tierIcon =
      cData.seismicRiskTier === 'high' ? '🌋' : cData.seismicRiskTier === 'moderate' ? '⚠️' : '🛡️';
    return {
      text: `${tierIcon} ${country.countryName}`,
      shortText: tierIcon,
    };
  },

  renderInspector: (
    country: CountrySpatialMetadata,
    data: CountrySeismicProfile | undefined,
    _allData?: Record<string, CountrySeismicProfile>
  ): InspectorWidget => {
    const cData = data ?? getEarthquakeDataForCountry(country.iso3, country.countryName);
    const latest = cData.recentEvents?.[0];
    const riskLabel =
      cData.seismicRiskTier === 'high'
        ? 'Tinggi (High Risk)'
        : cData.seismicRiskTier === 'moderate'
          ? 'Sedang (Moderate Risk)'
          : 'Rendah (Low Risk)';

    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'stats',
      primaryValue: latest ? `M ${latest.magnitude.toFixed(1)} — ${latest.place}` : `Risiko ${riskLabel}`,
      subtitle: `Lempeng: ${cData.tectonicPlate}`,
      badge: {
        text: latest?.tsunamiWarning
          ? '⚠️ Peringatan Tsunami Aktif'
          : `Risiko Seismik: ${riskLabel}`,
        variant:
          cData.seismicRiskTier === 'high'
            ? 'danger'
            : cData.seismicRiskTier === 'moderate'
              ? 'warning'
              : 'success',
      },
      statsGrid: [
        {
          label: 'Gempa Terkini',
          value: latest ? `M ${latest.magnitude.toFixed(1)} Mw` : 'Stabil',
        },
        {
          label: 'Kedalaman Hiposenter',
          value: latest ? `${latest.depthKm} km` : '-',
        },
        {
          label: 'Tingkat Risiko',
          value: riskLabel,
        },
        {
          label: 'Sesar Aktif Utama',
          value: cData.faultLines?.slice(0, 2).join(', ') || 'Patahan Minor',
        },
        {
          label: 'Histori Gempa Terbesar',
          value: `M ${cData.historicalMaxMagnitude.toFixed(1)} Mw`,
        },
        {
          label: 'Peringatan Tsunami',
          value: latest?.tsunamiWarning ? 'Aktif 🌊' : 'Tidak Ada',
        },
      ],
      customData: cData,
    };
  },
};
