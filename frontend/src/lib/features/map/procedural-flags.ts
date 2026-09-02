/**
 * Procedural Vexillological Pattern Generator for Global Sovereign Flags.
 * Renders authentic multi-stripe and geometric flag patterns via WebGL GLSL ShaderMaterials
 * with zero network latency, zero CORS errors, zero UV dependencies, and zero black screen rendering risks.
 */

import * as THREE from 'three';

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
  NOR: { type: 'nordic-cross', colors: ['#dc2626', '#1e3a8a'] }, // Norwegia (Red, Blue)
  DNK: { type: 'nordic-cross', colors: ['#dc2626', '#ffffff'] }, // Denmark (Red with White Cross)
  FIN: { type: 'nordic-cross', colors: ['#ffffff', '#1d4ed8'] }, // Finlandia (White with Blue Cross)
  ISL: { type: 'nordic-cross', colors: ['#0284c7', '#dc2626'] }, // Islandia (Blue, Red)
  CHE: { type: 'cross', colors: ['#dc2626', '#ffffff'] }, // Swiss (Red with White Cross)
  ESP: { type: 'horizontal-tricolor', colors: ['#dc2626', '#eab308', '#dc2626'] }, // Spanyol (Rojigualda)
  PRT: { type: 'vertical-bicolor', colors: ['#15803d', '#dc2626'] }, // Portugal (Green, Red)
  GRC: { type: 'canton-stripes', colors: ['#1d4ed8', '#ffffff', '#1d4ed8'] }, // Yunani (Blue & White Stripes)
  GBR: { type: 'cross', colors: ['#1e3a8a', '#dc2626'] }, // UK
  CZE: { type: 'horizontal-bicolor', colors: ['#ffffff', '#dc2626'] }, // Ceko
  SVK: { type: 'horizontal-tricolor', colors: ['#ffffff', '#1d4ed8', '#dc2626'] }, // Slowakia
  SVN: { type: 'horizontal-tricolor', colors: ['#ffffff', '#1d4ed8', '#dc2626'] }, // Slovenia
  HRV: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#1d4ed8'] }, // Kroasia
  SRB: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#ffffff'] }, // Serbia
  EST: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#18181b', '#ffffff'] }, // Estonia
  LVA: { type: 'horizontal-tricolor', colors: ['#881337', '#ffffff', '#881337'] }, // Latvia
  LTU: { type: 'horizontal-tricolor', colors: ['#eab308', '#15803d', '#dc2626'] }, // Lithuania
  LUX: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#0284c7'] }, // Luksemburg
  MCO: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Monako

  // ==========================================
  // ASIA & OCEANIA
  // ==========================================
  IDN: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Indonesia (Merah, Putih)
  SGP: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Singapura (Merah, Putih)
  MYS: { type: 'canton-stripes', colors: ['#1e40af', '#dc2626', '#ffffff'] }, // Malaysia (Jalur Gemilang)
  THA: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1e3a8a', '#dc2626'] }, // Thailand Trairanga
  PHL: { type: 'horizontal-bicolor', colors: ['#1d4ed8', '#dc2626'] }, // Filipina
  VNM: { type: 'circle-disc', colors: ['#dc2626', '#eab308'] }, // Vietnam (Red with Gold Star/Disc)
  JPN: { type: 'circle-disc', colors: ['#ffffff', '#dc2626'] }, // Jepang (Hinomaru)
  CHN: { type: 'solid-emblem', colors: ['#dc2626', '#eab308'] }, // Tiongkok
  KOR: { type: 'circle-disc', colors: ['#ffffff', '#1e3a8a', '#dc2626'] }, // Korea Selatan (Taegeuk)
  IND: { type: 'horizontal-tricolor', colors: ['#ea580c', '#ffffff', '#15803d'] }, // India (Saffron, White, Green)
  PAK: { type: 'vertical-bicolor', colors: ['#ffffff', '#047857'] }, // Pakistan
  BGD: { type: 'circle-disc', colors: ['#047857', '#dc2626'] }, // Bangladesh
  AUS: { type: 'canton-stripes', colors: ['#1e3a8a', '#ffffff', '#1e3a8a'] }, // Australia
  NZL: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Selandia Baru
  LAO: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#dc2626'] }, // Laos
  KHM: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#dc2626', '#1d4ed8'] }, // Kamboja
  MMR: { type: 'horizontal-tricolor', colors: ['#eab308', '#15803d', '#dc2626'] }, // Myanmar
  ARE: { type: 'vertical-bicolor', colors: ['#dc2626', '#15803d'] }, // UEA
  SAU: { type: 'solid-emblem', colors: ['#047857', '#ffffff'] }, // Arab Saudi
  TUR: { type: 'circle-disc', colors: ['#dc2626', '#ffffff'] }, // Turki
  QAT: { type: 'vertical-bicolor', colors: ['#ffffff', '#881337'] }, // Qatar
  BHR: { type: 'vertical-bicolor', colors: ['#ffffff', '#dc2626'] }, // Bahrain
  KWT: { type: 'horizontal-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Kuwait
  JOR: { type: 'horizontal-tricolor', colors: ['#18181b', '#ffffff', '#15803d'] }, // Yordania
  OMN: { type: 'horizontal-tricolor', colors: ['#ffffff', '#dc2626', '#15803d'] }, // Oman
  YEM: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Yaman
  IRQ: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Irak
  SYR: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Suriah
  LBN: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Lebanon
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
  LBY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#18181b', '#15803d'] }, // Libya

  // ==========================================
  // AMERICAS
  // ==========================================
  USA: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Amerika Serikat
  CAN: { type: 'vertical-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Kanada (Red, White, Red)
  MEX: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Meksiko (Green, White, Red)
  BRA: { type: 'diamond-emblem', colors: ['#15803d', '#eab308', '#1e40af'] }, // Brasil (Green, Yellow Diamond, Blue Disc)
  ARG: { type: 'horizontal-tricolor', colors: ['#0284c7', '#ffffff', '#0284c7'] }, // Argentina (Sky Blue, White, Sky Blue)
  COL: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Kolombia
  VEN: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Venezuela
  ECU: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Ekuador
  PER: { type: 'vertical-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Peru (Red, White, Red)
  CHL: { type: 'horizontal-bicolor', colors: ['#ffffff', '#dc2626'] }, // Chili
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
 * Compute bounding coordinates of a GeoJSON feature (minLon, maxLon, minLat, maxLat).
 */
export function computeFeatureBounds(feat: any): { minLon: number; maxLon: number; minLat: number; maxLat: number } {
  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
  function processCoords(coords: any) {
    if (typeof coords[0] === 'number') {
      const lon = coords[0];
      const lat = coords[1];
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      coords.forEach(processCoords);
    }
  }
  if (feat && feat.geometry && feat.geometry.coordinates) {
    processCoords(feat.geometry.coordinates);
  }
  // Fallback to label coords if available
  if (minLon > maxLon && feat?.properties) {
    const lx = Number(feat.properties.LABEL_X) || 0;
    const ly = Number(feat.properties.LABEL_Y) || 0;
    minLon = lx - 2.0;
    maxLon = lx + 2.0;
    minLat = ly - 2.0;
    maxLat = ly + 2.0;
  }
  return { minLon, maxLon, minLat, maxLat };
}

const proceduralMaterialsCache = new Map<string, THREE.ShaderMaterial>();

/**
 * Generate a procedural WebGL GLSL ShaderMaterial that renders multi-stripe and geometric
 * national flag patterns (e.g. France Blue-White-Red, Indonesia Red-White, Germany Black-Red-Gold).
 */
export function createProceduralFlagMaterial(feat: any, isDark: boolean = true): THREE.ShaderMaterial {
  const p = feat.properties || {};
  const iso3 = (p.ISO_A3 || p.ADM0_A3 || p.ISO_A3_EH || p.GU_A3 || '').toUpperCase();
  const key = `${iso3}_${isDark ? 'dark' : 'light'}`;

  if (proceduralMaterialsCache.has(key)) {
    return proceduralMaterialsCache.get(key)!;
  }

  const pattern = getFlagPattern(iso3);
  const bounds = computeFeatureBounds(feat);

  let patternTypeId = 0; // solid default
  if (pattern.type === 'vertical-tricolor') patternTypeId = 1;
  else if (pattern.type === 'horizontal-bicolor') patternTypeId = 2;
  else if (pattern.type === 'horizontal-tricolor') patternTypeId = 3;
  else if (pattern.type === 'circle-disc') patternTypeId = 4;
  else if (pattern.type === 'nordic-cross') patternTypeId = 5;
  else if (pattern.type === 'cross') patternTypeId = 6;
  else if (pattern.type === 'canton-stripes') patternTypeId = 7;
  else if (pattern.type === 'diamond-emblem') patternTypeId = 8;
  else if (pattern.type === 'vertical-bicolor') patternTypeId = 9;

  const c1 = new THREE.Color(pattern.colors[0] || '#1d4ed8');
  const c2 = new THREE.Color(pattern.colors[1] || '#ffffff');
  const c3 = new THREE.Color(pattern.colors[2] || '#dc2626');

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      minLon: { value: bounds.minLon },
      maxLon: { value: bounds.maxLon },
      minLat: { value: bounds.minLat },
      maxLat: { value: bounds.maxLat },
      c1: { value: c1 },
      c2: { value: c2 },
      c3: { value: c3 },
      patternType: { value: patternTypeId },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform float minLon;
      uniform float maxLon;
      uniform float minLat;
      uniform float maxLat;
      uniform vec3 c1;
      uniform vec3 c2;
      uniform vec3 c3;
      uniform int patternType;

      void main() {
        // Calculate spherical longitude and latitude in degrees directly from 3D vertex position
        float lon = atan(vPos.x, -vPos.z) * 57.29577951308232;
        float r = length(vPos);
        float lat = asin(clamp(vPos.y / max(0.001, r), -1.0, 1.0)) * 57.29577951308232;

        float u = clamp((lon - minLon) / max(0.001, maxLon - minLon), 0.0, 1.0);
        float v = clamp((lat - minLat) / max(0.001, maxLat - minLat), 0.0, 1.0);

        vec3 col = c1;

        if (patternType == 1) {
          // Vertical tricolor (France: Blue, White, Red; Chad: Blue, Yellow, Red; Italy: Green, White, Red; Belgium)
          if (u < 0.3333) col = c1;
          else if (u < 0.6666) col = c2;
          else col = c3;
        } else if (patternType == 2) {
          // Horizontal bicolor (Indonesia: Red, White; Ukraine: Blue, Yellow; Poland: White, Red)
          if (v >= 0.50) col = c1;
          else col = c2;
        } else if (patternType == 3) {
          // Horizontal tricolor (Germany: Black, Red, Gold; Netherlands: Red, White, Blue; Russia: White, Blue, Red; Austria)
          if (v >= 0.6666) col = c1;
          else if (v >= 0.3333) col = c2;
          else col = c3;
        } else if (patternType == 4) {
          // Circle disc (Japan: White + Red disc; Bangladesh: Green + Red disc; Turkey)
          float dist = distance(vec2(u, v), vec2(0.5, 0.5));
          if (dist < 0.26) col = c2;
          else col = c1;
        } else if (patternType == 5) {
          // Nordic cross (Sweden: Blue + Yellow cross; Norway; Denmark; Finland)
          if (abs(u - 0.38) < 0.07 || abs(v - 0.50) < 0.08) col = c2;
          else col = c1;
        } else if (patternType == 6) {
          // Symmetric cross (Switzerland: Red + White cross; England)
          if ((abs(u - 0.5) < 0.08 && abs(v - 0.5) < 0.28) || (abs(v - 0.5) < 0.08 && abs(u - 0.5) < 0.28)) col = c2;
          else col = c1;
        } else if (patternType == 7) {
          // Canton & stripes (USA, Malaysia, Greece)
          if (u < 0.45 && v >= 0.45) col = c1;
          else {
            float stripe = mod(floor(v * 10.0), 2.0);
            col = stripe > 0.5 ? c2 : c3;
          }
        } else if (patternType == 8) {
          // Diamond emblem (Brazil: Green + Yellow diamond + Blue circle)
          float dx = abs(u - 0.5) * 2.0;
          float dy = abs(v - 0.5) * 2.0;
          float dist = distance(vec2(u, v), vec2(0.5, 0.5));
          if (dist < 0.18) col = c3;
          else if (dx + dy <= 0.85) col = c2;
          else col = c1;
        } else if (patternType == 9) {
          // Vertical bicolor (Portugal, Algeria)
          if (u < 0.40) col = c1;
          else col = c2;
        }

        gl_FragColor = vec4(col, 0.94);
      }
    `,
    side: THREE.DoubleSide,
  });

  proceduralMaterialsCache.set(key, mat);
  return mat;
}
