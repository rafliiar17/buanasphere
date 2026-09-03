import * as THREE from 'three';
import { EXTENDED_COUNTRIES_DATA } from '$lib/framework/geoglobe/countrySpatialData';
import { formatRupiah, formatPercent } from '$lib/formatters/currency';
import { createProceduralFlagMaterial } from '../../procedural-flags';
import type { PolygonLayerOptions, PolygonAltitudeOptions, TooltipHtmlOptions } from '../types';

export const ISO3_TO_ISO2_MAP: Record<string, string> = {
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

export function getFeatureIso3(feat: any): string {
  if (!feat || !feat.properties) return '';
  const p = feat.properties;
  const code = p.ISO_A3 || p.ADM0_A3 || p.SOV_A3 || p.adm0_a3 || p.iso_a3 || '';
  if (code === '-99' || !code) {
    return (p.ADM0_A3 || p.SOV_A3 || p.GU_A3 || p.BRK_A3 || '').toUpperCase();
  }
  return String(code).toUpperCase();
}

export function getFeatureIso2(feat: any): string {
  if (!feat || !feat.properties) return '';
  const p = feat.properties;
  const a2 = p.ISO_A2 || p.ISO_A2_EH || p.WB_A2 || p.POSTAL || p.FIPS_10 || '';
  if (a2 && a2 !== '-99' && a2.length === 2) {
    return a2.toLowerCase();
  }
  const iso3 = getFeatureIso3(feat);
  return (ISO3_TO_ISO2_MAP[iso3] || iso3.slice(0, 2)).toLowerCase();
}

export function getCountryColor(
  iso3: string,
  options: PolygonLayerOptions
): string {
  const {
    mapData,
    selectedIso3,
    hoveredIso3,
    currentTheme,
    activeMetric,
    isMatched = true,
    isFilterActive = false,
    activeApp,
    currentAppData,
  } = options;

  const isDark = currentTheme === 'dark';
  const country = mapData.find((d) => d.iso3 === iso3);
  const spatial = EXTENDED_COUNTRIES_DATA.find((d) => d.iso3 === iso3) || {
    iso3,
    countryName: country?.countryName || iso3,
    currencyCode: country?.currencyCode || iso3,
    currencyName: country?.currencyName || '',
    flagEmoji: '🌐',
    region: 'Unknown',
    capital: '',
    lat: 0,
    lng: 0,
    utcOffset: 0,
    continent: 'Unknown',
  };

  const isSelected = selectedIso3 === iso3;
  const isHovered = hoveredIso3 === iso3;

  if (isSelected) {
    return '#38bdf8'; // Glowing sky blue highlight
  }
  if (isHovered) {
    return '#34d399'; // Emerald hover
  }

  const appData = currentAppData?.[iso3] ?? country;
  if (activeApp?.getPolygonColor && spatial) {
    return activeApp.getPolygonColor(spatial, appData, activeMetric, currentTheme);
  }

  // Fallback if active filter is active and country is not matched
  if (!isMatched && isFilterActive) {
    return isDark ? 'rgba(30, 41, 59, 0.20)' : 'rgba(226, 232, 240, 0.35)';
  }

  if (!country) {
    return isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.7)';
  }

  return isDark ? 'rgba(51, 65, 85, 0.40)' : 'rgba(226, 232, 240, 0.60)';
}

export function getPolygonAltitude(
  iso3: string,
  options: PolygonAltitudeOptions
): number {
  const { selectedIso3, hoveredIso3, isMatched = true, isFilterActive = false, isFlag = false } = options;

  if (selectedIso3 === iso3 || hoveredIso3 === iso3) {
    return 0.018;
  }
  if (isFlag && isFilterActive && !isMatched) {
    return 0.001;
  }
  if (!isMatched && isFilterActive) {
    return 0.001;
  }
  return 0.008;
}

export function getTooltipHtml(
  iso3: string,
  options: TooltipHtmlOptions
): string {
  const { mapData, currentTheme, activeMetric, activeApp, currentAppData } = options;

  const isDark = currentTheme === 'dark';
  const country = mapData.find((d) => d.iso3 === iso3);
  const spatial = EXTENDED_COUNTRIES_DATA.find((d) => d.iso3 === iso3) || {
    iso3,
    countryName: country?.countryName || iso3,
    currencyCode: country?.currencyCode || iso3,
    currencyName: country?.currencyName || '',
    flagEmoji: '🌐',
    region: 'Unknown',
    capital: '',
    lat: 0,
    lng: 0,
    utcOffset: 0,
    continent: 'Unknown',
  };

  const appData = currentAppData?.[iso3] ?? country;

  if (activeApp?.getTooltipHtml && spatial) {
    return activeApp.getTooltipHtml(spatial, appData, activeMetric, currentTheme);
  }

  // Default fallback: fx-rates
  const iso2 = (ISO3_TO_ISO2_MAP[iso3] || iso3.slice(0, 2)).toLowerCase();
  const name = spatial?.countryName || country?.countryName || iso3;
  const code = country?.currencyCode || '';
  const currName = country?.currencyName || '';
  const midFormatted = country ? formatRupiah(country.middleRate) : '-';
  const buyFormatted = country ? formatRupiah(country.buyRate) : '-';
  const sellFormatted = country ? formatRupiah(country.sellRate) : '-';
  const chgFormatted = country ? formatPercent(country.change24h) : '0.00%';
  const chgColor = (country?.change24h ?? 0) >= 0 ? '#10b981' : '#ef4444';

  if (activeMetric === 'change') {
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

let dimmedCapMaterialDark: THREE.MeshLambertMaterial | null = null;
let dimmedCapMaterialLight: THREE.MeshLambertMaterial | null = null;

export function getDimmedCapMaterial(isDark: boolean): THREE.MeshLambertMaterial {
  if (isDark) {
    if (!dimmedCapMaterialDark) {
      dimmedCapMaterialDark = new THREE.MeshLambertMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.25,
      });
    }
    return dimmedCapMaterialDark;
  } else {
    if (!dimmedCapMaterialLight) {
      dimmedCapMaterialLight = new THREE.MeshLambertMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.25,
      });
    }
    return dimmedCapMaterialLight;
  }
}

export interface ConfigurePolygonLayerConfig {
  features: any[];
  mapData: any[];
  selectedIso3?: string | null;
  hoveredIso3?: string | null;
  activeMetric: any;
  currentTheme: any;
  isDark: boolean;
  isFlag: boolean;
  isFilterActive: boolean;
  isCountryMatched: (iso3: string) => boolean;
  themeConfig: any;
  activeApp?: any;
  currentAppData?: any;
  onHover?: (feat: any | null) => void;
  onClick?: (feat: any, event: MouseEvent) => void;
}

export function configurePolygonLayer(globe: any, config: ConfigurePolygonLayerConfig): void {
  if (!globe || typeof globe.polygonsData !== 'function') return;

  const {
    features,
    mapData,
    selectedIso3,
    hoveredIso3,
    activeMetric,
    currentTheme,
    isDark,
    isFlag,
    isFilterActive,
    isCountryMatched,
    themeConfig,
    activeApp,
    currentAppData,
    onHover,
    onClick,
  } = config;

  globe
    .polygonsData(features || [])
    .polygonGeoJsonGeometry((d: any) => d.geometry)
    .polygonSideColor(() => themeConfig.polygonSideColor)
    .polygonStrokeColor(() => themeConfig.polygonStrokeColor)
    .polygonCapColor((feat: any) => {
      const iso3 = getFeatureIso3(feat);
      const isMatched = isCountryMatched(iso3);
      return getCountryColor(iso3, {
        mapData,
        selectedIso3,
        hoveredIso3,
        currentTheme,
        activeMetric,
        isMatched,
        isFilterActive,
        activeApp,
        currentAppData,
      });
    })
    .polygonAltitude((feat: any) => {
      const iso3 = getFeatureIso3(feat);
      const isMatched = isCountryMatched(iso3);
      return getPolygonAltitude(iso3, {
        selectedIso3,
        hoveredIso3,
        isMatched,
        isFilterActive,
        isFlag,
      });
    })
    .polygonCapMaterial((feat: any) => {
      if (!isFlag) return null;
      const iso3 = getFeatureIso3(feat);
      if (isFilterActive && !isCountryMatched(iso3)) {
        return getDimmedCapMaterial(isDark);
      }
      return createProceduralFlagMaterial(feat, isDark);
    })
    .polygonLabel((feat: any) => {
      const iso3 = getFeatureIso3(feat);
      return getTooltipHtml(iso3, {
        mapData,
        currentTheme,
        activeMetric,
        activeApp,
        currentAppData,
      });
    })
    .onPolygonHover((feat: any) => onHover?.(feat))
    .onPolygonClick((feat: any, event: MouseEvent) => onClick?.(feat, event));
}
