/**
 * Globe.gl Polygon Layer Engine
 * 
 * Handles 3D country boundary GeoJSON polygons, dynamic altitude extrusions,
 * selection glow, hover highlights, spot-rate choropleth color scales, and rich HTML tooltips.
 */

import { getCountryMetadata } from '../../data/countrySpatialData';
import { DEFAULT_DARK_THEME } from '../theme';
import type { GlobeInstance, PolygonLayerConfig, RateChoroplethData } from '../types';

/**
 * Extracts normalized ISO-3 country code from GeoJSON feature properties.
 */
export function getFeatureIso3(feat: any): string {
  if (!feat || !feat.properties) return '';
  const p = feat.properties;
  const rawCode =
    p.ISO_A3 ||
    p.ADM0_A3 ||
    p.SOV_A3 ||
    p.adm0_a3 ||
    p.iso_a3 ||
    '';

  if (!rawCode || rawCode === '-99') {
    return (p.ADM0_A3 || p.SOV_A3 || p.GU_A3 || p.BRK_A3 || '').toUpperCase();
  }
  return String(rawCode).toUpperCase();
}

/**
 * Maps a numeric value to a color between min and max.
 */
export function calculateChoroplethColor(
  value: number,
  min: number,
  max: number,
  palette: [string, string] = ['rgba(14, 165, 233, 0.4)', 'rgba(99, 102, 241, 0.85)']
): string {
  if (min === max || isNaN(value)) return palette[0];
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Simple linear interpolation between start and end hex/rgba
  return t > 0.5 ? palette[1] : palette[0];
}

/**
 * Generates rich HTML tooltip content for country polygons.
 */
export function createPolygonTooltipHtml(
  feat: any,
  rateData?: RateChoroplethData,
  theme = DEFAULT_DARK_THEME
): string {
  const iso3 = getFeatureIso3(feat);
  const meta = getCountryMetadata(iso3);

  const countryName = meta?.countryName || feat?.properties?.NAME || feat?.properties?.name || iso3;
  const flagEmoji = meta?.flagEmoji || '🌐';
  const currencyCode = rateData?.currencyCode || meta?.currencyCode || '—';
  const currencyName = meta?.currencyName || '';

  const isDark = theme.mode === 'dark';
  const bg = isDark ? '#090d16' : '#ffffff';
  const border = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.25)';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  let rateSection = '';
  if (rateData) {
    const rateText = rateData.formattedRate || `Rp ${Number(rateData.rate).toLocaleString('id-ID')}`;
    const changeVal = rateData.change24h ?? 0;
    const isPositive = changeVal >= 0;
    const changeBadgeColor = isPositive ? '#10b981' : '#f43f5e';
    const changeBadgeBg = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
    const changeSign = isPositive ? '+' : '';
    const changeText = rateData.formattedChange || `${changeSign}${changeVal.toFixed(2)}%`;

    rateSection = `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};">
        <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px;">
          <span style="font-size: 11px; color: ${textMuted}; font-weight: 500;">Spot Rate IDR:</span>
          <span style="font-size: 13px; font-weight: 700; color: ${textPrimary}; font-family: monospace;">${rateText}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
          <span style="font-size: 11px; color: ${textMuted};">Performa 24j:</span>
          <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 9999px; background: ${changeBadgeBg}; color: ${changeBadgeColor}; font-family: monospace;">
            ${changeText}
          </span>
        </div>
      </div>
    `;
  }

  return `
    <div style="
      background: ${bg};
      color: ${textPrimary};
      border: 1px solid ${border};
      padding: 10px 14px;
      border-radius: 10px;
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 170px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(12px);
      pointer-events: none;
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
        <span style="font-size: 20px; line-height: 1;">${flagEmoji}</span>
        <div>
          <div style="font-size: 13px; font-weight: 700; line-height: 1.2;">${countryName}</div>
          <div style="font-size: 10px; font-weight: 600; color: ${textMuted}; letter-spacing: 0.5px;">${iso3} • ${currencyCode}</div>
        </div>
      </div>
      ${currencyName ? `<div style="font-size: 11px; color: ${textMuted}; margin-top: 2px;">${currencyName}</div>` : ''}
      ${rateSection}
    </div>
  `;
}

/**
 * Configures the polygon layer on a globe.gl instance.
 */
export function configurePolygonLayer(
  globe: GlobeInstance,
  config: PolygonLayerConfig
): void {
  if (!globe || typeof globe.polygonsData !== 'function') return;

  const theme = config.theme || DEFAULT_DARK_THEME;
  const selectedIso3 = config.selectedIso3 ? config.selectedIso3.toUpperCase() : null;
  const hoveredIso3 = config.hoveredIso3 ? config.hoveredIso3.toUpperCase() : null;
  const matchedSet = config.matchedIso3List ? new Set(config.matchedIso3List.map((s) => s.toUpperCase())) : null;

  globe
    .polygonsData(config.features || [])
    .polygonAltitude((feat: any) => {
      if (config.getCustomAltitude) {
        return config.getCustomAltitude(feat);
      }
      const iso3 = getFeatureIso3(feat);
      if (selectedIso3 && iso3 === selectedIso3) return 0.045;
      if (hoveredIso3 && iso3 === hoveredIso3) return 0.025;
      if (matchedSet && matchedSet.has(iso3)) return 0.012;
      return 0.005;
    })
    .polygonCapColor((feat: any) => {
      if (config.getCustomCapColor) {
        return config.getCustomCapColor(feat);
      }

      const iso3 = getFeatureIso3(feat);
      const isSelected = selectedIso3 !== null && iso3 === selectedIso3;
      const isHovered = hoveredIso3 !== null && iso3 === hoveredIso3;

      if (isSelected) {
        return theme.polygonSelectedColor;
      }
      if (isHovered) {
        return theme.polygonHoverColor;
      }

      // Check if filtering is active and country is not matched
      if (matchedSet && !matchedSet.has(iso3)) {
        return theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.25)' : 'rgba(226, 232, 240, 0.35)';
      }

      // Spot rate choropleth
      if (config.rateDataByIso3 && config.rateDataByIso3[iso3]) {
        const rateInfo = config.rateDataByIso3[iso3];
        if (config.activeMetric === 'change' && rateInfo.change24h !== undefined) {
          return rateInfo.change24h >= 0 ? 'rgba(16, 185, 129, 0.65)' : 'rgba(244, 63, 94, 0.65)';
        }
        return 'rgba(14, 165, 233, 0.55)';
      }

      return theme.polygonDefaultColor;
    })
    .polygonSideColor((feat: any) => {
      const iso3 = getFeatureIso3(feat);
      if (selectedIso3 && iso3 === selectedIso3) {
        return theme.mode === 'dark' ? 'rgba(2, 132, 199, 0.6)' : 'rgba(3, 105, 161, 0.6)';
      }
      return theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(203, 213, 225, 0.5)';
    })
    .polygonStrokeColor(() => theme.polygonStrokeColor)
    .polygonLabel((feat: any) => {
      const iso3 = getFeatureIso3(feat);
      const rateInfo = config.rateDataByIso3 ? config.rateDataByIso3[iso3] : undefined;
      return createPolygonTooltipHtml(feat, rateInfo, theme);
    })
    .onPolygonHover((feat: any, prevFeat: any) => {
      if (config.onHover) {
        config.onHover(feat ?? null, prevFeat ?? null);
      }
    })
    .onPolygonClick((feat: any, event: MouseEvent) => {
      if (config.onClick && feat) {
        config.onClick(feat, event);
      }
    });
}
