/**
 * Procedural Vexillological Pattern Generator for Global Sovereign Flags.
 * Renders authentic multi-stripe and geometric flag patterns in pure Canvas 2D / WebGL textures
 * with zero network latency, zero CORS errors, and zero black screen rendering risks.
 */

export type FlagPatternType = 
  | 'vertical-tricolor'
  | 'vertical-bicolor'
  | 'horizontal-bicolor'
  | 'horizontal-tricolor'
  | 'circle-disc'
  | 'nordic-cross'
  | 'cross'
  | 'canton-stripes'
  | 'diamond-emblem'
  | 'solid-emblem';

export interface FlagPatternDefinition {
  type: FlagPatternType;
  colors: string[];
  options?: Record<string, any>;
}

export const FLAG_PATTERNS: Record<string, FlagPatternDefinition> = {
  // ==========================================
  // EUROPE
  // ==========================================
  FRA: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#ffffff', '#dc2626'] }, // Prancis (Bleu, Blanc, Rouge)
  DEU: { type: 'horizontal-tricolor', colors: ['#18181b', '#dc2626', '#d97706'] }, // Jerman (Schwarz, Rot, Gold)
  ITA: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Italia (Verde, Bianco, Rosso)
  BEL: { type: 'vertical-tricolor', colors: ['#18181b', '#eab308', '#dc2626'] }, // Belgia (Black, Yellow, Red)
  NLD: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#1e40af'] }, // Belanda (Rood, Wit, Blauw)
  IRL: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#ea580c'] }, // Irlandia (Green, White, Orange)
  ROU: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#dc2626'] }, // Rumania (Blue, Yellow, Red)
  AUT: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Austria (Red, White, Red)
  HUN: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#15803d'] }, // Hongaria (Red, White, Green)
  BGR: { type: 'horizontal-tricolor', colors: ['#ffffff', '#15803d', '#dc2626'] }, // Bulgaria (White, Green, Red)
  RUS: { type: 'horizontal-tricolor', colors: ['#ffffff', '#1d4ed8', '#dc2626'] }, // Rusia (White, Blue, Red)
  POL: { type: 'horizontal-bicolor', colors: ['#ffffff', '#dc2626'] }, // Polandia (White, Red)
  UKR: { type: 'horizontal-bicolor', colors: ['#0284c7', '#eab308'] }, // Ukraina (Sky Blue, Wheat Yellow)
  SWE: { type: 'nordic-cross', colors: ['#0284c7', '#eab308'] }, // Swedia (Blue with Yellow Cross)
  NOR: { type: 'nordic-cross', colors: ['#dc2626', '#1e3a8a'], options: { outline: '#ffffff' } }, // Norwegia (Red, Blue, White)
  DNK: { type: 'nordic-cross', colors: ['#dc2626', '#ffffff'] }, // Denmark (Red with White Cross)
  FIN: { type: 'nordic-cross', colors: ['#ffffff', '#1d4ed8'] }, // Finlandia (White with Blue Cross)
  ISL: { type: 'nordic-cross', colors: ['#0284c7', '#dc2626'], options: { outline: '#ffffff' } }, // Islandia (Blue, Red, White)
  CHE: { type: 'cross', colors: ['#dc2626', '#ffffff'] }, // Swiss (Red with White Cross)
  ESP: { type: 'horizontal-tricolor', colors: ['#dc2626', '#eab308', '#dc2626'], options: { middleRatio: 0.5 } }, // Spanyol (Rojigualda)
  PRT: { type: 'vertical-bicolor', colors: ['#15803d', '#dc2626'], options: { splitRatio: 0.4 } }, // Portugal (Green, Red)
  GRC: { type: 'canton-stripes', colors: ['#1d4ed8', '#ffffff'] }, // Yunani (Blue & White Stripes with Cross Canton)
  GBR: { type: 'nordic-cross', colors: ['#1e3a8a', '#dc2626'], options: { outline: '#ffffff', symmetric: true } }, // UK Union Jack
  CZE: { type: 'horizontal-bicolor', colors: ['#ffffff', '#dc2626'], options: { triangle: '#1d4ed8' } }, // Ceko (White/Red with Blue Triangle)
  SVK: { type: 'horizontal-tricolor', colors: ['#ffffff', '#1d4ed8', '#dc2626'] }, // Slowakia
  SVN: { type: 'horizontal-tricolor', colors: ['#ffffff', '#1d4ed8', '#dc2626'] }, // Slovenia
  HRV: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#1d4ed8'] }, // Kroasia
  SRB: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#ffffff'] }, // Serbia
  EST: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#18181b', '#ffffff'] }, // Estonia
  LVA: { type: 'horizontal-tricolor', colors: ['#881337', '#ffffff', '#881337'], options: { middleRatio: 0.2 } }, // Latvia
  LTU: { type: 'horizontal-tricolor', colors: ['#eab308', '#15803d', '#dc2626'] }, // Lithuania
  LUX: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#0284c7'] }, // Luksemburg
  MCO: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Monako

  // ==========================================
  // ASIA & OCEANIA
  // ==========================================
  IDN: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Indonesia (Merah, Putih)
  SGP: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Singapura (Merah, Putih)
  MYS: { type: 'canton-stripes', colors: ['#1e40af', '#dc2626', '#ffffff'] }, // Malaysia (Jalur Gemilang)
  THA: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1e3a8a', '#dc2626'], options: { middleRatio: 0.34, outline: '#ffffff' } }, // Thailand Trairanga
  PHL: { type: 'horizontal-bicolor', colors: ['#1d4ed8', '#dc2626'], options: { triangle: '#ffffff' } }, // Filipina
  VNM: { type: 'solid-emblem', colors: ['#dc2626', '#eab308'], options: { star: true } }, // Vietnam (Red with Gold Star)
  JPN: { type: 'circle-disc', colors: ['#ffffff', '#dc2626'] }, // Jepang (Hinomaru)
  CHN: { type: 'solid-emblem', colors: ['#dc2626', '#eab308'], options: { stars: 5 } }, // Tiongkok
  KOR: { type: 'circle-disc', colors: ['#ffffff', '#1e3a8a', '#dc2626'] }, // Korea Selatan (Taegeuk)
  IND: { type: 'horizontal-tricolor', colors: ['#ea580c', '#ffffff', '#15803d'] }, // India (Saffron, White, Green)
  PAK: { type: 'vertical-bicolor', colors: ['#ffffff', '#047857'], options: { splitRatio: 0.25 } }, // Pakistan
  BGD: { type: 'circle-disc', colors: ['#047857', '#dc2626'], options: { offsetLeft: 0.45 } }, // Bangladesh
  AUS: { type: 'canton-stripes', colors: ['#1e3a8a', '#ffffff'] }, // Australia
  NZL: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626'] }, // Selandia Baru
  LAO: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#dc2626'], options: { middleRatio: 0.5, circle: '#ffffff' } }, // Laos
  KHM: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#dc2626', '#1d4ed8'], options: { middleRatio: 0.5 } }, // Kamboja
  MMR: { type: 'horizontal-tricolor', colors: ['#eab308', '#15803d', '#dc2626'] }, // Myanmar
  ARE: { type: 'vertical-bicolor', colors: ['#dc2626', '#15803d'], options: { horizontalStripes: ['#15803d', '#ffffff', '#18181b'], splitRatio: 0.28 } }, // UEA
  SAU: { type: 'solid-emblem', colors: ['#047857', '#ffffff'] }, // Arab Saudi
  TUR: { type: 'solid-emblem', colors: ['#dc2626', '#ffffff'] }, // Turki
  QAT: { type: 'vertical-bicolor', colors: ['#ffffff', '#881337'], options: { splitRatio: 0.3 } }, // Qatar
  BHR: { type: 'vertical-bicolor', colors: ['#ffffff', '#dc2626'], options: { splitRatio: 0.3 } }, // Bahrain
  KWT: { type: 'horizontal-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'], options: { trapezoid: '#18181b' } }, // Kuwait
  JOR: { type: 'horizontal-tricolor', colors: ['#18181b', '#ffffff', '#15803d'], options: { triangle: '#dc2626' } }, // Yordania
  OMN: { type: 'horizontal-tricolor', colors: ['#ffffff', '#dc2626', '#15803d'] }, // Oman
  YEM: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Yaman
  IRQ: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Irak
  SYR: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Suriah
  LBN: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'], options: { middleRatio: 0.5, cedar: '#15803d' } }, // Lebanon
  ISR: { type: 'horizontal-tricolor', colors: ['#ffffff', '#1d4ed8', '#ffffff'] }, // Israel
  IRN: { type: 'horizontal-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Iran

  // ==========================================
  // AFRICA
  // ==========================================
  TCD: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#dc2626'] }, // Chad (Bleu, Jaune, Rouge)
  EGY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Mesir (Red, White, Black)
  ZAF: { type: 'horizontal-tricolor', colors: ['#dc2626', '#15803d', '#1d4ed8'] }, // Afrika Selatan
  NGA: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#15803d'] }, // Nigeria (Green, White, Green)
  CIV: { type: 'vertical-tricolor', colors: ['#ea580c', '#ffffff', '#15803d'] }, // Pantai Gading (Orange, White, Green)
  CMR: { type: 'vertical-tricolor', colors: ['#15803d', '#dc2626', '#eab308'] }, // Kamerun (Green, Red, Yellow)
  SEN: { type: 'vertical-tricolor', colors: ['#15803d', '#eab308', '#dc2626'] }, // Senegal (Green, Yellow, Red)
  MLI: { type: 'vertical-tricolor', colors: ['#15803d', '#eab308', '#dc2626'] }, // Mali (Green, Yellow, Red)
  GIN: { type: 'vertical-tricolor', colors: ['#dc2626', '#eab308', '#15803d'] }, // Guinea (Red, Yellow, Green)
  GHA: { type: 'horizontal-tricolor', colors: ['#dc2626', '#eab308', '#15803d'] }, // Ghana (Red, Yellow, Green)
  KEN: { type: 'horizontal-tricolor', colors: ['#18181b', '#dc2626', '#15803d'] }, // Kenya (Black, Red, Green)
  GAB: { type: 'horizontal-tricolor', colors: ['#15803d', '#eab308', '#0284c7'] }, // Gabon
  COG: { type: 'vertical-tricolor', colors: ['#15803d', '#eab308', '#dc2626'] }, // Kongo
  DZA: { type: 'vertical-bicolor', colors: ['#15803d', '#ffffff'] }, // Aljazair
  MAR: { type: 'solid-emblem', colors: ['#dc2626', '#15803d'] }, // Maroko
  TUN: { type: 'circle-disc', colors: ['#dc2626', '#ffffff'] }, // Tunisia
  ETH: { type: 'horizontal-tricolor', colors: ['#15803d', '#eab308', '#dc2626'] }, // Ethiopia
  SDN: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Sudan
  LBY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#18181b', '#15803d'], options: { middleRatio: 0.5 } }, // Libya

  // ==========================================
  // AMERICAS
  // ==========================================
  USA: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Amerika Serikat
  CAN: { type: 'vertical-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'], options: { middleRatio: 0.5 } }, // Kanada (Red, White, Red)
  MEX: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Meksiko (Green, White, Red)
  BRA: { type: 'diamond-emblem', colors: ['#15803d', '#eab308', '#1e40af'] }, // Brasil (Green, Yellow Diamond, Blue Disc)
  ARG: { type: 'horizontal-tricolor', colors: ['#0284c7', '#ffffff', '#0284c7'] }, // Argentina (Sky Blue, White, Sky Blue)
  COL: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'], options: { topRatio: 0.5 } }, // Kolombia
  VEN: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Venezuela
  ECU: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'], options: { topRatio: 0.5 } }, // Ekuador
  PER: { type: 'vertical-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Peru (Red, White, Red)
  CHL: { type: 'horizontal-bicolor', colors: ['#ffffff', '#dc2626'], options: { canton: '#1d4ed8' } }, // Chili
  URY: { type: 'horizontal-tricolor', colors: ['#ffffff', '#0284c7', '#ffffff'] }, // Uruguay
  BOL: { type: 'horizontal-tricolor', colors: ['#dc2626', '#eab308', '#15803d'] }, // Bolivia
  PRY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#1d4ed8'] }, // Paraguay
};

/**
 * Retrieve the flag pattern definition for an ISO-3 country code.
 */
export function getFlagPattern(iso3: string): FlagPatternDefinition {
  const code = (iso3 || '').toUpperCase();
  if (FLAG_PATTERNS[code]) {
    return FLAG_PATTERNS[code];
  }
  // Default fallback: vertical tricolor or solid color based on sovereign color
  return {
    type: 'vertical-tricolor',
    colors: ['#1d4ed8', '#e2e8f0', '#dc2626']
  };
}

/**
 * Draw flag pattern cleanly on any CanvasRenderingContext2D.
 */
export function drawFlagPatternToContext(
  ctx: CanvasRenderingContext2D,
  pattern: FlagPatternDefinition,
  width: number = 128,
  height: number = 128
): void {
  const { type, colors, options = {} } = pattern;

  switch (type) {
    case 'vertical-tricolor': {
      const c1 = colors[0] || '#1d4ed8';
      const c2 = colors[1] || '#ffffff';
      const c3 = colors[2] || '#dc2626';
      const mRatio = options.middleRatio || (1 / 3);
      const sideRatio = (1 - mRatio) / 2;
      const w1 = width * sideRatio;
      const w2 = width * mRatio;
      const w3 = width - w1 - w2;

      ctx.fillStyle = c1;
      ctx.fillRect(0, 0, w1, height);
      ctx.fillStyle = c2;
      ctx.fillRect(w1, 0, w2, height);
      ctx.fillStyle = c3;
      ctx.fillRect(w1 + w2, 0, w3, height);
      break;
    }

    case 'vertical-bicolor': {
      const c1 = colors[0] || '#15803d';
      const c2 = colors[1] || '#dc2626';
      const split = width * (options.splitRatio || 0.5);

      ctx.fillStyle = c1;
      ctx.fillRect(0, 0, split, height);
      ctx.fillStyle = c2;
      ctx.fillRect(split, 0, width - split, height);
      break;
    }

    case 'horizontal-bicolor': {
      const topColor = colors[0] || '#dc2626';
      const bottomColor = colors[1] || '#ffffff';
      const mid = height / 2;

      ctx.fillStyle = topColor;
      ctx.fillRect(0, 0, width, mid);
      ctx.fillStyle = bottomColor;
      ctx.fillRect(0, mid, width, height - mid);

      if (options.triangle) {
        ctx.fillStyle = options.triangle;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width * 0.45, height / 2);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'horizontal-tricolor': {
      const c1 = colors[0] || '#18181b';
      const c2 = colors[1] || '#dc2626';
      const c3 = colors[2] || '#d97706';

      const mRatio = options.middleRatio || (1 / 3);
      const tRatio = options.topRatio || ((1 - mRatio) / 2);
      const h1 = height * tRatio;
      const h2 = height * mRatio;
      const h3 = height - h1 - h2;

      ctx.fillStyle = c1;
      ctx.fillRect(0, 0, width, h1);
      ctx.fillStyle = c2;
      ctx.fillRect(0, h1, width, h2);
      ctx.fillStyle = c3;
      ctx.fillRect(0, h1 + h2, width, h3);
      break;
    }

    case 'circle-disc': {
      const bg = colors[0] || '#ffffff';
      const disc = colors[1] || '#dc2626';

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const cx = width * (options.offsetLeft || 0.5);
      const cy = height * 0.5;
      const radius = Math.min(width, height) * 0.28;

      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'nordic-cross': {
      const bg = colors[0] || '#0284c7';
      const cross = colors[1] || '#eab308';
      const barW = width * 0.16;
      const cx = width * (options.symmetric ? 0.5 : 0.36);
      const cy = height * 0.5;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      if (options.outline) {
        const outW = barW * 1.5;
        ctx.fillStyle = options.outline;
        ctx.fillRect(cx - outW / 2, 0, outW, height);
        ctx.fillRect(0, cy - outW / 2, width, outW);
      }

      ctx.fillStyle = cross;
      ctx.fillRect(cx - barW / 2, 0, barW, height);
      ctx.fillRect(0, cy - barW / 2, width, barW);
      break;
    }

    case 'cross': {
      const bg = colors[0] || '#dc2626';
      const cross = colors[1] || '#ffffff';
      const armW = width * 0.20;
      const armL = height * 0.60;
      const cx = width * 0.5;
      const cy = height * 0.5;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = cross;
      ctx.fillRect(cx - armW / 2, cy - armL / 2, armW, armL);
      ctx.fillRect(cx - armL / 2, cy - armW / 2, armL, armW);
      break;
    }

    case 'canton-stripes': {
      const canton = colors[0] || '#1e3a8a';
      const c1 = colors[1] || '#dc2626';
      const c2 = colors[2] || '#ffffff';
      const numStripes = 7;
      const stripeH = height / numStripes;

      for (let i = 0; i < numStripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? c1 : c2;
        ctx.fillRect(0, i * stripeH, width, stripeH);
      }

      ctx.fillStyle = canton;
      ctx.fillRect(0, 0, width * 0.45, height * 0.55);
      break;
    }

    case 'diamond-emblem': {
      const bg = colors[0] || '#15803d';
      const diamond = colors[1] || '#eab308';
      const disc = colors[2] || '#1e3a8a';

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Yellow Rhombus
      ctx.fillStyle = diamond;
      ctx.beginPath();
      ctx.moveTo(width * 0.5, height * 0.12);
      ctx.lineTo(width * 0.90, height * 0.5);
      ctx.lineTo(width * 0.5, height * 0.88);
      ctx.lineTo(width * 0.10, height * 0.5);
      ctx.closePath();
      ctx.fill();

      // Blue Center Disc
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'solid-emblem':
    default: {
      const bg = colors[0] || '#dc2626';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      if (options.star && colors[1]) {
        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.20, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
}
