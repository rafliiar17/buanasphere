<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Loader2 } from 'lucide-svelte';
  import type { MapStateStore } from '../mapState';
  import type { MapCountryData } from '../map-constants';
  import { REGION_FILTERS } from '../map-constants';
  import { getCountryFlagColor } from '../country-flag-colors';
  import { createProceduralFlagMaterial, disposeProceduralFlagCache } from '../procedural-flags';
  import { formatRupiah, formatPercent } from '$lib/formatters/currency';
  import { t } from '$lib/i18n';
  import type { Theme } from '$lib/theme';
  import { geoStore } from '$lib/framework/geoglobe/geoStore.svelte';
  import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
  import { calculateLocalTime, isDaylight, formatUtcOffset } from '$lib/framework/geoglobe/geoMath';

  interface Props {
    geoJsonFeatures: any[];
    mapData: MapCountryData[];
    mapState: MapStateStore;
    currentTheme: Theme;
    onCountryClick?: (country: MapCountryData) => void;
    onCountryHover?: (iso3: string | null) => void;
    onReady?: () => void;
  }

  let {
    geoJsonFeatures,
    mapData,
    mapState,
    currentTheme,
    onCountryClick,
    onCountryHover,
    onReady,
  }: Props = $props();

  let globeContainer = $state<HTMLDivElement | null>(null);
  let globeInstance: any = null;
  let GlobeModule: any = null;
  let resizeObserver: ResizeObserver | null = null;
  let isInitialized = $state(false);

  // Holographic Lazy-Loading & Transition State (ADR 0032)
  let isSwitchingMetric = $state(false);
  let transitionLabel = $state('Mengalibrasi Tampilan Globe...');
  let previousMetric = $state<string>('');

  function getTransitionMessage(metric: string): string {
    if (metric === 'flag') return '🎨 Memuat & Memetakan Tekstur Bendera 195+ Negara...';
    if (metric === 'rate') return '🪙 Mengalibrasi Shader Spot Rate Rupiah...';
    if (metric === 'change') return '📈 Mengalibrasi Indikator Performa 24 Jam...';
    return '⚡ Memperbarui Tampilan Globe...';
  }

  // ISO-3 to ISO-2 Fallback Mapping for FlagCDN
  const ISO3_TO_ISO2_MAP: Record<string, string> = {
    IDN: 'id', USA: 'us', JPN: 'jp', CHN: 'cn', GBR: 'gb', DEU: 'de', FRA: 'fr', SGP: 'sg',
    AUS: 'au', SAU: 'sa', MYS: 'my', THA: 'th', IND: 'in', BRA: 'br', ZAF: 'za', KOR: 'kr',
    CAN: 'ca', RUS: 'ru', ITA: 'it', ESP: 'es', TUR: 'tr', EGY: 'eg', ARE: 'ae', PHL: 'ph',
    VNM: 'vn', KAZ: 'kz', NLD: 'nl', CHE: 'ch', SWE: 'se', NOR: 'no', DNK: 'dk', POL: 'pl',
    MEX: 'mx', ARG: 'ar', CHL: 'cl', COL: 'co', PER: 'pe', NZL: 'nz', QAT: 'qa', KWT: 'kw',
    OMN: 'om', BHR: 'bh', JOR: 'jo', LBN: 'lb', IRQ: 'iq', ISR: 'il', IRN: 'ir', PAK: 'pk',
    BGD: 'bd', LKA: 'lk', NPL: 'np', MMR: 'mm', KHM: 'kh', LAO: 'la', BRN: 'bn', NGA: 'ng',
    KEN: 'ke', GHA: 'gh', MAR: 'ma', DZA: 'dz', TUN: 'tn', ETH: 'et', TZA: 'tz', UGA: 'ug',
    UKR: 'ua', ROU: 'ro', CZE: 'cz', GRC: 'gr', PRT: 'pt', BEL: 'be', AUT: 'at', IRL: 'ie',
    FIN: 'fi', HUN: 'hu', HRV: 'hr', BGR: 'bg', SRB: 'rs', SVK: 'sk', SVN: 'si', EST: 'ee',
    LVA: 'lv', LTU: 'lt', CYP: 'cy', ISL: 'is', LUX: 'lu', MLT: 'mt', GEO: 'ge', ARM: 'am',
    AZE: 'az', UZB: 'uz', TKM: 'tm', TJK: 'tj', KGZ: 'kg', MNG: 'mn', TWN: 'tw', HKG: 'hk',
    MAC: 'mo', FJI: 'fj', PNG: 'pg', SLB: 'sb', VUT: 'vu', WSM: 'ws', TON: 'to', SOM: 'so',
  };

  function getFeatureIso3(feat: any): string {
    if (!feat || !feat.properties) return '';
    const p = feat.properties;
    const code = p.ISO_A3 || p.ADM0_A3 || p.SOV_A3 || p.adm0_a3 || p.iso_a3 || '';
    if (code === '-99' || !code) {
      return p.ADM0_A3 || p.SOV_A3 || p.GU_A3 || p.BRK_A3 || '';
    }
    return code;
  }

  function getFeatureIso2(feat: any): string {
    if (!feat || !feat.properties) return '';
    const p = feat.properties;
    const a2 = p.ISO_A2 || p.ISO_A2_EH || p.WB_A2 || p.POSTAL || p.FIPS_10 || '';
    if (a2 && a2 !== '-99' && a2.length === 2) {
      return a2.toLowerCase();
    }
    const iso3 = getFeatureIso3(feat);
    return (ISO3_TO_ISO2_MAP[iso3] || iso3.slice(0, 2)).toLowerCase();
  }

  const REMITTANCE_HUBS_SET = new Set(['SAU', 'MYS', 'TWN', 'HKG', 'SGP', 'JPN', 'USA', 'KOR', 'ARE', 'AUS']);

  const PASSPORT_SCORES_MAP: Record<string, { visaFree: number; rank: number; req: string }> = {
    SGP: { visaFree: 195, rank: 1, req: 'Visa Free' },
    JPN: { visaFree: 194, rank: 2, req: 'Visa Free' },
    DEU: { visaFree: 193, rank: 3, req: 'Visa Required' },
    FRA: { visaFree: 193, rank: 3, req: 'Visa Required' },
    ITA: { visaFree: 193, rank: 3, req: 'Visa Required' },
    ESP: { visaFree: 193, rank: 3, req: 'Visa Required' },
    KOR: { visaFree: 192, rank: 4, req: 'Visa Free' },
    GBR: { visaFree: 191, rank: 5, req: 'Visa Required' },
    USA: { visaFree: 188, rank: 8, req: 'Visa Required' },
    MYS: { visaFree: 183, rank: 12, req: 'Visa Free' },
    ARE: { visaFree: 182, rank: 13, req: 'eVisa' },
    BRN: { visaFree: 166, rank: 20, req: 'Visa Free' },
    THA: { visaFree: 82, rank: 64, req: 'Visa Free' },
    IDN: { visaFree: 78, rank: 68, req: 'Visa Free' },
    PHL: { visaFree: 69, rank: 75, req: 'Visa Free' },
    VNM: { visaFree: 55, rank: 88, req: 'Visa Free' },
    IND: { visaFree: 62, rank: 80, req: 'Visa on Arrival' },
    CHN: { visaFree: 85, rank: 60, req: 'Visa Required' },
    SAU: { visaFree: 88, rank: 58, req: 'eVisa' },
    TUR: { visaFree: 118, rank: 52, req: 'Visa Free' },
  };

  function getPolygonColor(feat: any): string {
    const isDark = currentTheme === 'dark';
    const iso3 = getFeatureIso3(feat);
    const country = mapData.find(d => d.iso3 === iso3);
    const spatial = EXTENDED_COUNTRIES_DATA.find(d => d.iso3 === iso3);
    const isSelected = mapState.selectedCountryIso3 === iso3;
    const isHovered = mapState.hoveredIso3 === iso3;

    if (isSelected) {
      return '#38bdf8'; // Glowing sky blue highlight
    }
    if (isHovered) {
      return '#34d399'; // Emerald hover
    }

    // Adapt by Active Micro-App
    const appId = geoStore.activeAppId;
    const isMatched = geoStore.isCountryMatched(iso3);

    // Dim non-matching countries when a specific filter is active
    if (!isMatched && (geoStore.timeFilter !== 'all' || geoStore.flightCorridorFilter !== 'all' || geoStore.passportVisaFilter !== 'all')) {
      return isDark ? 'rgba(30, 41, 59, 0.20)' : 'rgba(226, 232, 240, 0.35)';
    }

    if (appId === 'world-time') {
      if (!spatial) return isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.7)';
      const now = new Date();
      const local = calculateLocalTime(now, spatial.utcOffset);
      const isDay = isDaylight(local.hours);
      return isDay
        ? (isDark ? 'rgba(245, 158, 11, 0.85)' : 'rgba(217, 119, 6, 0.85)') // Amber Daylight
        : (isDark ? 'rgba(30, 58, 138, 0.80)' : 'rgba(30, 64, 175, 0.80)'); // Navy Midnight
    }

    if (appId === 'remittance-flow') {
      if (iso3 === 'IDN') return 'rgba(56, 189, 248, 0.95)';
      if (REMITTANCE_HUBS_SET.has(iso3)) return 'rgba(16, 185, 129, 0.85)';
      return isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.6)';
    }

    if (appId === 'passport-power') {
      const pScore = PASSPORT_SCORES_MAP[iso3]?.visaFree ?? 75;
      if (pScore >= 180) return 'rgba(16, 185, 129, 0.85)';
      if (pScore >= 120) return 'rgba(6, 182, 212, 0.80)';
      if (pScore >= 70) return 'rgba(245, 158, 11, 0.80)';
      return 'rgba(244, 63, 94, 0.80)';
    }

    // Default: fx-rates
    if (!country) {
      return isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.7)';
    }

    if (mapState.activeMetric === 'rate') {
      const r = country.middleRate;
      if (r > 20000) return isDark ? 'rgba(99, 102, 241, 0.90)' : 'rgba(79, 70, 229, 0.90)'; // Royal Indigo
      if (r > 14000) return isDark ? 'rgba(37, 99, 235, 0.90)' : 'rgba(29, 78, 216, 0.90)'; // Royal Blue
      if (r > 3000)  return isDark ? 'rgba(6, 182, 212, 0.85)' : 'rgba(8, 145, 178, 0.85)';  // Cyan Azure
      if (r > 500)   return isDark ? 'rgba(245, 158, 11, 0.85)' : 'rgba(217, 119, 6, 0.85)'; // Amber Gold
      return isDark ? 'rgba(234, 88, 12, 0.80)' : 'rgba(194, 65, 12, 0.80)';                // Sunset Orange
    } else if (mapState.activeMetric === 'change') {
      const chg = country.change24h;
      if (chg >= 0.20) return isDark ? 'rgba(16, 185, 129, 0.95)' : 'rgba(5, 150, 105, 0.95)'; // Strong Neon Green
      if (chg > 0.02)  return isDark ? 'rgba(34, 197, 94, 0.90)' : 'rgba(22, 163, 74, 0.90)';   // Bright Green
      if (chg > 0.00)  return isDark ? 'rgba(52, 211, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)'; // Mint Green
      if (chg <= -0.20) return isDark ? 'rgba(225, 29, 72, 0.95)' : 'rgba(190, 18, 60, 0.95)';  // Deep Crimson Red
      if (chg < -0.02) return isDark ? 'rgba(244, 63, 94, 0.90)' : 'rgba(225, 29, 72, 0.90)';   // Bright Red Coral
      if (chg < 0.00)  return isDark ? 'rgba(251, 113, 133, 0.85)' : 'rgba(244, 63, 94, 0.85)'; // Soft Rose Red
      return isDark ? 'rgba(100, 116, 139, 0.70)' : 'rgba(148, 163, 184, 0.75)';               // Neutral Slate
    } else {
      return getCountryFlagColor(iso3, isDark);
    }
  }

  function getTooltipHtml(feat: any): string {
    const isDark = currentTheme === 'dark';
    const iso3 = getFeatureIso3(feat);
    const iso2 = getFeatureIso2(feat);
    const country = mapData.find(d => d.iso3 === iso3);
    const spatial = EXTENDED_COUNTRIES_DATA.find(d => d.iso3 === iso3);
    const name = spatial?.countryName || country?.countryName || feat.properties?.NAME || feat.properties?.ADMIN || iso3;
    const capital = spatial?.capital || '';
    const appId = geoStore.activeAppId;

    if (appId === 'world-time') {
      const now = new Date();
      const offset = spatial?.utcOffset ?? 0;
      const local = calculateLocalTime(now, offset);
      const isDay = isDaylight(local.hours);
      const isWorking = local.hours >= 9 && local.hours < 17;
      const diffHours = offset - 7;
      const diffStr = diffHours === 0 ? 'Sama dengan WIB (UTC+7)' : `${diffHours > 0 ? '+' : ''}${diffHours} jam vs WIB`;

      return `
        <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="https://flagcdn.com/w40/${iso2}.png" alt="${name}" style="width: 20px; height: 14px; border-radius: 2px; object-fit: cover;" onerror="this.style.display='none'" />
              <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #38bdf8; font-family: monospace;">${formatUtcOffset(offset)}</span>
          </div>
          <div style="font-size: 20px; font-weight: 900; color: #38bdf8; font-family: monospace; letter-spacing: -0.03em; margin-bottom: 4px;">
            ${local.formatted}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; margin-bottom: 4px;">
            <span style="padding: 2px 6px; border-radius: 4px; background: ${isDay ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'}; color: ${isDay ? '#f59e0b' : '#60a5fa'};">
              ${isDay ? '☀️ Siang Hari' : '🌙 Malam Hari'}
            </span>
            <span style="padding: 2px 6px; border-radius: 4px; background: ${isWorking ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)'}; color: ${isWorking ? '#34d399' : '#94a3b8'};">
              ${isWorking ? '🏢 Jam Kantor' : '🏢 Tutup'}
            </span>
          </div>
        </div>
      `;
    }

    if (appId === 'remittance-flow') {
      const isHub = REMITTANCE_HUBS_SET.has(iso3);
      return `
        <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="https://flagcdn.com/w40/${iso2}.png" alt="${name}" style="width: 20px; height: 14px; border-radius: 2px; object-fit: cover;" onerror="this.style.display='none'" />
              <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; color: ${isHub ? '#10b981' : '#64748b'};">
              ${isHub ? '✈️ Koridor Aktif' : 'Non-Hub'}
            </span>
          </div>
          <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-bottom: 4px;">
            Rute: ${capital || name} ➔ Jakarta
          </div>
          <div style="font-size: 10px; color: #10b981; font-weight: 600;">
            👉 Klik untuk rincian arus remitansi 3D
          </div>
        </div>
      `;
    }

    if (appId === 'passport-power') {
      const pScore = PASSPORT_SCORES_MAP[iso3] ?? { visaFree: 75, rank: 70, req: 'Visa Required' };
      const reqColor = pScore.req === 'Visa Free' ? '#10b981' : (pScore.req === 'Visa on Arrival' || pScore.req === 'eVisa' ? '#f59e0b' : '#f43f5e');

      return `
        <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="https://flagcdn.com/w40/${iso2}.png" alt="${name}" style="width: 20px; height: 14px; border-radius: 2px; object-fit: cover;" onerror="this.style.display='none'" />
              <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; color: #10b981; font-family: monospace;">Rank #${pScore.rank}</span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'}; margin-bottom: 4px;">
            Akses Bebas: ${pScore.visaFree} Destinasi
          </div>
          <div style="font-size: 11px; font-weight: 700; color: ${reqColor};">
            Bagi WNI: ${pScore.req}
          </div>
        </div>
      `;
    }

    // Default: fx-rates
    const code = country?.currencyCode || '';
    const currName = country?.currencyName || '';
    const midFormatted = country ? formatRupiah(country.middleRate) : '-';
    const buyFormatted = country ? formatRupiah(country.buyRate) : '-';
    const sellFormatted = country ? formatRupiah(country.sellRate) : '-';
    const chgFormatted = country ? formatPercent(country.change24h) : '0.00%';
    const chgColor = (country?.change24h ?? 0) >= 0 ? '#10b981' : '#ef4444';

    if (mapState.activeMetric === 'change') {
      return `
        <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <img src="https://flagcdn.com/w40/${iso2}.png" alt="${name}" style="width: 22px; height: 15px; border-radius: 3px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'" />
            <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
            ${code ? `<span style="font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${code}</span>` : ''}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: ${chgColor}; margin: 6px 0 3px 0;">
            📈 Tren 24 Jam: ${chgFormatted} (${(country?.change24h ?? 0) >= 0 ? 'Menguat' : 'Melemah'})
          </div>
          <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 2px;">
            Kurs Tengah: ${midFormatted}
          </div>
          <div style="font-size: 10px; color: #38bdf8; margin-top: 4px; font-weight: 600;">
            👉 Klik untuk pilih • Klik 2x untuk split view
          </div>
        </div>
      `;
    }

    return `
      <div style="background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)'}; border: 1px solid ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.35); font-family: Inter, sans-serif; pointer-events: none; min-width: 220px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <img src="https://flagcdn.com/w40/${iso2}.png" alt="${name}" style="width: 22px; height: 15px; border-radius: 3px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'" />
          <span style="font-size: 13px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'};">${name}</span>
          ${code ? `<span style="font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${code}</span>` : ''}
        </div>
        ${currName ? `<div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 6px;">${currName}</div>` : ''}
        <div style="font-size: 12px; font-weight: 700; color: #10b981; margin-bottom: 2px;">
          Kurs Tengah: ${midFormatted}
        </div>
        <div style="font-size: 11px; color: ${isDark ? '#cbd5e1' : '#334155'}; margin-bottom: 2px;">
          Beli: ${buyFormatted} | Jual: ${sellFormatted}
        </div>
        <div style="font-size: 11px; font-weight: 700; color: ${chgColor};">
          24 Jam: ${chgFormatted}
        </div>
        <div style="font-size: 10px; color: #38bdf8; margin-top: 4px; font-weight: 600;">
          👉 Klik untuk pilih • Klik 2x untuk split view
        </div>
      </div>
    `;
  }

  // Major Trading Currencies Set for Level-of-Detail (LOD) Label Optimization
  const MAJOR_LOD_CURRENCIES = new Set([
    'IDN', 'USA', 'JPN', 'CHN', 'GBR', 'DEU', 'FRA', 'SGP', 'AUS', 'SAU',
    'MYS', 'THA', 'IND', 'BRA', 'ZAF', 'KOR', 'CAN', 'RUS', 'ITA', 'ESP',
    'TUR', 'EGY', 'ARE', 'CHE'
  ]);

  let lastHoveredIso3 = '';

  // Country 3D Pin Labels with LOD filtering (reduces draw calls by 85%)
  const globeLabels = $derived.by(() => {
    if (!geoJsonFeatures || geoJsonFeatures.length === 0 || !mapState.showLabels) return [];
    const isDark = currentTheme === 'dark';
    const selected = mapState.selectedCountryIso3;
    const hovered = mapState.hoveredIso3;

    // Filter features: major currencies OR actively hovered OR selected
    const visibleFeatures = geoJsonFeatures.filter((feat: any) => {
      const iso3 = getFeatureIso3(feat);
      if (iso3 === selected || iso3 === hovered) return true;
      return MAJOR_LOD_CURRENCIES.has(iso3);
    });

    return visibleFeatures.map((feat: any) => {
      const p = feat.properties;
      const iso3 = getFeatureIso3(feat);
      const country = mapData.find(d => d.iso3 === iso3);
      const rawName = country?.countryName || p.NAME || p.ADMIN || iso3;
      const curr = country?.currencyCode || '';
      const lat = Number(p.LABEL_Y) || 0;
      const lng = Number(p.LABEL_X) || 0;
      const isSelected = selected === iso3;
      const isHovered = hovered === iso3;
      const isMajor = MAJOR_LOD_CURRENCIES.has(iso3);

      const displayText = `${rawName} (${curr || iso3})`;

      return {
        iso3,
        country,
        lat,
        lng,
        text: displayText,
        shortText: curr || iso3,
        size: isSelected ? 0.65 : (isHovered ? 0.52 : (isMajor ? 0.36 : 0.28)),
        color: isSelected 
          ? '#38bdf8' 
          : (isHovered 
              ? '#34d399' 
              : (isDark ? 'rgba(241, 245, 249, 0.90)' : 'rgba(15, 23, 42, 0.90)')),
      };
    });
  });

  import { flowCorridorsApp } from '$lib/framework/geoglobe/plugins/flowCorridorsApp';

  // 3D Arcs for Flow Corridors filtered by active corridor region
  const remittanceArcs = $derived.by(() => {
    if (geoStore.activeAppId !== 'remittance-flow') return [];
    const indonesia = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN');
    if (!indonesia) return [];
    const allArcs = flowCorridorsApp.getArcData ? flowCorridorsApp.getArcData(indonesia as any, {} as any) : [];
    if (geoStore.flightCorridorFilter === 'all') return allArcs;

    return allArcs.filter(arc => {
      const originCountry = EXTENDED_COUNTRIES_DATA.find(
        c => Math.abs(c.lat - arc.startLat) < 2.0 && Math.abs(c.lng - arc.startLng) < 2.0
      );
      if (!originCountry) return true;
      return geoStore.isCountryMatched(originCountry.iso3);
    });
  });

  export function flyTo(lat: number, lng: number, altitude: number, durationMs: number = 1000) {
    if (globeInstance) {
      globeInstance.pointOfView({ lat, lng, altitude }, durationMs);
    }
  }

  export function updateVisuals() {
    if (!globeInstance) return;
    const isDark = currentTheme === 'dark';
    const isFlag = geoStore.activeAppId === 'fx-rates' && mapState.activeMetric === 'flag';

    if (!isFlag) {
      globeInstance.polygonCapMaterial(null);
    } else {
      globeInstance.polygonCapMaterial((d: any) => createProceduralFlagMaterial(d, isDark));
    }

    globeInstance
      .backgroundColor(isDark ? '#0B0F19' : '#FAF8F3')
      .atmosphereColor(isDark ? '#06b6d4' : '#38bdf8')
      .polygonCapColor((d: any) => getPolygonColor(d))
      .polygonAltitude((d: any) => {
        const iso3 = getFeatureIso3(d);
        if (mapState.selectedCountryIso3 === iso3 || mapState.hoveredIso3 === iso3) return 0.018;
        const isMatched = geoStore.isCountryMatched(iso3);
        if (!isMatched && (geoStore.timeFilter !== 'all' || geoStore.flightCorridorFilter !== 'all' || geoStore.passportVisaFilter !== 'all')) {
          return 0.001;
        }
        return 0.008;
      })
      .polygonsData(geoJsonFeatures.map(f => ({ ...f })))
      .labelsData(mapState.showLabels ? globeLabels : [])
      .labelSize((d: any) => d.size)
      .labelColor((d: any) => d.color)
      .arcsData(remittanceArcs)
      .arcColor((d: any) => d.color || ['#10b981', '#38bdf8'])
      .arcAltitude((d: any) => d.altitude || 0.35)
      .arcStroke((d: any) => d.stroke || 1.8)
      .arcDashLength((d: any) => d.dashLength || 0.4)
      .arcDashGap((d: any) => d.dashGap || 0.2)
      .arcDashAnimateTime((d: any) => d.dashAnimateTime || 2000);
  }

  async function initGlobe() {
    if (!globeContainer || geoJsonFeatures.length === 0) return;

    if (!GlobeModule) {
      const globePkg = await import('globe.gl');
      GlobeModule = globePkg.default || globePkg;
    }

    if (globeContainer.firstChild) {
      globeContainer.innerHTML = '';
    }

    const isDark = currentTheme === 'dark';
    const width = globeContainer.clientWidth || window.innerWidth;
    const height = globeContainer.clientHeight || window.innerHeight;
    const isFlag = geoStore.activeAppId === 'fx-rates' && mapState.activeMetric === 'flag';

    globeInstance = GlobeModule()(globeContainer)
      .width(width)
      .height(height)
      .backgroundColor(isDark ? '#0B0F19' : '#FAF8F3')
      .showAtmosphere(true)
      .atmosphereColor(isDark ? '#06b6d4' : '#38bdf8')
      .atmosphereAltitude(0.22)
      .polygonsData(geoJsonFeatures)
      .polygonGeoJsonGeometry((d: any) => d.geometry)
      .polygonCapMaterial((d: any) => {
        if (!isFlag) return null;
        return createProceduralFlagMaterial(d, isDark);
      })
      .polygonCapColor((d: any) => getPolygonColor(d))
      .polygonSideColor(() => (isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(2, 132, 199, 0.22)'))
      .polygonStrokeColor(() => (isDark ? '#334155' : '#94a3b8'))
      .polygonsTransitionDuration(0)
      .polygonAltitude((d: any) => {
        const iso3 = getFeatureIso3(d);
        if (mapState.selectedCountryIso3 === iso3 || mapState.hoveredIso3 === iso3) return 0.018;
        return 0.005;
      })
      .polygonLabel((d: any) => getTooltipHtml(d))
      .onPolygonHover((hoverD: any) => {
        const iso3 = hoverD ? getFeatureIso3(hoverD) : null;
        // Hover deduplication guard: prevent redundant GPU geometry re-evaluations
        if (iso3 === lastHoveredIso3) return;
        lastHoveredIso3 = iso3 ?? '';
        mapState.hoveredIso3 = iso3;
        onCountryHover?.(iso3);
        if (globeInstance) {
          globeInstance.polygonAltitude((d: any) => {
            const featIso3 = getFeatureIso3(d);
            if (mapState.selectedCountryIso3 === featIso3 || mapState.hoveredIso3 === featIso3) return 0.018;
            return 0.005;
          });
          globeInstance.polygonCapColor((d: any) => getPolygonColor(d));
        }
      })
      .onPolygonClick((clickD: any) => {
        if (!clickD) return;
        const iso3 = getFeatureIso3(clickD);
        const country = mapData.find(d => d.iso3 === iso3);
        if (country) {
          onCountryClick?.(country);
        }
      });

    // Enforce WebGL DPR Clamp (max 1.5) to prevent GPU fragment overload on HiDPI / 4K
    const renderer = globeInstance.renderer?.();
    if (renderer && typeof window !== 'undefined') {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
    }

    if (mapState.showLabels && globeLabels.length > 0) {
      globeInstance
        .labelsData(globeLabels)
        .labelLat((d: any) => d.lat)
        .labelLng((d: any) => d.lng)
        .labelText((d: any) => d.text)
        .labelSize((d: any) => d.size)
        .labelDotRadius((d: any) => (d.iso3 === mapState.selectedCountryIso3 ? 0.15 : 0.06))
        .labelColor((d: any) => d.color)
        .labelAltitude(0.020)
        .labelResolution(2)
        .onLabelClick((d: any) => {
          if (d.country) {
            onCountryClick?.(d.country);
          }
        })
        .onLabelHover((d: any) => {
          const iso3 = d ? d.iso3 : null;
          if (iso3 === lastHoveredIso3) return;
          lastHoveredIso3 = iso3 ?? '';
          mapState.hoveredIso3 = iso3;
          onCountryHover?.(iso3);
          updateVisuals();
        });
    }

    // Google Earth style orbit controls
    const controls = globeInstance.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 105;
      controls.maxDistance = 550;
    }

    // Centered initially near Indonesia / Asia-Pacific
    globeInstance.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, 800);
    isInitialized = true;
    onReady?.();

    // Set up Auto-Resize Observer
    if (globeContainer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (globeInstance && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            globeInstance.width(entry.contentRect.width).height(entry.contentRect.height);
          }
        }
      });
      resizeObserver.observe(globeContainer);
    }
  }

  // React to reactive state changes with non-blocking lazy-loading transition
  $effect(() => {
    if (!isInitialized || !globeInstance) return;
    // Track dependencies
    const _app = geoStore.activeAppId;
    const _timeFilter = geoStore.timeFilter;
    const _flightFilter = geoStore.flightCorridorFilter;
    const _passportFilter = geoStore.passportVisaFilter;
    const _theme = currentTheme;
    const currentMetric = mapState.activeMetric;
    const _labels = mapState.showLabels;
    const _selected = mapState.selectedCountryIso3;
    const _hovered = mapState.hoveredIso3;

    if (previousMetric && previousMetric !== currentMetric) {
      isSwitchingMetric = true;
      transitionLabel = getTransitionMessage(currentMetric);
      previousMetric = currentMetric;

      // Allow browser to render loading HUD first, then update WebGL materials
      requestAnimationFrame(() => {
        setTimeout(() => {
          updateVisuals();
          setTimeout(() => {
            isSwitchingMetric = false;
          }, 180);
        }, 20);
      });
    } else {
      previousMetric = currentMetric;
      updateVisuals();
    }
  });

  // React to region changes
  $effect(() => {
    if (!isInitialized || !globeInstance) return;
    const regionId = mapState.activeRegion;
    const regionObj = REGION_FILTERS.find(r => r.id === regionId);
    if (regionObj) {
      const altitude = regionId === 'all' ? 2.2 : (regionObj.zoom ? Math.max(0.6, 2.5 / regionObj.zoom) : 1.5);
      globeInstance.pointOfView({ lat: regionObj.lat, lng: regionObj.lon, altitude }, 1000);
    }
  });

  // React to flight corridor filter camera flight
  $effect(() => {
    if (!isInitialized || !globeInstance || geoStore.activeAppId !== 'remittance-flow') return;
    const filter = geoStore.flightCorridorFilter;
    if (filter === 'mideast') {
      globeInstance.pointOfView({ lat: 24, lng: 45, altitude: 1.8 }, 1000);
    } else if (filter === 'asean') {
      globeInstance.pointOfView({ lat: 4, lng: 108, altitude: 1.6 }, 1000);
    } else if (filter === 'eastasia') {
      globeInstance.pointOfView({ lat: 30, lng: 125, altitude: 1.8 }, 1000);
    } else if (filter === 'west') {
      globeInstance.pointOfView({ lat: 38, lng: -97, altitude: 2.2 }, 1000);
    } else if (filter === 'all') {
      globeInstance.pointOfView({ lat: 10, lng: 110, altitude: 2.2 }, 1000);
    }
  });

  onMount(() => {
    initGlobe();
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (globeInstance) {
      try {
        globeInstance._destructor?.();
      } catch {}
      globeInstance = null;
    }
    if (globeContainer) {
      globeContainer.innerHTML = '';
    }
    // Clean up GPU Textures & ShaderMaterials
    disposeProceduralFlagCache();
  });
</script>

<div class="relative w-full h-full min-h-[500px] overflow-hidden select-none">
  <div
    bind:this={globeContainer}
    class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
    style="z-index: 1;"
  ></div>

  <!-- Holographic Metric Transition / Lazy-Loading HUD -->
  {#if isSwitchingMetric}
    <div
      class="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-semibold backdrop-blur-xl shadow-2xl shadow-cyan-500/10 animate-in fade-in zoom-in-95 duration-200"
    >
      <Loader2 class="w-4 h-4 animate-spin text-cyan-400" />
      <span>{transitionLabel}</span>
    </div>
  {/if}
</div>
