/**
 * Procedural Vexillological Pattern Generator for Global Sovereign Flags.
 * Renders authentic multi-stripe and geometric flag patterns via WebGL GLSL ShaderMaterials
 * with zero network latency, zero CORS errors, zero UV dependencies, and zero black screen rendering risks.
 */

import * as THREE from 'three';
import { getCountryFlagColor } from './country-flag-colors';

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
  | 'solid-emblem';

export interface FlagPatternDefinition {
  type: FlagPatternType;
  colors: string[];
  options?: Record<string, any>;
}

export const FLAG_PATTERNS: Record<string, FlagPatternDefinition> = {
  // ==========================================
  // ASEAN & ASIA TENGGARA
  // ==========================================
  IDN: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Indonesia (Merah, Putih)
  SGP: { type: 'horizontal-bicolor', colors: ['#dc2626', '#ffffff'] }, // Singapura (Merah, Putih)
  MYS: { type: 'canton-stripes', colors: ['#1e40af', '#dc2626', '#ffffff'] }, // Malaysia (Jalur Gemilang)
  THA: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1e3a8a', '#dc2626'] }, // Thailand (Trairanga)
  PHL: { type: 'horizontal-bicolor', colors: ['#1d4ed8', '#dc2626'] }, // Filipina (Blue, Red)
  VNM: { type: 'circle-disc', colors: ['#dc2626', '#eab308'] }, // Vietnam (Red with Gold Star/Disc)
  BRN: { type: 'diagonal-stripe', colors: ['#eab308', '#ffffff', '#18181b', '#dc2626'] }, // Brunei Darussalam (Kuning Emas, Putih, Hitam, Merah)
  KHM: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#dc2626', '#1d4ed8'] }, // Kamboja (Blue, Red, Blue)
  LAO: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#dc2626'] }, // Laos (Red, Blue, Red)
  MMR: { type: 'horizontal-tricolor', colors: ['#eab308', '#15803d', '#dc2626'] }, // Myanmar (Yellow, Green, Red)
  TLS: { type: 'canton-stripes', colors: ['#18181b', '#dc2626', '#eab308'] }, // Timor Leste (Black/Yellow Triangle, Red)

  // ==========================================
  // ASIA TIMUR & ASIA LAINNYA
  // ==========================================
  JPN: { type: 'circle-disc', colors: ['#ffffff', '#dc2626'] }, // Jepang (Hinomaru)
  CHN: { type: 'solid-emblem', colors: ['#dc2626', '#eab308'] }, // Tiongkok
  KOR: { type: 'circle-disc', colors: ['#ffffff', '#1e3a8a', '#dc2626'] }, // Korea Selatan (Taegeuk)
  PRK: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#dc2626', '#1d4ed8'] }, // Korea Utara
  TWN: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Taiwan (Blue Canton, Red field)
  HKG: { type: 'circle-disc', colors: ['#dc2626', '#ffffff'] }, // Hong Kong (Red with White Bauhinia)
  MAC: { type: 'circle-disc', colors: ['#047857', '#ffffff'] }, // Makau (Green with White Lotus)
  MNG: { type: 'vertical-tricolor', colors: ['#dc2626', '#1d4ed8', '#dc2626'] }, // Mongolia
  IND: { type: 'horizontal-tricolor', colors: ['#ea580c', '#ffffff', '#15803d'] }, // India (Saffron, White, Green)
  PAK: { type: 'vertical-bicolor', colors: ['#ffffff', '#047857'] }, // Pakistan (White, Green)
  BGD: { type: 'circle-disc', colors: ['#047857', '#dc2626'] }, // Bangladesh (Green with Red Sun)
  LKA: { type: 'canton-stripes', colors: ['#881337', '#15803d', '#ea580c'] }, // Sri Lanka (Maroon, Green, Orange)
  NPL: { type: 'cross', colors: ['#dc2626', '#1e3a8a'] }, // Nepal (Crimson Red, Blue border)
  BTN: { type: 'diagonal-stripe', colors: ['#eab308', '#ea580c', '#ffffff'] }, // Bhutan (Yellow, Orange)
  MDV: { type: 'circle-disc', colors: ['#dc2626', '#047857', '#ffffff'] }, // Maladewa
  AFG: { type: 'vertical-tricolor', colors: ['#18181b', '#dc2626', '#15803d'] }, // Afghanistan

  // ==========================================
  // ASIA TENGAH & KAUKASUS
  // ==========================================
  KAZ: { type: 'circle-disc', colors: ['#0284c7', '#eab308'] }, // Kazakhstan (Sky Blue with Gold Sun)
  UZB: { type: 'horizontal-tricolor', colors: ['#0284c7', '#ffffff', '#15803d'] }, // Uzbekistan
  KGZ: { type: 'circle-disc', colors: ['#dc2626', '#eab308'] }, // Kirgizstan
  TJK: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#15803d'] }, // Tajikistan
  TKM: { type: 'canton-stripes', colors: ['#047857', '#881337', '#ffffff'] }, // Turkmenistan
  GEO: { type: 'cross', colors: ['#ffffff', '#dc2626'] }, // Georgia (St. George Cross)
  ARM: { type: 'horizontal-tricolor', colors: ['#dc2626', '#1d4ed8', '#ea580c'] }, // Armenia
  AZE: { type: 'horizontal-tricolor', colors: ['#0284c7', '#dc2626', '#15803d'] }, // Azerbaijan

  // ==========================================
  // TIMUR TENGAH
  // ==========================================
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
  ISR: { type: 'horizontal-tricolor', colors: ['#ffffff', '#1d4ed8', '#ffffff'] }, // Israel
  PSE: { type: 'horizontal-tricolor', colors: ['#18181b', '#ffffff', '#15803d'] }, // Palestina
  TUR: { type: 'circle-disc', colors: ['#dc2626', '#ffffff'] }, // Turki

  // ==========================================
  // EROPA
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
  GRC: { type: 'canton-stripes', colors: ['#1d4ed8', '#ffffff', '#1d4ed8'] }, // Yunani
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

  // ==========================================
  // AMERIKA UTARA, TENGAH & KARIBIA
  // ==========================================
  USA: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Amerika Serikat
  CAN: { type: 'vertical-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Kanada
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
  ATG: { type: 'diagonal-stripe', colors: ['#dc2626', '#18181b', '#0284c7'] }, // Antigua
  DMA: { type: 'cross', colors: ['#15803d', '#eab308', '#18181b'] }, // Dominika
  GRD: { type: 'cross', colors: ['#dc2626', '#eab308', '#15803d'] }, // Grenada
  KNA: { type: 'diagonal-stripe', colors: ['#15803d', '#dc2626', '#18181b'] }, // St. Kitts
  LCA: { type: 'circle-disc', colors: ['#0284c7', '#eab308', '#18181b'] }, // St. Lucia
  VCT: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#15803d'] }, // St. Vincent

  // ==========================================
  // AMERIKA SELATAN
  // ==========================================
  BRA: { type: 'diamond-emblem', colors: ['#15803d', '#eab308', '#1e40af'] }, // Brasil
  ARG: { type: 'horizontal-tricolor', colors: ['#0284c7', '#ffffff', '#0284c7'] }, // Argentina
  COL: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Kolombia
  VEN: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Venezuela
  ECU: { type: 'horizontal-tricolor', colors: ['#eab308', '#1d4ed8', '#dc2626'] }, // Ekuador
  PER: { type: 'vertical-tricolor', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Peru
  CHL: { type: 'horizontal-bicolor', colors: ['#ffffff', '#dc2626'] }, // Chili
  URY: { type: 'canton-stripes', colors: ['#ffffff', '#0284c7'] }, // Uruguay
  BOL: { type: 'horizontal-tricolor', colors: ['#dc2626', '#eab308', '#15803d'] }, // Bolivia
  PRY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#1d4ed8'] }, // Paraguay

  // ==========================================
  // AFRIKA
  // ==========================================
  TCD: { type: 'vertical-tricolor', colors: ['#1d4ed8', '#eab308', '#dc2626'] }, // Chad (Bleu, Jaune, Rouge)
  EGY: { type: 'horizontal-tricolor', colors: ['#dc2626', '#ffffff', '#18181b'] }, // Mesir (Red, White, Black)
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
  DZA: { type: 'vertical-bicolor', colors: ['#15803d', '#ffffff'] }, // Aljazair
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

  // ==========================================
  // OCEANIA & PASIFIK
  // ==========================================
  AUS: { type: 'canton-stripes', colors: ['#1e3a8a', '#ffffff', '#1e3a8a'] }, // Australia
  NZL: { type: 'canton-stripes', colors: ['#1e3a8a', '#dc2626', '#ffffff'] }, // Selandia Baru
  PNG: { type: 'diagonal-stripe', colors: ['#dc2626', '#18181b', '#eab308'] }, // Papua Nugini
  FJI: { type: 'canton-stripes', colors: ['#0284c7', '#ffffff'] }, // Fiji
  SLB: { type: 'diagonal-stripe', colors: ['#1d4ed8', '#15803d', '#eab308'] }, // Solomon
  VUT: { type: 'horizontal-bicolor', colors: ['#dc2626', '#15803d'] }, // Vanuatu
  WSM: { type: 'canton-stripes', colors: ['#1d4ed8', '#dc2626', '#ffffff'] }, // Samoa
  TON: { type: 'canton-stripes', colors: ['#dc2626', '#ffffff', '#dc2626'] }, // Tonga
  KIR: { type: 'horizontal-tricolor', colors: ['#dc2626', '#0284c7', '#ffffff'] }, // Kiribati
  FSM: { type: 'circle-disc', colors: ['#0284c7', '#ffffff'] }, // Mikronesia
  MHL: { type: 'diagonal-stripe', colors: ['#1d4ed8', '#ea580c', '#ffffff'] }, // Marshall
  NRU: { type: 'horizontal-tricolor', colors: ['#1d4ed8', '#eab308', '#1d4ed8'] }, // Nauru
  PLW: { type: 'circle-disc', colors: ['#0284c7', '#eab308'] }, // Palau
  TUV: { type: 'canton-stripes', colors: ['#0284c7', '#eab308'] }, // Tuvalu
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
  // Fallback to authentic sovereign primary color rather than arbitrary blue
  const sovereignColor = getCountryFlagColor(code, true);
  return {
    type: 'solid-emblem',
    colors: [sovereignColor, '#ffffff']
  };
}

/**
 * Compute bounding coordinates of a GeoJSON feature (minLon, maxLon, minLat, maxLat),
 * filtering out far overseas territories (e.g. French Guiana vs Metropolitan France)
 * based on main centroid location.
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
      // Filter out overseas territories > 20 degrees away from main label centroid (e.g. French Guiana vs France)
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
  // Fallback to label coords if bounds not found
  if (minLon > maxLon) {
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
 * national flag patterns (e.g. France Blue-White-Red, Portugal Green-Red, Brunei Royal Gold).
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
  else if (pattern.type === 'diagonal-stripe') patternTypeId = 10;

  const c1 = new THREE.Color(pattern.colors[0] || '#eab308');
  const c2 = new THREE.Color(pattern.colors[1] || '#ffffff');
  const c3 = new THREE.Color(pattern.colors[2] || '#18181b');

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
        // Precision spherical coordinate extraction matching globe.gl polar2Cartesian
        float theta = atan(vPos.x, vPos.z) * 57.29577951308232;
        float lon = 90.0 - theta;
        if (lon > 180.0) lon -= 360.0;
        if (lon < -180.0) lon += 360.0;

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
          // Horizontal tricolor (Germany: Black, Red, Gold; Netherlands; Russia; Austria; Egypt)
          if (v >= 0.6666) col = c1;
          else if (v >= 0.3333) col = c2;
          else col = c3;
        } else if (patternType == 4) {
          // Circle disc (Japan: White + Red disc; Bangladesh: Green + Red disc; Turkey; Tunisia)
          float dist = distance(vec2(u, v), vec2(0.5, 0.5));
          if (dist < 0.26) col = c2;
          else col = c1;
        } else if (patternType == 5) {
          // Nordic cross (Sweden, Norway, Denmark, Finland, Iceland)
          if (abs(u - 0.38) < 0.07 || abs(v - 0.50) < 0.08) col = c2;
          else col = c1;
        } else if (patternType == 6) {
          // Symmetric cross (Switzerland, Georgia, England)
          if ((abs(u - 0.5) < 0.08 && abs(v - 0.5) < 0.28) || (abs(v - 0.5) < 0.08 && abs(u - 0.5) < 0.28)) col = c2;
          else col = c1;
        } else if (patternType == 7) {
          // Canton & stripes (USA, Malaysia, Taiwan, Greece, Liberia)
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
          // Vertical bicolor (Portugal: Green West, Red East; Algeria; Pakistan; Qatar)
          if (u < 0.40) col = c1;
          else col = c2;
        } else if (patternType == 10) {
          // Diagonal stripe (Brunei Darussalam, Congo, Tanzania, Trinidad, PNG, Solomon)
          float diag = (u + (1.0 - v)) * 0.5;
          float distCenter = distance(vec2(u, v), vec2(0.5, 0.5));
          if (distCenter < 0.15) {
            col = vec3(0.863, 0.149, 0.149); // Red emblem / crest
          } else if (abs(diag - 0.50) < 0.13) {
            if (diag < 0.50) col = c2; // White diagonal
            else col = c3; // Black diagonal
          } else {
            col = c1; // Royal Gold background
          }
        }

        gl_FragColor = vec4(col, 0.94);
      }
    `,
    side: THREE.DoubleSide,
  });

  proceduralMaterialsCache.set(key, mat);
  return mat;
}
