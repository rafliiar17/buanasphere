import type { SupportedLocale } from './types';
import { localeState } from './state.svelte';

export const ISO3_TO_ISO2: Record<string, string> = {
  // Asia
  IDN: 'ID', SGP: 'SG', MYS: 'MY', THA: 'TH', PHL: 'PH', VNM: 'VN', JPN: 'JP', CHN: 'CN',
  HKG: 'HK', KOR: 'KR', TWN: 'TW', IND: 'IN', PAK: 'PK', BGD: 'BD', LKA: 'LK', NPL: 'NP',
  MMR: 'MM', KHM: 'KH', LAO: 'LA', BRN: 'BN', TLS: 'TL', MNG: 'MN', KAZ: 'KZ', UZB: 'UZ',
  KGZ: 'KG', TJK: 'TJ', TKM: 'TM', GEO: 'GE', ARM: 'AM', AZE: 'AZ', MDV: 'MV', BTN: 'BT',
  AFG: 'AF', MAC: 'MO', PRK: 'KP',
  // Middle East
  SAU: 'SA', ARE: 'AE', QAT: 'QA', KWT: 'KW', BHR: 'BH', OMN: 'OM', JOR: 'JO', LBN: 'LB',
  IRQ: 'IQ', ISR: 'IL', TUR: 'TR', IRN: 'IR', YEM: 'YE', SYR: 'SY', PSE: 'PS',
  // Europe
  DEU: 'DE', FRA: 'FR', ITA: 'IT', ESP: 'ES', NLD: 'NL', BEL: 'BE', AUT: 'AT', PRT: 'PT',
  GRC: 'GR', FIN: 'FI', IRL: 'IE', SVK: 'SK', SVN: 'SI', EST: 'EE', LVA: 'LV', LTU: 'LT',
  CYP: 'CY', MLT: 'MT', LUX: 'LU', HRV: 'HR', GBR: 'GB', CHE: 'CH', NOR: 'NO', SWE: 'SE',
  DNK: 'DK', POL: 'PL', CZE: 'CZ', HUN: 'HU', ROU: 'RO', BGR: 'BG', SRB: 'RS', ALB: 'AL',
  BIH: 'BA', MKD: 'MK', ISL: 'IS', UKR: 'UA', BLR: 'BY', RUS: 'RU', MDA: 'MD', MNE: 'ME',
  AND: 'AD', MCO: 'MC', SMR: 'SM', LIE: 'LI', VAT: 'VA', XKX: 'XK',
  // Americas
  USA: 'US', CAN: 'CA', MEX: 'MX', BRA: 'BR', ARG: 'AR', CHL: 'CL', COL: 'CO', PER: 'PE',
  VEN: 'VE', ECU: 'EC', URY: 'UY', PRY: 'PY', BOL: 'BO', CRI: 'CR', PAN: 'PA', GTM: 'GT',
  HND: 'HN', NIC: 'NI', SLV: 'SV', DOM: 'DO', JAM: 'JM', TTO: 'TT', CUB: 'CU', BHS: 'BS',
  BRB: 'BB', BLZ: 'BZ', GUY: 'GY', SUR: 'SR', HTI: 'HT', PRI: 'PR', ATG: 'AG', DMA: 'DM',
  GRD: 'GD', KNA: 'KN', LCA: 'LC', VCT: 'VC',
  // Oceania
  AUS: 'AU', NZL: 'NZ', PNG: 'PG', FJI: 'FJ', SLB: 'SB', VUT: 'VU', WSM: 'WS', TON: 'TO',
  KIR: 'KI', FSM: 'FM', MHL: 'MH', NRU: 'NR', PLW: 'PW', TUV: 'TV', NCL: 'NC', PYF: 'PF',
  // Africa
  ZAF: 'ZA', EGY: 'EG', NGA: 'NG', KEN: 'KE', MAR: 'MA', DZA: 'DZ', TUN: 'TN', ETH: 'ET',
  TZA: 'TZ', UGA: 'UG', GHA: 'GH', CIV: 'CI', SEN: 'SN', CMR: 'CM', AGO: 'AO', MOZ: 'MZ',
  ZWE: 'ZW', ZMB: 'ZM', BWA: 'BW', NAM: 'NA', MUS: 'MU', MDG: 'MG', RWA: 'RW', BDI: 'BI',
  SDN: 'SD', SSD: 'SS', LBY: 'LY', SOM: 'SO', DJI: 'DJ', ERI: 'ER', GAB: 'GA', COG: 'CG',
  COD: 'CD', GNQ: 'GQ', STP: 'ST', TCD: 'TD', NER: 'NE', MLI: 'ML', BFA: 'BF', MRT: 'MR',
  GIN: 'GN', GNB: 'GW', SLE: 'SL', LBR: 'LR', TGO: 'TG', BEN: 'BJ', CPV: 'CV', COM: 'KM',
  SYC: 'SC', LSO: 'LS', SWZ: 'SZ', MWI: 'MW',
};

// Cache of Intl.DisplayNames instances
const regionDisplayNames: Record<SupportedLocale, Intl.DisplayNames | null> = {
  id: typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['id-ID', 'id'], { type: 'region' }) : null,
  en: typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en-US', 'en'], { type: 'region' }) : null,
};

const currencyDisplayNames: Record<SupportedLocale, Intl.DisplayNames | null> = {
  id: typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['id-ID', 'id'], { type: 'currency' }) : null,
  en: typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en-US', 'en'], { type: 'currency' }) : null,
};

/**
 * Resolve localized Country Name dynamically
 */
export function getLocalizedCountryName(iso3: string, fallbackName?: string, targetLocale?: SupportedLocale): string {
  const activeLocale = targetLocale || localeState.current;
  const iso2 = ISO3_TO_ISO2[iso3?.toUpperCase()] || iso3?.slice(0, 2).toUpperCase();

  if (iso2) {
    try {
      const displayer = regionDisplayNames[activeLocale];
      const resolved = displayer?.of(iso2);
      if (resolved) return resolved;
    } catch {
      // ignore
    }
  }

  return fallbackName || iso3;
}

/**
 * Resolve localized Currency Name dynamically
 */
export function getLocalizedCurrencyName(currencyCode: string, fallbackName?: string, targetLocale?: SupportedLocale): string {
  const activeLocale = targetLocale || localeState.current;
  const code = currencyCode?.toUpperCase();

  if (code) {
    try {
      const displayer = currencyDisplayNames[activeLocale];
      const resolved = displayer?.of(code);
      if (resolved) return resolved;
    } catch {
      // ignore
    }
  }

  return fallbackName || currencyCode;
}
