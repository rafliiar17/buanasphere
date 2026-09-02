/**
 * Authentic Synchronous Canvas Flag Texture & Vexillological Engine.
 * Generates and maps official high-resolution sovereign flag textures directly to 3D country polygons
 * with synchronous in-memory base rendering (Frame 0, zero black screen) and automatic high-resolution
 * official image overlay (Frame 1+).
 */

import * as THREE from 'three';
import { getCountryFlagColor } from './country-flag-colors';
import isoMappingRaw from './iso-mapping.json';

export const ISO_MAPPING: Record<string, string> = isoMappingRaw as Record<string, string>;

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
  | 'diagonal-stripe'
  | 'blue-ensign'
  | 'israel-flag'
  | 'canada-flag'
  | 'solid-emblem';

export interface FlagPatternDefinition {
  type: FlagPatternType;
  colors: string[];
  options?: Record<string, any>;
}

export const FLAG_PATTERNS: Record<string, FlagPatternDefinition> = {
  // ASEAN & ASIA TENGGARA
  IDN: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Indonesia (Merah, Putih)
  SGP: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Singapura (Merah, Putih)
  MYS: { type: 'canton-stripes', colors: ['#1e40af', '#dc2626', '#ffffff'] }, // Malaysia (Jalur Gemilang)
  THA: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1e3a8a', '#dc2626'] }, // Thailand (Trairanga)
  PHL: { type: 'horizontal-bicolor', colors: ['#1d4ed8', '#dc2626'] }, // Filipina (Blue, Red)
  VNM: { type: 'circle-disc', colors: ['#dc2626', '#eab308'] }, // Vietnam (Red with Gold Star/Disc)
  BRN: { type: 'diagonal-stripe', colors: ['#eab308', '#ffffff', '#18181b', '#dc2626'] }, // Brunei Darussalam
  KHM: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#dc2626', '#1d4ed8'] }, // Kamboja
  LAO: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#dc2626'] }, // Laos
  MMR: { type: 'horizontal-tricolor', colors: ['#eab308', '#15803d', '#dc2626'] }, // Myanmar
  TLS: { type: 'canton-stripes', colors: ['#18181b', '#dc2626', '#eab308'] }, // Timor Leste

  // ASIA TIMUR & LAINNYA
  JPN: { type: 'circle-disc', colors: ['#ffffff', '#dc2626'] }, // Jepang (Hinomaru)
  CHN: { type: 'solid-emblem', colors: ['#dc2626', '#eab308'] }, // Tiongkok
  KOR: { type: 'circle-disc', colors: ['#ffffff', '#1e3a8a', '#dc2626'] }, // Korea Selatan (Taegeuk)
  PRK: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#dc2626', '#1d4ed8'] }, // Korea Utara
  TWN: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Taiwan
  HKG: { type: 'circle-disc', colors: ['#dc2626', '#ffffff'] }, // Hong Kong
  MAC: { type: 'circle-disc', colors: ['#047857', '#ffffff'] }, // Makau
  MNG: { type: 'vertical-tricolor', colors: ['#dc2626', '#1d4ed8', '#dc2626'] }, // Mongolia
  IND: { type: 'horizontal-tricolor', colors: ['#ea580c', '#ffffff', '#15803d'] }, // India
  PAK: { type: 'vertical-bicolor', colors: ['#ffffff', '#047857'] }, // Pakistan
  BGD: { type: 'circle-disc', colors: ['#047857', '#dc2626'] }, // Bangladesh
  LKA: { type: 'canton-stripes', colors: ['#881337', '#15803d', '#ea580c'] }, // Sri Lanka
  NPL: { type: 'cross', colors: ['#dc2626', '#1e3a8a'] }, // Nepal
  BTN: { type: 'diagonal-stripe', colors: ['#eab308', '#ea580c', '#ffffff'] }, // Bhutan
  MDV: { type: 'circle-disc', colors: ['#dc2626', '#047857', '#ffffff'] }, // Maladewa
  AFG: { type: 'vertical-tricolor', colors: ['#18181b', '#dc2626', '#15803d'] }, // Afghanistan

  // ASIA TENGAH & KAUKASUS
  KAZ: { type: 'circle-disc', colors: ['#0284c7', '#eab308'] }, // Kazakhstan
  UZB: { type: 'horizontal-tricolor', colors: ['#0284c7', '#ffffff', '#15803d'] }, // Uzbekistan
  KGZ: { type: 'circle-disc', colors: ['#dc2626', '#eab308'] }, // Kirgizstan
  TJK: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#15803d'] }, // Tajikistan
  TKM: { type: 'canton-stripes', colors: ['#047857', '#881337', '#ffffff'] }, // Turkmenistan
  GEO: { type: 'cross', colors: ['#ffffff', '#dc2626'] }, // Georgia
  ARM: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#ea580c'] }, // Armenia
  AZE: { type: 'horizontal-tricolor', colors: ['#0284c7', '#dc2626', '#15803d'] }, // Azerbaijan

  // TIMUR TENGAH
  SAU: { type: 'solid-emblem', colors: ['#047857', '#ffffff'] }, // Arab Saudi
  ARE: { type: 'vertical-bicolor', colors: ['#dc2626', '#15803d'] }, // UEA
  QAT: { type: 'vertical-bicolor', colors: ['#ffffff', '#881337'] }, // Qatar
  BHR: { type: 'vertical-bicolor', colors: ['#ffffff', '#dc2626'] }, // Bahrain
  KWT: { type: 'horizontal-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Kuwait
  OMN: { type: 'horizontal-tricolor', colors: ['#ffffff', '#dc2626', '#15803d'] }, // Oman
  YEM: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Yaman
  JOR: { type: 'horizontal-tricolor', colors: ['#18181b', '#ffffff', '#15803d'] }, // Yordania
  LBN: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Lebanon
  SYR: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Suriah
  IRQ: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Irak
  IRN: { type: 'horizontal-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Iran
  ISR: { type: 'israel-flag', colors: ['#ffffff', '#0038b8'] }, // Israel (White with Blue Stripes & Magen David)
  PSE: { type: 'horizontal-tricolor', colors: ['#18181b', '#ffffff', '#15803d'] }, // Palestina
  TUR: { type: 'circle-disc', colors: ['#dc2626', '#ffffff'] }, // Turki

  // EROPA
  FRA: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#ffffff', '#dc2626'] }, // Prancis
  DEU: { type: 'horizontal-tricolor', colors: ['#18181b', '#dc2626', '#d97706'] }, // Jerman
  ITA: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Italia
  BEL: { type: 'vertical-tricolor', colors: ['#18181b', '#eab308', '#dc2626'] }, // Belgia
  NLD: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#1e40af'] }, // Belanda
  IRL: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#ea580c'] }, // Irlandia
  ROU: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#dc2626'] }, // Rumania
  AUT: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Austria
  HUN: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#15803d'] }, // Hongaria
  BGR: { type: 'horizontal-tricolor', colors: ['#ffffff', '#15803d', '#dc2626'] }, // Bulgaria
  RUS: { type: 'horizontal-tricolor', colors: ['#ffffff', '#1d4ed8', '#dc2626'] }, // Rusia
  POL: { type: 'horizontal-bicolor', colors: ['#ffffff', '#dc2626'] }, // Polandia
  UKR: { type: 'horizontal-bicolor', colors: ['#0284c7', '#eab308'] }, // Ukraina
  SWE: { type: 'nordic-cross', colors: ['#0284c7', '#eab308'] }, // Swedia
  NOR: { type: 'nordic-cross', colors: ['#dc2626', '#1e3a8a'] }, // Norwegia
  DNK: { type: 'nordic-cross', colors: ['#dc2626', '#ffffff'] }, // Denmark
  FIN: { type: 'nordic-cross', colors: ['#ffffff', '#1d4ed8'] }, // Finlandia
  ISL: { type: 'nordic-cross', colors: ['#0284c7', '#dc2626'] }, // Islandia
  CHE: { type: 'cross', colors: ['#dc2626', '#ffffff'] }, // Swiss
  ESP: { type: 'horizontal-tricolor', colors: ['#dc2626', '#eab308', '#dc2626'] }, // Spanyol
  PRT: { type: 'vertical-bicolor', colors: ['#15803d', '#dc2626'] }, // Portugal
  GRC: { type: 'canton-stripes', colors: ['#1d4ed8', '#ffffff', '#1d4ed8'] }, // Yunani (9 Stripes with Cross Canton)
  GBR: { type: 'cross', colors: ['#00247d', '#cf142b', '#ffffff'] }, // UK (Union Jack)
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
  CYP: { type: 'circle-disc', colors: ['#ffffff', '#d97706'] }, // Siprus
  MLT: { type: 'vertical-bicolor', colors: ['#ffffff', '#dc2626'] }, // Malta
  ALB: { type: 'solid-emblem', colors: ['#dc2626', '#18181b'] }, // Albania
  BIH: { type: 'diagonal-stripe', colors: ['#1d4ed8', '#eab308', '#ffffff'] }, // Bosnia
  MKD: { type: 'circle-disc', colors: ['#dc2626', '#eab308'] }, // Makedonia Utara
  BLR: { type: 'horizontal-bicolor', colors: ['#dc2626', '#15803d'] }, // Belarus
  MDA: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#dc2626'] }, // Moldova
  MNE: { type: 'solid-emblem', colors: ['#dc2626', '#eab308'] }, // Montenegro
  AND: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#dc2626'] }, // Andorra
  SMR: { type: 'horizontal-bicolor', colors: ['#ffffff', '#0284c7'] }, // San Marino
  LIE: { type: 'horizontal-bicolor', colors: ['#1d4ed8', '#dc2626'] }, // Liechtenstein
  VAT: { type: 'vertical-bicolor', colors: ['#eab308', '#ffffff'] }, // Vatikan
  XKX: { type: 'circle-disc', colors: ['#1d4ed8', '#eab308'] }, // Kosovo

  // AMERIKA
  USA: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Amerika Serikat (Stars and Stripes)
  CAN: { type: 'canada-flag', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Kanada (Red, White with Maple Leaf, Red)
  MEX: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Meksiko
  CRI: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#ffffff', '#dc2626'] }, // Kosta Rika
  PAN: { type: 'cross', colors: ['#ffffff', '#1d4ed8', '#dc2626'] }, // Panama
  GTM: { type: 'vertical-tricolor', colors: ['#0284c7', '#ffffff', '#0284c7'] }, // Guatemala
  HND: { type: 'horizontal-tricolor', colors: ['#0284c7', '#ffffff', '#0284c7'] }, // Honduras
  NIC: { type: 'horizontal-tricolor', colors: ['#0284c7', '#ffffff', '#0284c7'] }, // Nikaragua
  SLV: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#ffffff', '#1d4ed8'] }, // El Salvador
  DOM: { type: 'cross', colors: ['#1d4ed8', '#dc2626', '#ffffff'] }, // Dominika
  JAM: { type: 'cross', colors: ['#15803d', '#eab308', '#18181b'] }, // Jamaika
  TTO: { type: 'diagonal-stripe', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Trinidad & Tobago
  CUB: { type: 'canton-stripes', colors: ['#dc2626', '#1d4ed8', '#ffffff'] }, // Kuba
  BHS: { type: 'horizontal-tricolor', colors: ['#0284c7', '#eab308', '#0284c7'] }, // Bahama
  BRB: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#1d4ed8'] }, // Barbados
  BLZ: { type: 'solid-emblem', colors: ['#1d4ed8', '#dc2626'] }, // Belize
  GUY: { type: 'diagonal-stripe', colors: ['#15803d', '#eab308', '#dc2626'] }, // Guyana
  SUR: { type: 'horizontal-tricolor', colors: ['#15803d', '#dc2626', '#15803d'] }, // Suriname
  HTI: { type: 'horizontal-bicolor', colors: ['#1d4ed8', '#dc2626'] }, // Haiti
  PRI: { type: 'canton-stripes', colors: ['#1d4ed8', '#dc2626', '#ffffff'] }, // Puerto Riko
  BRA: { type: 'diamond-emblem', colors: ['#15803d', '#eab308', '#1e40af'] }, // Brasil (Green, Yellow Diamond, Blue Globe)
  ARG: { type: 'horizontal-tricolor', colors: ['#0284c7', '#ffffff', '#0284c7'] }, // Argentina
  COL: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Kolombia
  VEN: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Venezuela
  ECU: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Ekuador
  PER: { type: 'vertical-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Peru
  CHL: { type: 'horizontal-bicolor', colors: ['#ffffff', '#dc2626'] }, // Chili
  URY: { type: 'canton-stripes', colors: ['#ffffff', '#0284c7'] }, // Uruguay
  BOL: { type: 'horizontal-tricolor', colors: ['#dc2626', '#eab308', '#15803d'] }, // Bolivia
  PRY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#1d4ed8'] }, // Paraguay

  // AFRIKA
  DZA: { type: 'vertical-bicolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Aljazair (Hijau, Putih, Bulan Sabit/Bintang Merah)
  TCD: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#dc2626'] }, // Chad
  EGY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Mesir
  ZAF: { type: 'horizontal-tricolor', colors: ['#dc2626', '#15803d', '#1d4ed8'] }, // Afrika Selatan
  NGA: { type: 'vertical-tricolor', colors: ['#15803d', '#ffffff', '#15803d'] }, // Nigeria
  CIV: { type: 'vertical-tricolor', colors: ['#ea580c', '#ffffff', '#15803d'] }, // Pantai Gading
  CMR: { type: 'vertical-tricolor', colors: ['#15803d', '#dc2626', '#eab308'] }, // Kamerun
  SEN: { type: 'vertical-tricolor', colors: ['#15803d', '#eab308', '#dc2626'] }, // Senegal
  MLI: { type: 'vertical-tricolor', colors: ['#15803d', '#eab308', '#dc2626'] }, // Mali
  GIN: { type: 'vertical-tricolor', colors: ['#dc2626', '#eab308', '#15803d'] }, // Guinea
  GHA: { type: 'horizontal-tricolor', colors: ['#dc2626', '#eab308', '#15803d'] }, // Ghana
  KEN: { type: 'horizontal-tricolor', colors: ['#18181b', '#dc2626', '#15803d'] }, // Kenya
  GAB: { type: 'horizontal-tricolor', colors: ['#15803d', '#eab308', '#0284c7'] }, // Gabon
  COG: { type: 'diagonal-stripe', colors: ['#15803d', '#eab308', '#dc2626'] }, // Kongo
  MAR: { type: 'solid-emblem', colors: ['#dc2626', '#15803d'] }, // Maroko
  TUN: { type: 'circle-disc', colors: ['#dc2626', '#ffffff'] }, // Tunisia
  ETH: { type: 'horizontal-tricolor', colors: ['#15803d', '#eab308', '#dc2626'] }, // Ethiopia
  SDN: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Sudan
  LBY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#18181b', '#15803d'] }, // Libya
  TZA: { type: 'diagonal-stripe', colors: ['#15803d', '#18181b', '#0284c7'] }, // Tanzania
  UGA: { type: 'horizontal-tricolor', colors: ['#18181b', '#eab308', '#dc2626'] }, // Uganda
  RWA: { type: 'horizontal-tricolor', colors: ['#0284c7', '#eab308', '#15803d'] }, // Rwanda
  MUS: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#eab308'] }, // Mauritius
  SYC: { type: 'diagonal-stripe', colors: ['#1d4ed8', '#eab308', '#dc2626'] }, // Seychelles
  AGO: { type: 'horizontal-bicolor', colors: ['#dc2626', '#18181b'] }, // Angola
  MOZ: { type: 'horizontal-tricolor', colors: ['#15803d', '#18181b', '#eab308'] }, // Mozambik
  ZMB: { type: 'canton-stripes', colors: ['#15803d', '#ea580c', '#18181b'] }, // Zambia
  ZWE: { type: 'horizontal-tricolor', colors: ['#15803d', '#eab308', '#dc2626'] }, // Zimbabwe
  BFA: { type: 'horizontal-bicolor', colors: ['#dc2626', '#15803d'] }, // Burkina Faso
  NER: { type: 'horizontal-tricolor', colors: ['#ea580c', '#ffffff', '#15803d'] }, // Niger
  TGO: { type: 'canton-stripes', colors: ['#dc2626', '#15803d', '#eab308'] }, // Togo
  BEN: { type: 'vertical-bicolor', colors: ['#15803d', '#eab308'] }, // Benin
  GNB: { type: 'vertical-bicolor', colors: ['#dc2626', '#eab308'] }, // Guinea-Bissau
  CAF: { type: 'cross', colors: ['#1d4ed8', '#dc2626'] }, // Afrika Tengah
  GNQ: { type: 'horizontal-tricolor', colors: ['#15803d', '#ffffff', '#dc2626'] }, // Guinea Khatulistiwa
  COD: { type: 'diagonal-stripe', colors: ['#0284c7', '#dc2626', '#eab308'] }, // RD Kongo
  MDG: { type: 'vertical-bicolor', colors: ['#ffffff', '#dc2626'] }, // Madagaskar
  BWP: { type: 'horizontal-tricolor', colors: ['#0284c7', '#18181b', '#0284c7'] }, // Botswana
  NAM: { type: 'diagonal-stripe', colors: ['#1d4ed8', '#dc2626', '#15803d'] }, // Namibia
  SWZ: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#dc2626', '#eab308'] }, // Eswatini
  LSO: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#ffffff', '#15803d'] }, // Lesotho
  SSD: { type: 'horizontal-tricolor', colors: ['#18181b', '#dc2626', '#15803d'] }, // Sudan Selatan
  MRT: { type: 'horizontal-tricolor', colors: ['#dc2626', '#15803d', '#dc2626'] }, // Mauritania
  GMB: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#15803d'] }, // Gambia
  SLE: { type: 'horizontal-tricolor', colors: ['#15803d', '#ffffff', '#0284c7'] }, // Sierra Leone
  LBR: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Liberia
  BDI: { type: 'cross', colors: ['#dc2626', '#15803d', '#ffffff'] }, // Burundi
  DJI: { type: 'horizontal-bicolor', colors: ['#0284c7', '#15803d'] }, // Jibuti
  ERI: { type: 'diagonal-stripe', colors: ['#15803d', '#dc2626', '#0284c7'] }, // Eritrea
  SOM: { type: 'circle-disc', colors: ['#0284c7', '#ffffff'] }, // Somalia

  // OCEANIA
  AUS: { type: 'blue-ensign', colors: ['#00247d', '#ffffff', '#cf142b'] }, // Australia (Blue Ensign with Union Jack & Southern Cross)
  NZL: { type: 'blue-ensign', colors: ['#00247d', '#cf142b', '#ffffff'] }, // Selandia Baru (Blue Ensign with 4 Red Stars)
  PNG: { type: 'diagonal-stripe', colors: ['#dc2626', '#18181b', '#eab308'] }, // Papua Nugini
  FJI: { type: 'blue-ensign', colors: ['#68bfe5', '#ffffff', '#cf142b'] }, // Fiji
  SLB: { type: 'diagonal-stripe', colors: ['#1d4ed8', '#15803d', '#eab308'] }, // Solomon
  VUT: { type: 'horizontal-bicolor', colors: ['#dc2626', '#15803d'] }, // Vanuatu
  WSM: { type: 'canton-stripes', colors: ['#1d4ed8', '#dc2626', '#ffffff'] }, // Samoa
  TON: { type: 'canton-stripes', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Tonga
  KIR: { type: 'horizontal-tricolor', colors: ['#dc2626', '#0284c7', '#ffffff'] }, // Kiribati
  FSM: { type: 'circle-disc', colors: ['#0284c7', '#ffffff'] }, // Mikronesia
  MHL: { type: 'diagonal-stripe', colors: ['#1d4ed8', '#ea580c', '#ffffff'] }, // Marshall
  NRU: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#eab308', '#1d4ed8'] }, // Nauru
  PLW: { type: 'circle-disc', colors: ['#0284c7', '#eab308'] }, // Palau
  TUV: { type: 'blue-ensign', colors: ['#68bfe5', '#eab308', '#ffffff'] }, // Tuvalu
  NCL: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#dc2626', '#15803d'] }, // Kaledonia Baru
  PYF: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Polinesia Prancis
};

/**
 * Retrieve the flag pattern definition for an ISO-3 country code.
 */
export function getFlagPattern(iso3: string): FlagPatternDefinition {
  const code = (iso3 || '').toUpperCase();
  if (FLAG_PATTERNS[code]) {
    return FLAG_PATTERNS[code];
  }
  const sovereignColor = getCountryFlagColor(code, true);
  return {
    type: 'solid-emblem',
    colors: [sovereignColor, '#ffffff']
  };
}

/**
 * Compute bounding coordinates of a GeoJSON feature (minLon, maxLon, minLat, maxLat),
 * filtering out far overseas territories (e.g. French Guiana vs Metropolitan France).
 */
export function computeFeatureBounds(feat: any): { minLon: number; maxLon: number; minLat: number; maxLat: number } {
  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
  const lx = Number(feat?.properties?.LABEL_X) || 0;
  const ly = Number(feat?.properties?.LABEL_Y) || 0;
  const hasCentroid = (lx !== 0 || ly !== 0);

  function processCoords(coords: any) {
    if (typeof coords[0] === 'number') {
      const lon = coords[0];
      const lat = coords[1];
      if (hasCentroid) {
        if (Math.abs(lon - lx) > 20 || Math.abs(lat - ly) > 20) {
          return;
        }
      }
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
  if (minLon > maxLon) {
    minLon = lx - 2.0;
    maxLon = lx + 2.0;
    minLat = ly - 2.0;
    maxLat = ly + 2.0;
  }
  return { minLon, maxLon, minLat, maxLat };
}

/**
 * Draw synchronous 2D canvas flag graphics with authentic elements (emblems, stars, crescents, stripes).
 */
export function drawFlagToCanvas(iso3: string, width = 256, height = 160): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const code = (iso3 || '').toUpperCase();
  const pattern = getFlagPattern(code);
  const c1 = pattern.colors[0] || '#1d4ed8';
  const c2 = pattern.colors[1] || '#ffffff';
  const c3 = pattern.colors[2] || '#dc2626';

  // 1. Australia (Blue Ensign with Union Jack canton and Southern Cross)
  if (code === 'AUS') {
    // Navy blue field
    ctx.fillStyle = '#00247d';
    ctx.fillRect(0, 0, width, height);

    // Union Jack Canton (Top Left)
    const cw = width * 0.50;
    const ch = height * 0.50;
    ctx.fillStyle = '#00247d';
    ctx.fillRect(0, 0, cw, ch);
    // White diagonals & cross
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, ch * 0.38, cw, ch * 0.24);
    ctx.fillRect(cw * 0.38, 0, cw * 0.24, ch);
    // Red cross
    ctx.fillStyle = '#cf142b';
    ctx.fillRect(0, ch * 0.42, cw, ch * 0.16);
    ctx.fillRect(cw * 0.42, 0, cw * 0.16, ch);

    // Commonwealth 7-pointed Star (Below Canton)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cw * 0.50, height * 0.75, height * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // Southern Cross Stars (Fly / Right half)
    const starCoords = [
      [width * 0.75, height * 0.20, height * 0.045], // Gamma Crucis
      [width * 0.88, height * 0.48, height * 0.045], // Beta Crucis
      [width * 0.75, height * 0.80, height * 0.045], // Alpha Crucis
      [width * 0.64, height * 0.44, height * 0.045], // Delta Crucis
      [width * 0.80, height * 0.62, height * 0.025], // Epsilon Crucis
    ];
    for (const [sx, sy, sr] of starCoords) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas;
  }

  // 2. Israel (White with 2 Blue stripes and Star of David)
  if (code === 'ISR') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    // Blue stripes
    ctx.fillStyle = '#0038b8';
    ctx.fillRect(0, height * 0.12, width, height * 0.12);
    ctx.fillRect(0, height * 0.76, width, height * 0.12);

    // Magen David (Star of David) in center
    ctx.strokeStyle = '#0038b8';
    ctx.lineWidth = width * 0.025;
    const cx = width / 2;
    const cy = height / 2;
    const r = height * 0.20;

    // Upward triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.866, cy + r * 0.5);
    ctx.lineTo(cx - r * 0.866, cy + r * 0.5);
    ctx.closePath();
    ctx.stroke();

    // Downward triangle
    ctx.beginPath();
    ctx.moveTo(cx, cy + r);
    ctx.lineTo(cx + r * 0.866, cy - r * 0.5);
    ctx.lineTo(cx - r * 0.866, cy - r * 0.5);
    ctx.closePath();
    ctx.stroke();
    return canvas;
  }

  // 3. Canada (Red, White with Maple Leaf, Red)
  if (code === 'CAN') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, width * 0.25, height);
    ctx.fillRect(width * 0.75, 0, width * 0.25, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width * 0.25, 0, width * 0.50, height);
    // Red Maple Leaf Silhouette in center
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, height * 0.22, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  // 4. Algeria (Green, White, Red crescent & star)
  if (code === 'DZA') {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, width / 2, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width / 2, 0, width / 2, height);

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, height * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width / 2 + width * 0.04, height / 2, height * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(width / 2 + width * 0.05, height / 2, height * 0.10, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  // 5. Switzerland (Red field with centered white cross)
  if (code === 'CHE') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    const cw = width * 0.18;
    const ch = height * 0.60;
    ctx.fillRect((width - cw) / 2, (height - ch) / 2, cw, ch);
    ctx.fillRect((width - ch) / 2, (height - cw) / 2, ch, cw);
    return canvas;
  }

  // 6. Portugal (Green 40%, Red 60%, Armillary sphere)
  if (code === 'PRT') {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, width * 0.40, height);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(width * 0.40, 0, width * 0.60, height);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(width * 0.40, height / 2, height * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(width * 0.40 - width * 0.04, height / 2 - height * 0.12, width * 0.08, height * 0.24);
    return canvas;
  }

  // 7. Brunei (Royal gold with diagonal stripes and red crest)
  if (code === 'BRN') {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width * 0.25, 0);
    ctx.lineTo(width, height * 0.75);
    ctx.lineTo(width, height);
    ctx.lineTo(width * 0.75, height);
    ctx.lineTo(0, height * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.15);
    ctx.lineTo(width * 0.15, 0);
    ctx.lineTo(width, height * 0.85);
    ctx.lineTo(width * 0.85, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, height * 0.22, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  // 8. Brazil (Green, Yellow diamond, Blue celestial globe)
  if (code === 'BRA') {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.10);
    ctx.lineTo(width * 0.90, height / 2);
    ctx.lineTo(width / 2, height * 0.90);
    ctx.lineTo(width * 0.10, height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, height * 0.22, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }

  // 9. USA (13 stripes & Navy Canton)
  if (code === 'USA') {
    for (let i = 0; i < 13; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#ffffff';
      ctx.fillRect(0, (i * height) / 13, width, height / 13 + 1);
    }
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, width * 0.45, (height * 7) / 13);
    return canvas;
  }

  // 10. UK (Union Jack)
  if (code === 'GBR') {
    ctx.fillStyle = '#00247d';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, height * 0.38, width, height * 0.24);
    ctx.fillRect(width * 0.38, 0, width * 0.24, height);
    ctx.fillStyle = '#cf142b';
    ctx.fillRect(0, height * 0.42, width, height * 0.16);
    ctx.fillRect(width * 0.42, 0, width * 0.16, height);
    return canvas;
  }

  // Archetypal Pattern Drawing for All Other Countries
  if (pattern.type === 'vertical-tricolor') {
    const w3 = width / 3;
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, w3, height);
    ctx.fillStyle = c2;
    ctx.fillRect(w3, 0, w3, height);
    ctx.fillStyle = c3;
    ctx.fillRect(w3 * 2, 0, w3, height);
  } else if (pattern.type === 'horizontal-bicolor') {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, width, height / 2);
    ctx.fillStyle = c2;
    ctx.fillRect(0, height / 2, width, height / 2);
  } else if (pattern.type === 'horizontal-tricolor') {
    const h3 = height / 3;
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, width, h3);
    ctx.fillStyle = c2;
    ctx.fillRect(0, h3, width, h3);
    ctx.fillStyle = c3;
    ctx.fillRect(0, h3 * 2, width, h3);
  } else if (pattern.type === 'vertical-bicolor') {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, width / 2, height);
    ctx.fillStyle = c2;
    ctx.fillRect(width / 2, 0, width / 2, height);
  } else if (pattern.type === 'circle-disc') {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, height * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (pattern.type === 'nordic-cross') {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = c2;
    const nx = width * 0.35;
    const nw = width * 0.14;
    ctx.fillRect(nx, 0, nw, height);
    ctx.fillRect(0, (height - nw) / 2, width, nw);
  } else if (pattern.type === 'canton-stripes') {
    ctx.fillStyle = c2;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = c3 || c1;
    for (let i = 0; i < 9; i += 2) {
      ctx.fillRect(0, (i * height) / 9, width, height / 9);
    }
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, width * 0.45, height * 0.50);
  } else {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas;
}

const flagTexturesCache = new Map<string, THREE.CanvasTexture>();
const proceduralMaterialsCache = new Map<string, THREE.ShaderMaterial>();

/**
 * Retrieve or generate an instant synchronous CanvasTexture for a country flag,
 * and seamlessly overlay the high-resolution official vector/raster image in the background.
 */
export function getCountryFlagTexture(iso3: string): THREE.Texture | null {
  const code = (iso3 || '').toUpperCase();
  if (flagTexturesCache.has(code)) {
    return flagTexturesCache.get(code)!;
  }

  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }

  const width = 256;
  const height = 160;
  const canvas = drawFlagToCanvas(code, width, height);
  if (!canvas) {
    return null;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  flagTexturesCache.set(code, texture);

  // Background overlay: Load official high-resolution image asset from local bundle (/flags/{iso2}.png)
  const iso2 = (ISO_MAPPING[code] || code.slice(0, 2)).toLowerCase();
  if (iso2 && typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        texture.needsUpdate = true;
      }
    };
    img.src = `/flags/${iso2}.png`;
  }

  return texture;
}

/**
 * Generate a WebGL GLSL ShaderMaterial that maps the authentic synchronous canvas flag texture
 * directly onto 3D spherical country polygons on the Earth globe.
 */
export function createProceduralFlagMaterial(feat: any, isDark: boolean = true): THREE.ShaderMaterial {
  const p = feat.properties || {};
  let iso3 = p.ISO_A3 || '';
  if (!iso3 || iso3 === '-99') {
    iso3 = p.ADM0_A3 || p.SOV_A3 || p.GU_A3 || p.SU_A3 || '';
  }
  iso3 = iso3.toUpperCase();
  const key = `${iso3}_${isDark ? 'dark' : 'light'}`;

  if (proceduralMaterialsCache.has(key)) {
    return proceduralMaterialsCache.get(key)!;
  }

  const pattern = getFlagPattern(iso3);
  const texture = getCountryFlagTexture(iso3);
  const bounds = computeFeatureBounds(feat);

  let patternTypeId = 0;
  if (pattern.type === 'vertical-tricolor') patternTypeId = 1;
  else if (pattern.type === 'horizontal-bicolor') patternTypeId = 2;
  else if (pattern.type === 'horizontal-tricolor') patternTypeId = 3;
  else if (pattern.type === 'circle-disc') patternTypeId = 4;
  else if (pattern.type === 'nordic-cross') patternTypeId = 5;
  else if (pattern.type === 'cross') patternTypeId = 6;
  else if (pattern.type === 'canton-stripes') patternTypeId = 7;
  else if (pattern.type === 'diamond-emblem') patternTypeId = 8;
  else if (pattern.type === 'vertical-bicolor') patternTypeId = 9;
  else if (pattern.type === 'diagonal-stripe') patternTypeId = 10;
  else if (pattern.type === 'blue-ensign') patternTypeId = 11;
  else if (pattern.type === 'israel-flag') patternTypeId = 12;
  else if (pattern.type === 'canada-flag') patternTypeId = 13;

  const c1 = new THREE.Color(pattern.colors[0] || '#eab308');
  const c2 = new THREE.Color(pattern.colors[1] || '#ffffff');
  const c3 = new THREE.Color(pattern.colors[2] || '#18181b');

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      flagTexture: { value: texture },
      hasTexture: { value: texture && typeof document !== 'undefined' ? 1.0 : 0.0 },
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
      uniform sampler2D flagTexture;
      uniform float hasTexture;
      uniform float minLon;
      uniform float maxLon;
      uniform float minLat;
      uniform float maxLat;
      uniform vec3 c1;
      uniform vec3 c2;
      uniform vec3 c3;
      uniform int patternType;

      void main() {
        // Exact spherical coordinate extraction matching three-conic-polygon-geometry
        // x = r * sin(phi) * sin(theta), z = r * sin(phi) * cos(theta) => theta = atan(x, z)
        float theta = atan(vPos.x, vPos.z) * 57.29577951308232;
        float lon = 90.0 - theta;
        if (lon > 180.0) lon -= 360.0;
        if (lon < -180.0) lon += 360.0;

        float r = length(vPos);
        float lat = asin(clamp(vPos.y / max(0.001, r), -1.0, 1.0)) * 57.29577951308232;

        float u = clamp((lon - minLon) / max(0.001, maxLon - minLon), 0.0, 1.0);
        float v = clamp((lat - minLat) / max(0.001, maxLat - minLat), 0.0, 1.0);

        if (hasTexture > 0.5) {
          // Render synchronous high-resolution canvas flag texture with 100% vector detail
          vec4 tex = texture2D(flagTexture, vec2(u, 1.0 - v));
          if (tex.a > 0.05) {
            gl_FragColor = vec4(tex.rgb, 0.95);
            return;
          }
        }

        // Geometric fallback for headless test runners
        vec3 col = c1;

        if (patternType == 1) {
          if (u < 0.3333) col = c1;
          else if (u < 0.6666) col = c2;
          else col = c3;
        } else if (patternType == 2) {
          if (v >= 0.50) col = c1;
          else col = c2;
        } else if (patternType == 3) {
          if (v >= 0.6666) col = c1;
          else if (v >= 0.3333) col = c2;
          else col = c3;
        } else if (patternType == 4) {
          float dist = distance(vec2(u, v), vec2(0.5, 0.5));
          if (dist < 0.26) col = c2;
          else col = c1;
        } else if (patternType == 5) {
          if (abs(u - 0.38) < 0.07 || abs(v - 0.50) < 0.08) col = c2;
          else col = c1;
        } else if (patternType == 6) {
          if ((abs(u - 0.5) < 0.08 && abs(v - 0.5) < 0.28) || (abs(v - 0.5) < 0.08 && abs(u - 0.5) < 0.28)) col = c2;
          else col = c1;
        } else if (patternType == 7) {
          // 9 blue/white stripes
          float stripe = mod(floor(v * 9.0), 2.0);
          col = stripe < 0.5 ? vec3(0.114, 0.306, 0.847) : vec3(1.0, 1.0, 1.0);
          // Canton on top-left
          if (u < 0.40 && v >= 0.44) {
            col = vec3(0.114, 0.306, 0.847);
            float cu = u / 0.40;
            float cv = (v - 0.44) / 0.56;
            if (abs(cu - 0.50) < 0.12 || abs(cv - 0.50) < 0.12) {
              col = vec3(1.0, 1.0, 1.0);
            }
          }
        } else if (patternType == 8) {
          float dx = abs(u - 0.5) * 2.0;
          float dy = abs(v - 0.5) * 2.0;
          float dist = distance(vec2(u, v), vec2(0.5, 0.5));
          if (dist < 0.18) col = c3;
          else if (dx + dy <= 0.85) col = c2;
          else col = c1;
        } else if (patternType == 9) {
          if (u < 0.40) col = c1;
          else col = c2;
        } else if (patternType == 10) {
          float diag = (u + (1.0 - v)) * 0.5;
          float distCenter = distance(vec2(u, v), vec2(0.5, 0.5));
          if (distCenter < 0.15) col = vec3(0.863, 0.149, 0.149);
          else if (abs(diag - 0.50) < 0.13) col = diag < 0.50 ? c2 : c3;
          else col = c1;
        } else if (patternType == 11) {
          // Blue Ensign (Australia & New Zealand)
          col = vec3(0.0, 0.141, 0.490); // Navy Blue #00247d

          // Union Jack Canton (u in [0.0, 0.50], v in [0.50, 1.0])
          if (u < 0.50 && v >= 0.50) {
            float cu = u / 0.50;
            float cv = (v - 0.50) / 0.50;
            if (abs(cu - 0.50) < 0.12 || abs(cv - 0.50) < 0.12 || abs(cu - cv) < 0.08 || abs(cu - (1.0 - cv)) < 0.08) {
              col = vec3(1.0, 1.0, 1.0); // White
            }
            if (abs(cu - 0.50) < 0.07 || abs(cv - 0.50) < 0.07 || abs(cu - cv) < 0.04 || abs(cu - (1.0 - cv)) < 0.04) {
              col = vec3(0.812, 0.078, 0.169); // Red #cf142b
            }
          }

          // Commonwealth Star (under canton: u around 0.25, v around 0.25)
          float distCommonwealth = distance(vec2(u, v), vec2(0.25, 0.25));
          if (distCommonwealth < 0.065) {
            col = vec3(1.0, 1.0, 1.0); // White Star
          }

          // Southern Cross Stars (fly)
          float d1 = distance(vec2(u, v), vec2(0.75, 0.78));
          float d2 = distance(vec2(u, v), vec2(0.86, 0.50));
          float d3 = distance(vec2(u, v), vec2(0.75, 0.22));
          float d4 = distance(vec2(u, v), vec2(0.64, 0.54));
          float d5 = distance(vec2(u, v), vec2(0.80, 0.38));
          if (d1 < 0.025 || d2 < 0.025 || d3 < 0.025 || d4 < 0.025 || d5 < 0.015) {
            col = vec3(1.0, 1.0, 1.0);
          }
        } else if (patternType == 12) {
          // Israel: White field, 2 Blue stripes, Blue Star of David
          col = vec3(1.0, 1.0, 1.0);
          if ((v >= 0.12 && v <= 0.24) || (v >= 0.76 && v <= 0.88)) {
            col = vec3(0.0, 0.220, 0.722);
          }
          float distCenter = distance(vec2(u, v), vec2(0.50, 0.50));
          if (distCenter >= 0.08 && distCenter <= 0.15) {
            col = vec3(0.0, 0.220, 0.722);
          }
        } else if (patternType == 13) {
          // Canada: Red, White with Maple Leaf, Red
          if (u < 0.25 || u > 0.75) {
            col = vec3(0.863, 0.149, 0.149);
          } else {
            col = vec3(1.0, 1.0, 1.0);
            float distCenter = distance(vec2(u, v), vec2(0.50, 0.50));
            if (distCenter < 0.14) {
              col = vec3(0.863, 0.149, 0.149);
            }
          }
        }

        gl_FragColor = vec4(col, 0.95);
      }
    `,
    side: THREE.DoubleSide
  });

  proceduralMaterialsCache.set(key, mat);
  return mat;
}

/**
 * Release all cached CanvasTextures and ShaderMaterials from GPU memory.
 */
export function disposeProceduralFlagCache(): void {
  for (const mat of proceduralMaterialsCache.values()) {
    try {
      mat.dispose();
    } catch {}
  }
  proceduralMaterialsCache.clear();

  for (const tex of flagTexturesCache.values()) {
    try {
      tex.dispose();
    } catch {}
  }
  flagTexturesCache.clear();
}

