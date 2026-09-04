/**
 * Kurs World / GeoGlobe — Population World Micro-App Plugin (ADR 0066).
 * Visualizes global population dynamics, density choropleth, growth rates,
 * and urbanization stats with live World Bank Open Data integration.
 */

import type { CountrySpatialMetadata, GeoAppPlugin, InspectorWidget } from '../types';
import {
  type CountryPopulationData,
  getPopulationDataForCountry,
} from '../data/populationData';
import { getPopulatedPlacesByLOD } from '../data/populatedPlacesData';
import { fetchWorldBankPopulation } from '$lib/features/map/services/livePopulationService';
import { formatCompactNumber } from '$lib/formatters/currency';

export const populationApp: GeoAppPlugin<CountryPopulationData> = {
  id: 'population-world',
  name: 'Population World',
  tagline: 'Peta Demografi Global, Kepadatan Penduduk & Dinamika Populasi Dunia',
  icon: 'Users',
  category: 'demographics',
  defaultMetricId: 'population_total',
  canonicalPath: '/population',
  aliasPaths: ['/demographics', '/populasi', '/people', '/penduduk'],
  branding: {
    main: 'Population',
    sub: '.World',
    accentColor: '#3b82f6',
    disclaimer: 'Data demografi & sensus penduduk global · Sumber: World Bank Open Data & PBB · Gratis',
  },
  splash: {
    stepText: 'Memuat Dinamika Populasi & Demografi Global...',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-indigo-600',
  },
  filterOptions: [
    { id: 'all', label: 'Semua Negara' },
    { id: 'megacountries', label: 'Mega-Populasi (>100 Juta) 👥' },
    { id: 'dense', label: 'Sangat Padat (>300/km²) 🏙️' },
    { id: 'fast_growing', label: 'Tumbuh Cepat (>1.5%/thn) 📈' },
    { id: 'urban', label: 'Mayoritas Perkotaan (>75%) 🌆' },
  ],
  filterPredicate: (iso3: string, filterValue: unknown, data?: CountryPopulationData) => {
    const filter = String(filterValue || 'all');
    if (filter === 'all') return true;
    const pop = data ?? getPopulationDataForCountry(iso3);
    if (filter === 'megacountries') return pop.totalPopulation >= 100_000_000;
    if (filter === 'dense') return pop.densityKm2 >= 300;
    if (filter === 'fast_growing') return pop.growthRateAnnual >= 1.5;
    if (filter === 'urban') return pop.urbanPercent >= 75;
    return true;
  },
  metrics: [
    {
      id: 'population_total',
      label: 'Total Populasi (Jumlah Penduduk)',
      unit: 'Jiwa',
      formatValue: (val: unknown) => `${formatCompactNumber(Number(val ?? 0))} Jiwa`,
      colorScale: (_normalized: number, raw?: unknown) => {
        const pop = Number(raw ?? 0);
        if (pop >= 1_000_000_000) return '#1e3a8a';
        if (pop >= 200_000_000) return '#1d4ed8';
        if (pop >= 100_000_000) return '#2563eb';
        if (pop >= 50_000_000) return '#3b82f6';
        if (pop >= 10_000_000) return '#60a5fa';
        return '#93c5fd';
      },
    },
    {
      id: 'population_density',
      label: 'Kepadatan Penduduk (Jiwa / km²)',
      unit: 'jiwa/km²',
      formatValue: (val: unknown) => `${Number(val ?? 0).toLocaleString('id-ID')} jiwa/km²`,
      colorScale: (_normalized: number, raw?: unknown) => {
        const density = Number(raw ?? 0);
        if (density >= 1000) return '#dc2626';
        if (density >= 500) return '#ea580c';
        if (density >= 200) return '#d97706';
        if (density >= 100) return '#ca8a04';
        if (density >= 50) return '#16a34a';
        return '#0284c7';
      },
    },
    {
      id: 'population_growth',
      label: 'Pertumbuhan Penduduk Tahunan',
      unit: '% / tahun',
      formatValue: (val: unknown) => {
        const rate = Number(val ?? 0);
        return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}% / tahun`;
      },
      colorScale: (_normalized: number, raw?: unknown) => {
        const rate = Number(raw ?? 0);
        if (rate < 0) return '#dc2626';
        if (rate < 0.5) return '#eab308';
        if (rate < 1.5) return '#10b981';
        return '#3b82f6';
      },
    },
    {
      id: 'urbanization',
      label: 'Tingkat Urbanisasi Penduduk',
      unit: '% Perkotaan',
      formatValue: (val: unknown) => `${Number(val ?? 0).toFixed(1)}% di Perkotaan`,
      colorScale: (_normalized: number, raw?: unknown) => {
        const u = Number(raw ?? 0);
        if (u >= 80) return '#7c3aed';
        if (u >= 65) return '#2563eb';
        if (u >= 50) return '#0d9488';
        return '#16a34a';
      },
    },
  ],

  dataLoader: async (countries: CountrySpatialMetadata[]) => {
    const liveResult = await fetchWorldBankPopulation();
    const liveMap = liveResult.data;
    const dataMap: Record<string, CountryPopulationData> = {};

    for (const country of countries) {
      dataMap[country.iso3] = liveMap[country.iso3] ?? getPopulationDataForCountry(country.iso3, country.countryName);
    }

    return dataMap;
  },

  getPolygonColor: (
    country: CountrySpatialMetadata,
    data: CountryPopulationData | undefined,
    activeMetric: string,
    theme: 'dark' | 'light'
  ): string => {
    const isDark = theme === 'dark';
    const pop = data ?? getPopulationDataForCountry(country.iso3, country.countryName);

    if (activeMetric === 'population_density') {
      const d = pop.densityKm2;
      if (d >= 1000) return 'rgba(220, 38, 38, 0.90)';
      if (d >= 500) return 'rgba(234, 88, 12, 0.85)';
      if (d >= 200) return 'rgba(217, 119, 6, 0.80)';
      if (d >= 100) return 'rgba(202, 138, 4, 0.75)';
      if (d >= 50) return 'rgba(22, 163, 74, 0.70)';
      return isDark ? 'rgba(2, 132, 199, 0.65)' : 'rgba(2, 132, 199, 0.55)';
    }

    if (activeMetric === 'population_growth') {
      const g = pop.growthRateAnnual;
      if (g < 0) return 'rgba(220, 38, 38, 0.85)';
      if (g < 0.5) return 'rgba(234, 179, 8, 0.80)';
      if (g < 1.5) return 'rgba(16, 185, 129, 0.80)';
      return 'rgba(59, 130, 246, 0.85)';
    }

    if (activeMetric === 'urbanization') {
      const u = pop.urbanPercent;
      if (u >= 80) return 'rgba(124, 58, 237, 0.85)';
      if (u >= 65) return 'rgba(37, 99, 235, 0.80)';
      if (u >= 50) return 'rgba(13, 148, 136, 0.75)';
      return 'rgba(22, 163, 74, 0.70)';
    }

    // Default: population_total
    const p = pop.totalPopulation;
    if (p >= 1_000_000_000) return 'rgba(30, 58, 138, 0.95)';
    if (p >= 200_000_000) return 'rgba(29, 78, 216, 0.90)';
    if (p >= 100_000_000) return 'rgba(37, 99, 235, 0.85)';
    if (p >= 50_000_000) return 'rgba(59, 130, 246, 0.80)';
    if (p >= 10_000_000) return 'rgba(96, 165, 250, 0.70)';
    return isDark ? 'rgba(147, 197, 253, 0.50)' : 'rgba(147, 197, 253, 0.60)';
  },

  getTooltipHtml: (
    country: CountrySpatialMetadata,
    data: CountryPopulationData | undefined,
    _activeMetric: string,
    theme: 'dark' | 'light'
  ): string => {
    const isDark = theme === 'dark';
    const name = country.countryName;
    const pop = data ?? getPopulationDataForCountry(country.iso3, country.countryName);

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#1e3a8a' : '#bfdbfe'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 230px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">${country.flagEmoji}</span>
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
          </div>
          <span style="font-size: 10px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 2px 6px; border-radius: 6px; font-family: monospace;">Rank #${pop.globalRank}</span>
        </div>
        <div style="font-size: 14px; font-weight: 800; color: ${isDark ? '#60a5fa' : '#2563eb'}; margin-bottom: 4px;">
          👥 ${pop.totalPopulation.toLocaleString('id-ID')} Jiwa
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 2px;">
          Kepadatan: <strong style="color: ${isDark ? '#cbd5e1' : '#334155'};">${pop.densityKm2.toLocaleString('id-ID')} jiwa/km²</strong>
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'};">
          Urban: <strong style="color: ${isDark ? '#cbd5e1' : '#334155'};">${pop.urbanPercent.toFixed(1)}%</strong> • Pertumbuhan: <strong style="color: ${pop.growthRateAnnual >= 0 ? '#10b981' : '#ef4444'};">${pop.growthRateAnnual >= 0 ? '+' : ''}${pop.growthRateAnnual.toFixed(2)}%</strong>
        </div>
      </div>
    `;
  },

  getPinLabel: (country: CountrySpatialMetadata, data: CountryPopulationData | undefined) => {
    const pop = data ?? getPopulationDataForCountry(country.iso3, country.countryName);
    return {
      text: `${country.countryName} (${formatCompactNumber(pop.totalPopulation)})`,
      shortText: formatCompactNumber(pop.totalPopulation),
    };
  },

  renderInspector: (country: CountrySpatialMetadata, data: CountryPopulationData | undefined): InspectorWidget => {
    const pop = data ?? getPopulationDataForCountry(country.iso3, country.countryName);

    return {
      title: `${country.flagEmoji} ${country.countryName}`,
      type: 'stats',
      primaryValue: `${pop.totalPopulation.toLocaleString('id-ID')} Jiwa`,
      subtitle: `Ibukota: ${pop.capitalCity || country.capital} • Benua: ${country.continent}`,
      badge: {
        text: `🌍 Peringkat Dunia #${pop.globalRank}`,
        variant: pop.globalRank <= 10 ? 'success' : 'info',
      },
      statsGrid: [
        {
          label: 'Total Populasi',
          value: `${formatCompactNumber(pop.totalPopulation)} Jiwa`,
          hint: `${pop.totalPopulation.toLocaleString('id-ID')} jiwa`,
        },
        {
          label: 'Peringkat Dunia',
          value: `#${pop.globalRank} dari 195 Negara`,
        },
        {
          label: 'Kepadatan Penduduk',
          value: `${pop.densityKm2.toLocaleString('id-ID')} jiwa/km²`,
          hint: pop.densityKm2 > 300 ? 'Sangat Padat' : 'Standar Regional',
        },
        {
          label: 'Pertumbuhan Penduduk',
          value: `${pop.growthRateAnnual >= 0 ? '+' : ''}${pop.growthRateAnnual.toFixed(2)}% / tahun`,
          hint: pop.growthRateAnnual < 0 ? 'Tren Depopulasi' : 'Pertumbuhan Positif',
        },
        {
          label: 'Tingkat Urbanisasi',
          value: `${pop.urbanPercent.toFixed(1)}% di Perkotaan`,
        },
        {
          label: 'Usia Median',
          value: pop.medianAge ? `${pop.medianAge.toFixed(1)} Tahun` : '31.5 Tahun',
        },
      ],
    };
  },

  getCustomLabels: (
    _data: Record<string, CountryPopulationData>,
    _activeMetric: string,
    _theme: 'dark' | 'light',
    _selectedIso3?: string,
    _simulationDate?: Date,
    cameraAltitude?: number
  ) => {
    const alt = cameraAltitude ?? 2.0;
    const places = getPopulatedPlacesByLOD(alt);
    return places.map((p) => {
      const popMillions = p.popMax / 1_000_000;
      let dotRadius = 0.25;
      if (popMillions >= 20) dotRadius = 0.70;
      else if (popMillions >= 10) dotRadius = 0.55;
      else if (popMillions >= 5) dotRadius = 0.40;
      else if (popMillions >= 2) dotRadius = 0.30;

      return {
        id: `pop-city-${p.nameascii.toLowerCase().replace(/\s+/g, '-')}`,
        lat: p.lat,
        lng: p.lng,
        text: `${p.name} (${formatCompactNumber(p.popMax)})`,
        shortText: formatCompactNumber(p.popMax),
        dotRadius,
        color: p.isMegacity ? '#38bdf8' : '#60a5fa',
        size: 0.6,
        iso3: p.countryIso3,
        city: p,
      };
    });
  },
};

