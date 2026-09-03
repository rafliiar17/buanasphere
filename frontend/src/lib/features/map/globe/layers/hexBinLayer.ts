import type { FinancialHubData } from '../data/financialHubsData';
import { formatRupiah } from '$lib/formatters/currency';

export interface HexBinPointData {
  lat: number;
  lng: number;
  weight: number;
  hub: FinancialHubData;
}

export interface ConfigureHexBinLayerConfig {
  points: HexBinPointData[];
  theme?: 'dark' | 'light';
  rateMapByCurrency?: Record<string, number>;
  onHexClick?: (hub: FinancialHubData, event?: MouseEvent) => void;
  onHexHover?: (hub: FinancialHubData | null, event?: MouseEvent) => void;
}

/**
 * Calculates logarithmic scaled altitude for 3D hexagonal pillars.
 * Ensures megahubs (London $3.8T) stay within a visually harmonious altitude (<= 0.45)
 * while emerging hubs (Jakarta $45B) remain clearly visible (>= 0.02).
 */
export function calculateHexAltitude(turnoverBillionUsd: number): number {
  const minAlt = 0.025;
  const maxAlt = 0.42;
  const safeTurnover = Math.max(1, turnoverBillionUsd);
  const logVal = Math.log10(safeTurnover);
  // log10(1) = 0, log10(4000) ~ 3.60
  const normalized = Math.min(1, Math.max(0, logVal / 3.7));
  return Number((minAlt + normalized * (maxAlt - minAlt)).toFixed(4));
}

/**
 * Returns radiant neon top cap color for 3D hexagonal pillars.
 */
export function getHexTopColor(turnoverBillionUsd: number, theme: 'dark' | 'light' = 'dark'): string {
  const isDark = theme === 'dark';
  if (turnoverBillionUsd >= 1500) {
    return isDark ? 'rgba(56, 189, 248, 0.95)' : 'rgba(2, 132, 199, 0.95)'; // Radiant Cyan-Blue Megahub
  }
  if (turnoverBillionUsd >= 500) {
    return isDark ? 'rgba(16, 185, 129, 0.90)' : 'rgba(5, 150, 105, 0.90)'; // Emerald Green
  }
  if (turnoverBillionUsd >= 100) {
    return isDark ? 'rgba(245, 158, 11, 0.90)' : 'rgba(217, 119, 6, 0.90)'; // Luminous Amber
  }
  return isDark ? 'rgba(129, 140, 248, 0.85)' : 'rgba(99, 102, 241, 0.85)'; // Indigo
}

/**
 * Returns translucent glowing side color for 3D hexagonal pillars.
 */
export function getHexSideColor(turnoverBillionUsd: number, theme: 'dark' | 'light' = 'dark'): string {
  const isDark = theme === 'dark';
  if (turnoverBillionUsd >= 1500) {
    return isDark ? 'rgba(14, 165, 233, 0.45)' : 'rgba(2, 132, 199, 0.40)';
  }
  if (turnoverBillionUsd >= 500) {
    return isDark ? 'rgba(16, 185, 129, 0.40)' : 'rgba(5, 150, 105, 0.35)';
  }
  if (turnoverBillionUsd >= 100) {
    return isDark ? 'rgba(245, 158, 11, 0.40)' : 'rgba(217, 119, 6, 0.35)';
  }
  return isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(79, 70, 229, 0.30)';
}

/**
 * Creates rich glassmorphism HTML tooltip for a financial hub.
 */
export function createHexBinTooltip(
  hub: FinancialHubData,
  rateToIdr?: number,
  theme: 'dark' | 'light' = 'dark'
): string {
  const isDark = theme === 'dark';
  const turnoverFormatted = hub.dailyTurnoverBillionUsd.toLocaleString('id-ID');
  const marketShare = `${hub.marketSharePercent.toFixed(1)}%`;
  const rateFormatted = rateToIdr ? formatRupiah(rateToIdr) : '-';

  return `
    <div style="
      background: ${isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'};
      border: 1px solid ${isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.35)'};
      border-radius: 14px;
      padding: 12px 16px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.45);
      font-family: Inter, system-ui, sans-serif;
      pointer-events: none;
      min-width: 250px;
      backdrop-filter: blur(12px);
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">${hub.flagEmoji}</span>
          <div>
            <div style="font-size: 14px; font-weight: 800; color: ${isDark ? '#f8fafc' : '#0f172a'}; line-height: 1.2;">
              ${hub.city}
            </div>
            <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'};">
              ${hub.country} (${hub.currencyCode})
            </div>
          </div>
        </div>
        <span style="
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.2);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        ">
          Rank #${hub.rank}
        </span>
      </div>

      <div style="
        background: ${isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(241, 245, 249, 0.85)'};
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 8px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      ">
        <div>
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${isDark ? '#94a3b8' : '#64748b'};">
            Volume Harian (BIS)
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #38bdf8; font-family: monospace;">
            $${turnoverFormatted} Miliar
          </div>
        </div>
        <div>
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: ${isDark ? '#94a3b8' : '#64748b'};">
            Pangsa Global
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #10b981; font-family: monospace;">
            ${marketShare}
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding-top: 4px; border-top: 1px solid ${isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'};">
        <span style="color: ${isDark ? '#94a3b8' : '#64748b'};">Kurs ke IDR:</span>
        <span style="font-weight: 700; color: ${isDark ? '#f1f5f9' : '#0f172a'}; font-family: monospace;">${rateFormatted}</span>
      </div>

      <div style="font-size: 10px; color: #38bdf8; margin-top: 6px; text-align: center; font-weight: 600;">
        👉 Klik untuk fokus & telusuri hub ini
      </div>
    </div>
  `;
}

/**
 * Configures the Hexagonal Binning 3D layer on a globe.gl instance.
 */
export function configureHexBinLayer(globe: any, config: ConfigureHexBinLayerConfig): void {
  if (!globe || typeof globe.hexBinPointsData !== 'function') return;

  const { points = [], theme = 'dark', rateMapByCurrency = {}, onHexClick, onHexHover } = config;

  globe
    .hexBinPointsData(points)
    .hexBinPointLat((d: any) => d.lat)
    .hexBinPointLng((d: any) => d.lng)
    .hexBinPointWeight((d: any) => d.weight || 1)
    .hexBinResolution(3)
    .hexMargin(0.18)
    .hexTopCurvatureResolution(2)
    .hexAltitude((d: any) => {
      const weight = d.sumWeight || (d.points?.[0]?.weight ?? 10);
      return calculateHexAltitude(weight);
    })
    .hexTopColor((d: any) => {
      const weight = d.sumWeight || (d.points?.[0]?.weight ?? 10);
      return getHexTopColor(weight, theme);
    })
    .hexSideColor((d: any) => {
      const weight = d.sumWeight || (d.points?.[0]?.weight ?? 10);
      return getHexSideColor(weight, theme);
    })
    .hexLabel((d: any) => {
      const hub = d.points?.[0]?.hub as FinancialHubData | undefined;
      if (!hub) return '';
      const rate = rateMapByCurrency[hub.currencyCode];
      return createHexBinTooltip(hub, rate, theme);
    })
    .onHexClick((hex: any, event: MouseEvent) => {
      const hub = hex?.points?.[0]?.hub as FinancialHubData | undefined;
      if (hub && onHexClick) {
        onHexClick(hub, event);
      }
    })
    .onHexHover((hex: any, prevHex: any) => {
      const hub = hex?.points?.[0]?.hub as FinancialHubData | undefined;
      if (onHexHover) {
        onHexHover(hub || null);
      }
    });
}
