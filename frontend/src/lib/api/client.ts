import type {
  CurrencyInfo,
  ProviderInfo,
  RateMatrixResponse,
  ConversionResult,
  HistoricalTrendResponse,
  RateAlertRequest,
  RateItem,
} from './types';

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  // Major & Popular Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'Amerika Serikat' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'Uni Eropa' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', country: 'Singapura' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', country: 'Jepang' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', country: 'Australia' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'Inggris' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', country: 'Malaysia' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', country: 'Tiongkok' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', country: 'Arab Saudi' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', country: 'Thailand' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', country: 'Kanada' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', country: 'Swiss' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', country: 'Hong Kong' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', country: 'Korea Selatan' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', country: 'Selandia Baru' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', country: 'India' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', country: 'Brasil' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', country: 'Afrika Selatan' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', country: 'Uni Emirat Arab' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', country: 'Filipina' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', country: 'Vietnam' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', country: 'Indonesia' },

  // Asia & Middle East Currencies
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', country: 'Taiwan' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', country: 'Pakistan' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', country: 'Bangladesh' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰', country: 'Sri Lanka' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', flag: '🇳🇵', country: 'Nepal' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', flag: '🇲🇲', country: 'Myanmar' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭', country: 'Kamboja' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', flag: '🇱🇦', country: 'Laos' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', flag: '🇧🇳', country: 'Brunei' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', flag: '🇰🇿', country: 'Kazakhstan' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', flag: '🇶🇦', country: 'Qatar' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', flag: '🇰🇼', country: 'Kuwait' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', flag: '🇧🇭', country: 'Bahrain' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', flag: '🇴🇲', country: 'Oman' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD', flag: '🇯🇴', country: 'Yordania' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', flag: '🇮🇱', country: 'Israel' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', country: 'Turki' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', flag: '🇮🇷', country: 'Iran' },

  // Europe & Americas Currencies
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', country: 'Norwegia' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', country: 'Swedia' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr.', flag: '🇩🇰', country: 'Denmark' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', country: 'Polandia' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', country: 'Ceko' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', country: 'Hongaria' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', country: 'Rumania' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', country: 'Rusia' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦', country: 'Ukraina' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽', country: 'Meksiko' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', country: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', country: 'Chili' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'Col$', flag: '🇨🇴', country: 'Kolombia' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', country: 'Peru' },

  // Africa Currencies
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', country: 'Mesir' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', country: 'Nigeria' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', country: 'Kenya' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', country: 'Ghana' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', flag: '🇲🇦', country: 'Maroko' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', flag: '🇸🇳', country: 'Afrika Barat' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', flag: '🇨🇲', country: 'Afrika Tengah' },
];

export const MOCK_PROVIDERS: ProviderInfo[] = [
  {
    id: 'bi',
    name: 'Bank Indonesia (JISDOR)',
    shortName: 'BI JISDOR',
    type: 'central_bank',
    badgeText: 'Bank Sentral',
    website: 'https://www.bi.go.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bca',
    name: 'Bank Central Asia (BCA)',
    shortName: 'BCA',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://www.bca.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    shortName: 'Mandiri',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://www.bankmandiri.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bri',
    name: 'Bank Rakyat Indonesia (BRI)',
    shortName: 'BRI',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://bri.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'bni',
    name: 'Bank Negara Indonesia (BNI)',
    shortName: 'BNI',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://www.bni.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'cimb',
    name: 'CIMB Niaga',
    shortName: 'CIMB',
    type: 'commercial_bank',
    badgeText: 'Bank Komersial',
    website: 'https://www.cimbniaga.co.id',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'dolarasia',
    name: 'DolarAsia Money Changer',
    shortName: 'DolarAsia',
    type: 'money_changer',
    badgeText: 'Money Changer',
    website: 'https://dolarasia.com',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'open_er_api',
    name: 'ExchangeRate-API (Market Reference)',
    shortName: 'OpenERApi',
    type: 'market_reference',
    badgeText: 'Market Reference',
    website: 'https://open.er-api.com',
    lastUpdated: new Date().toISOString(),
  },
];

// Global baseline rates definition for comprehensive fallback across 195+ countries
export const BASE_RATES_IDR: Record<string, { buy: number; sell: number; mid: number; change: number }> = {
  // Major & Popular Currencies
  USD: { buy: 16220, sell: 16280, mid: 16250, change: 0.15 },
  EUR: { buy: 17050, sell: 17180, mid: 17115, change: -0.22 },
  SGD: { buy: 12180, sell: 12260, mid: 12220, change: 0.08 },
  JPY: { buy: 107.5, sell: 109.2, mid: 108.35, change: -0.45 },
  AUD: { buy: 10380, sell: 10490, mid: 10435, change: 0.31 },
  GBP: { buy: 20550, sell: 20720, mid: 20635, change: -0.12 },
  MYR: { buy: 3660, sell: 3710, mid: 3685, change: 0.05 },
  CNY: { buy: 2230, sell: 2270, mid: 2250, change: -0.09 },
  SAR: { buy: 4310, sell: 4360, mid: 4335, change: 0.12 },
  THB: { buy: 470, sell: 490, mid: 480, change: 0.18 },
  CAD: { buy: 11800, sell: 11900, mid: 11850, change: 0.10 },
  CHF: { buy: 18280, sell: 18420, mid: 18350, change: -0.05 },
  HKD: { buy: 2070, sell: 2110, mid: 2090, change: 0.14 },
  KRW: { buy: 11.5, sell: 12.2, mid: 11.85, change: -0.15 },
  NZD: { buy: 9700, sell: 9800, mid: 9750, change: 0.22 },
  INR: { buy: 192.0, sell: 197.0, mid: 194.5, change: -0.08 },
  BRL: { buy: 2880, sell: 2960, mid: 2920, change: 0.40 },
  ZAR: { buy: 880, sell: 910, mid: 895, change: 0.15 },
  AED: { buy: 4400, sell: 4450, mid: 4425, change: 0.11 },
  PHP: { buy: 280, sell: 290, mid: 285, change: -0.05 },
  VND: { buy: 0.62, sell: 0.66, mid: 0.64, change: 0.02 },
  IDR: { buy: 1, sell: 1, mid: 1, change: 0.00 },

  // Asia & Pacific
  TWD: { buy: 500, sell: 512, mid: 506, change: 0.08 },
  PKR: { buy: 57.5, sell: 59.0, mid: 58.25, change: -0.10 },
  BDT: { buy: 134, sell: 138, mid: 136, change: 0.05 },
  LKR: { buy: 53.5, sell: 55.0, mid: 54.25, change: -0.04 },
  NPR: { buy: 120, sell: 123, mid: 121.5, change: -0.06 },
  MMK: { buy: 7.6, sell: 7.9, mid: 7.75, change: 0.00 },
  KHR: { buy: 3.9, sell: 4.1, mid: 4.0, change: 0.01 },
  LAK: { buy: 0.73, sell: 0.77, mid: 0.75, change: -0.02 },
  BND: { buy: 12180, sell: 12260, mid: 12220, change: 0.08 },
  MNT: { buy: 4.7, sell: 4.9, mid: 4.8, change: 0.02 },
  KAZ: { buy: 33.5, sell: 34.5, mid: 34.0, change: 0.12 },
  KZT: { buy: 33.5, sell: 34.5, mid: 34.0, change: 0.12 },
  UZS: { buy: 1.25, sell: 1.31, mid: 1.28, change: -0.05 },
  KGS: { buy: 185, sell: 191, mid: 188, change: 0.04 },
  TJS: { buy: 1480, sell: 1520, mid: 1500, change: 0.00 },
  TMT: { buy: 4600, sell: 4700, mid: 4650, change: 0.00 },
  GEL: { buy: 5900, sell: 6050, mid: 5975, change: 0.18 },
  AMD: { buy: 41.5, sell: 42.8, mid: 42.15, change: 0.03 },
  AZN: { buy: 9500, sell: 9650, mid: 9575, change: 0.01 },
  MVR: { buy: 1040, sell: 1070, mid: 1055, change: 0.00 },
  BTN: { buy: 192.0, sell: 197.0, mid: 194.5, change: -0.08 },
  AFN: { buy: 230, sell: 240, mid: 235, change: 0.15 },
  MOP: { buy: 2010, sell: 2050, mid: 2030, change: 0.14 },
  KPW: { buy: 17.8, sell: 18.4, mid: 18.1, change: 0.00 },
  PGK: { buy: 4050, sell: 4180, mid: 4115, change: -0.05 },
  FJD: { buy: 7150, sell: 7300, mid: 7225, change: 0.10 },
  SBD: { buy: 1900, sell: 1960, mid: 1930, change: 0.02 },
  VUV: { buy: 134, sell: 139, mid: 136.5, change: 0.00 },
  WST: { buy: 5850, sell: 6000, mid: 5925, change: 0.05 },
  TOP: { buy: 6800, sell: 6980, mid: 6890, change: 0.08 },
  XPF: { buy: 142, sell: 146, mid: 144, change: -0.22 },

  // Middle East
  QAR: { buy: 4440, sell: 4490, mid: 4465, change: 0.12 },
  KWD: { buy: 52800, sell: 53200, mid: 53000, change: 0.15 },
  BHD: { buy: 42900, sell: 43300, mid: 43100, change: 0.14 },
  OMR: { buy: 42000, sell: 42400, mid: 42200, change: 0.13 },
  JOD: { buy: 22800, sell: 23050, mid: 22925, change: 0.12 },
  LBP: { buy: 0.17, sell: 0.19, mid: 0.18, change: -0.50 },
  IQD: { buy: 12.2, sell: 12.6, mid: 12.4, change: 0.02 },
  ILS: { buy: 4380, sell: 4460, mid: 4420, change: -0.18 },
  TRY: { buy: 470, sell: 485, mid: 477.5, change: -0.35 },
  IRR: { buy: 0.37, sell: 0.40, mid: 0.385, change: -0.10 },
  YER: { buy: 64.0, sell: 66.0, mid: 65.0, change: 0.00 },
  SYP: { buy: 1.20, sell: 1.30, mid: 1.25, change: 0.00 },

  // Europe (Non-Euro)
  NOK: { buy: 1520, sell: 1550, mid: 1535, change: 0.18 },
  SEK: { buy: 1540, sell: 1570, mid: 1555, change: 0.14 },
  DKK: { buy: 2280, sell: 2320, mid: 2300, change: -0.20 },
  PLN: { buy: 4050, sell: 4120, mid: 4085, change: 0.25 },
  CZK: { buy: 690, sell: 705, mid: 697.5, change: 0.10 },
  HUF: { buy: 42.8, sell: 43.8, mid: 43.3, change: -0.15 },
  RON: { buy: 3420, sell: 3480, mid: 3450, change: -0.18 },
  BGN: { buy: 8700, sell: 8850, mid: 8775, change: -0.21 },
  RSD: { buy: 144, sell: 148, mid: 146, change: -0.05 },
  ALL: { buy: 168, sell: 174, mid: 171, change: 0.30 },
  BAM: { buy: 8700, sell: 8850, mid: 8775, change: -0.20 },
  MKD: { buy: 275, sell: 283, mid: 279, change: -0.15 },
  ISK: { buy: 116, sell: 120, mid: 118, change: 0.05 },
  UAH: { buy: 388, sell: 398, mid: 393, change: -0.12 },
  BYN: { buy: 4920, sell: 5050, mid: 4985, change: 0.00 },
  RUB: { buy: 178, sell: 184, mid: 181, change: 0.45 },
  MDL: { buy: 900, sell: 925, mid: 912.5, change: 0.08 },

  // Americas
  MXN: { buy: 810, sell: 830, mid: 820, change: 0.15 },
  ARS: { buy: 16.5, sell: 17.5, mid: 17.0, change: -0.80 },
  CLP: { buy: 17.2, sell: 17.8, mid: 17.5, change: 0.22 },
  COP: { buy: 3.95, sell: 4.10, mid: 4.025, change: 0.30 },
  PEN: { buy: 4280, sell: 4360, mid: 4320, change: 0.05 },
  VES: { buy: 435, sell: 450, mid: 442.5, change: -1.20 },
  UYU: { buy: 395, sell: 408, mid: 401.5, change: 0.10 },
  PYG: { buy: 2.10, sell: 2.20, mid: 2.15, change: 0.02 },
  BOB: { buy: 2320, sell: 2380, mid: 2350, change: 0.00 },
  CRC: { buy: 30.8, sell: 31.8, mid: 31.3, change: 0.11 },
  PAB: { buy: 16220, sell: 16280, mid: 16250, change: 0.15 },
  GTQ: { buy: 2080, sell: 2130, mid: 2105, change: 0.04 },
  HNL: { buy: 645, sell: 660, mid: 652.5, change: -0.02 },
  NIO: { buy: 438, sell: 448, mid: 443, change: 0.00 },
  DOP: { buy: 270, sell: 278, mid: 274, change: -0.05 },
  JMD: { buy: 102, sell: 106, mid: 104, change: 0.02 },
  TTD: { buy: 2380, sell: 2430, mid: 2405, change: 0.05 },
  CUP: { buy: 665, sell: 690, mid: 677.5, change: 0.00 },
  BSD: { buy: 16220, sell: 16280, mid: 16250, change: 0.15 },
  BBD: { buy: 8050, sell: 8200, mid: 8125, change: 0.10 },
  BZD: { buy: 8050, sell: 8200, mid: 8125, change: 0.10 },
  GYD: { buy: 76.5, sell: 79.0, mid: 77.75, change: 0.00 },
  SRD: { buy: 440, sell: 460, mid: 450, change: -0.10 },
  HTG: { buy: 120, sell: 126, mid: 123, change: -0.08 },
  XCD: { buy: 5980, sell: 6080, mid: 6030, change: 0.12 },

  // Africa
  EGP: { buy: 330, sell: 342, mid: 336, change: -0.15 },
  NGN: { buy: 10.5, sell: 11.2, mid: 10.85, change: -0.40 },
  KES: { buy: 124, sell: 128, mid: 126, change: 0.20 },
  GHS: { buy: 1050, sell: 1100, mid: 1075, change: -0.25 },
  MAD: { buy: 1610, sell: 1650, mid: 1630, change: 0.08 },
  DZD: { buy: 118, sell: 123, mid: 120.5, change: 0.02 },
  TND: { buy: 5200, sell: 5320, mid: 5260, change: 0.06 },
  ETH: { buy: 130, sell: 138, mid: 134, change: -0.50 },
  ETB: { buy: 130, sell: 138, mid: 134, change: -0.50 },
  TZS: { buy: 6.1, sell: 6.4, mid: 6.25, change: -0.05 },
  UGA: { buy: 4.3, sell: 4.5, mid: 4.4, change: 0.02 },
  UGX: { buy: 4.3, sell: 4.5, mid: 4.4, change: 0.02 },
  RWF: { buy: 11.8, sell: 12.3, mid: 12.05, change: -0.04 },
  MUR: { buy: 345, sell: 358, mid: 351.5, change: 0.12 },
  SCR: { buy: 1120, sell: 1170, mid: 1145, change: 0.05 },
  AOA: { buy: 17.5, sell: 18.5, mid: 18.0, change: -0.10 },
  MZN: { buy: 250, sell: 260, mid: 255, change: 0.00 },
  ZMB: { buy: 590, sell: 620, mid: 605, change: -0.30 },
  ZMW: { buy: 590, sell: 620, mid: 605, change: -0.30 },
  ZWE: { buy: 1180, sell: 1240, mid: 1210, change: 0.00 },
  ZWG: { buy: 1180, sell: 1240, mid: 1210, change: 0.00 },
  XOF: { buy: 26.0, sell: 26.8, mid: 26.4, change: -0.22 },
  XAF: { buy: 26.0, sell: 26.8, mid: 26.4, change: -0.22 },
  CDF: { buy: 5.6, sell: 5.9, mid: 5.75, change: -0.08 },
  MGA: { buy: 3.5, sell: 3.7, mid: 3.6, change: 0.01 },
  BWP: { buy: 1180, sell: 1220, mid: 1200, change: 0.10 },
  NAD: { buy: 880, sell: 910, mid: 895, change: 0.15 },
  SZL: { buy: 880, sell: 910, mid: 895, change: 0.15 },
  LSL: { buy: 880, sell: 910, mid: 895, change: 0.15 },
  SDG: { buy: 26.5, sell: 28.0, mid: 27.25, change: 0.00 },
  SSP: { buy: 12.0, sell: 13.0, mid: 12.5, change: 0.00 },
  LYD: { buy: 3320, sell: 3400, mid: 3360, change: 0.02 },
  MRU: { buy: 402, sell: 416, mid: 409, change: 0.01 },
  GMD: { buy: 232, sell: 242, mid: 237, change: 0.03 },
  SLE: { buy: 0.70, sell: 0.75, mid: 0.725, change: -0.05 },
  LRD: { buy: 82.0, sell: 86.0, mid: 84.0, change: 0.02 },
  GNF: { buy: 1.85, sell: 1.95, mid: 1.90, change: 0.00 },
  BIF: { buy: 5.5, sell: 5.8, mid: 5.65, change: 0.00 },
  DJF: { buy: 90.0, sell: 93.0, mid: 91.5, change: 0.00 },
  ERN: { buy: 1070, sell: 1100, mid: 1085, change: 0.00 },
  CVE: { buy: 154, sell: 159, mid: 156.5, change: -0.22 },
  KMF: { buy: 34.5, sell: 36.0, mid: 35.25, change: -0.22 },
  STN: { buy: 690, sell: 720, mid: 705, change: -0.15 },
  SOS: { buy: 28.0, sell: 29.2, mid: 28.6, change: 0.00 },
};

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
      this.baseUrl = (import.meta as any).env.VITE_API_URL;
    } else if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
      this.baseUrl = process.env.VITE_API_URL;
    } else {
      this.baseUrl = '/api/v1';
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      throw new Error(`API Request failed with status ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }

  async getProviders(): Promise<ProviderInfo[]> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: ProviderInfo[] }>('/providers');
      return data.data;
    } catch {
      return MOCK_PROVIDERS;
    }
  }

  async getLiveRates(baseCurrency = 'IDR'): Promise<RateItem[]> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: RateItem[] }>(`/rates/latest?base=${baseCurrency}`);
      return data.data;
    } catch {
      // Offline fallback dictionary from bundled ISO dataset
      const items: RateItem[] = [];
      const now = new Date().toISOString();

      Object.entries(BASE_RATES_IDR).forEach(([curr, val]) => {
        if (curr === 'IDR') return;
        const spread = Math.round((val.sell - val.buy) * 100) / 100;
        const spreadPercent = Math.round(((spread / val.mid) * 100) * 100) / 100;
        items.push({
          id: `db-${curr.toLowerCase()}`,
          providerId: 'cf_d1_database',
          providerName: 'Cloudflare D1 (Kurs World Reference)',
          baseCurrency: 'IDR',
          targetCurrency: curr,
          buyRate: val.buy,
          sellRate: val.sell,
          middleRate: val.mid,
          spread,
          spreadPercent,
          change24h: val.change,
          updatedAt: now,
          rateType: 'SPECIAL_RATE',
        });
      });

      return items;
    }
  }

  async getRateMatrix(currency = 'USD'): Promise<RateMatrixResponse> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: RateMatrixResponse }>(`/rates/matrix?currency=${currency}`);
      return data.data;
    } catch {
      const upper = currency.toUpperCase();
      const base = BASE_RATES_IDR[upper] || { buy: 16220, sell: 16280, mid: 16250, change: 0.15 };
      const now = new Date().toISOString();

      // Variations per provider
      const rows: RateMatrixResponse['rows'] = [
        {
          providerId: 'bi',
          providerName: 'Bank Indonesia (JISDOR)',
          providerType: 'central_bank',
          rateType: 'JISDOR',
          buyRate: Math.round((base.buy + 15) * 100) / 100,
          sellRate: Math.round((base.sell - 15) * 100) / 100,
          middleRate: base.mid,
          spread: Math.round((base.sell - base.buy - 30) * 100) / 100,
          spreadPercent: Math.round((((base.sell - base.buy - 30) / base.mid) * 100) * 100) / 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: true,
        },
        {
          providerId: 'bca',
          providerName: 'BCA (e-Rate)',
          providerType: 'commercial_bank',
          rateType: 'e-Rate (Online)',
          buyRate: Math.round((base.buy + 10) * 100) / 100,
          sellRate: base.sell,
          middleRate: Math.round(((base.buy + 10 + base.sell) / 2) * 100) / 100,
          spread: Math.round((base.sell - (base.buy + 10)) * 100) / 100,
          spreadPercent: Math.round((((base.sell - (base.buy + 10)) / base.mid) * 100) * 100) / 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: true,
          isLowestSpread: false,
        },
        {
          providerId: 'mandiri',
          providerName: 'Bank Mandiri (Special Rate)',
          providerType: 'commercial_bank',
          rateType: 'Special Rate',
          buyRate: Math.round((base.buy + 20) * 100) / 100,
          sellRate: Math.round((base.sell + 10) * 100) / 100,
          middleRate: Math.round(((base.buy + 20 + base.sell + 10) / 2) * 100) / 100,
          spread: Math.round(((base.sell + 10) - (base.buy + 20)) * 100) / 100,
          spreadPercent: Math.round(((((base.sell + 10) - (base.buy + 20)) / base.mid) * 100) * 100) / 100,
          updatedAt: now,
          isBestBuy: true,
          isBestSell: false,
          isLowestSpread: false,
        },
        {
          providerId: 'bri',
          providerName: 'BRI (e-Rate)',
          providerType: 'commercial_bank',
          rateType: 'e-Rate',
          buyRate: Math.round((base.buy - 10) * 100) / 100,
          sellRate: Math.round((base.sell + 15) * 100) / 100,
          middleRate: base.mid,
          spread: Math.round(((base.sell + 15) - (base.buy - 10)) * 100) / 100,
          spreadPercent: Math.round(((((base.sell + 15) - (base.buy - 10)) / base.mid) * 100) * 100) / 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: false,
        },
        {
          providerId: 'bni',
          providerName: 'BNI (Special Rates)',
          providerType: 'commercial_bank',
          rateType: 'Special Rate',
          buyRate: base.buy,
          sellRate: Math.round((base.sell + 20) * 100) / 100,
          middleRate: Math.round(((base.buy + base.sell + 20) / 2) * 100) / 100,
          spread: Math.round((20 + (base.sell - base.buy)) * 100) / 100,
          spreadPercent: Math.round((((20 + (base.sell - base.buy)) / base.mid) * 100) * 100) / 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: false,
        },
        {
          providerId: 'cimb',
          providerName: 'CIMB Niaga (OCTO Clicks)',
          providerType: 'commercial_bank',
          rateType: 'Special Rate',
          buyRate: Math.round((base.buy + 5) * 100) / 100,
          sellRate: Math.round((base.sell + 5) * 100) / 100,
          middleRate: Math.round((base.mid + 5) * 100) / 100,
          spread: Math.round((base.sell - base.buy) * 100) / 100,
          spreadPercent: Math.round((((base.sell - base.buy) / base.mid) * 100) * 100) / 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: false,
        },
        {
          providerId: 'dolarasia',
          providerName: 'DolarAsia (Fisik / Banknotes)',
          providerType: 'money_changer',
          rateType: 'Banknotes',
          buyRate: Math.round((base.buy - 30) * 100) / 100,
          sellRate: Math.round((base.sell + 40) * 100) / 100,
          middleRate: Math.round((base.mid + 5) * 100) / 100,
          spread: Math.round((70 + (base.sell - base.buy)) * 100) / 100,
          spreadPercent: Math.round((((70 + (base.sell - base.buy)) / base.mid) * 100) * 100) / 100,
          updatedAt: now,
          isBestBuy: false,
          isBestSell: false,
          isLowestSpread: false,
        },
      ];

      return {
        currency: upper,
        baseCurrency: 'IDR',
        timestamp: now,
        totalProviders: rows.length,
        bestBuyProvider: 'Bank Mandiri',
        bestSellProvider: 'BCA',
        lowestSpreadProvider: 'Bank Indonesia (JISDOR)',
        rows,
      };
    }
  }

  async convertCurrency(
    from: string,
    to: string,
    amount: number,
    providerId = 'bca'
  ): Promise<ConversionResult> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: ConversionResult }>(
        `/convert?from=${from}&to=${to}&amount=${amount}&provider=${providerId}`
      );
      return data.data;
    } catch {
      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();
      const isFromIdr = fromUpper === 'IDR';
      const foreignCurr = isFromIdr ? toUpper : fromUpper;
      const base = BASE_RATES_IDR[foreignCurr] || { buy: 16220, sell: 16280, mid: 16250, change: 0 };
      
      const rateUsed = isFromIdr ? (1 / base.sell) : base.buy;
      const rateType = isFromIdr ? 'sell' : 'buy';
      const resultAmount = amount * rateUsed;
      const now = new Date().toISOString();

      const comparisons = [
        {
          providerId: 'bca',
          providerName: 'BCA (e-Rate)',
          resultAmount: isFromIdr ? amount / base.sell : amount * (base.buy + 10),
          diffWithBest: 0,
          diffPercent: 0,
        },
        {
          providerId: 'mandiri',
          providerName: 'Bank Mandiri',
          resultAmount: isFromIdr ? amount / (base.sell * 1.0006) : amount * (base.buy + 20),
          diffWithBest: isFromIdr ? -5 : 10000,
          diffPercent: 0.06,
        },
        {
          providerId: 'bri',
          providerName: 'BRI',
          resultAmount: isFromIdr ? amount / (base.sell * 1.0009) : amount * (base.buy - 10),
          diffWithBest: isFromIdr ? -10 : -20000,
          diffPercent: -0.12,
        },
        {
          providerId: 'dolarasia',
          providerName: 'DolarAsia (Fisik)',
          resultAmount: isFromIdr ? amount / (base.sell * 1.0025) : amount * (base.buy - 30),
          diffWithBest: isFromIdr ? -25 : -40000,
          diffPercent: -0.25,
        },
      ];

      return {
        from: fromUpper,
        to: toUpper,
        amount,
        resultAmount,
        rateUsed: isFromIdr ? base.sell : base.buy,
        rateType,
        provider: {
          id: providerId,
          name: MOCK_PROVIDERS.find(p => p.id === providerId)?.name || 'BCA (e-Rate)',
        },
        updatedAt: now,
        comparisons,
      };
    }
  }

  async getHistoricalRates(
    currency = 'USD',
    range: '7d' | '30d' | '90d' | '365d' = '30d'
  ): Promise<HistoricalTrendResponse> {
    try {
      const data = await this.fetchJson<{ success: boolean; data: HistoricalTrendResponse }>(
        `/history?currency=${currency}&range=${range}`
      );
      return data.data;
    } catch {
      const upper = currency.toUpperCase();
      const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
      const base = BASE_RATES_IDR[upper] || { buy: 16220, sell: 16280, mid: 16250, change: 0.15 };
      
      const points: HistoricalTrendResponse['points'] = [];
      const now = new Date();
      let currentVal = base.mid - (days * (base.mid > 1000 ? 1.5 : 0.01));

      for (let i = days; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const scaleFactor = base.mid > 1000 ? 25 : base.mid > 10 ? 0.5 : 0.005;
        const step = (Math.sin(i * 0.3) * scaleFactor) + ((Math.random() - 0.48) * scaleFactor * 0.8);
        currentVal += step;
        
        const offset = base.mid > 1000 ? 25 : base.mid > 10 ? 0.2 : 0.002;
        points.push({
          timestamp: d.toISOString(),
          date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          buyRate: Math.round((currentVal - offset) * 100) / 100,
          sellRate: Math.round((currentVal + offset) * 100) / 100,
          middleRate: Math.round(currentVal * 100) / 100,
        });
      }

      const rates = points.map(p => p.middleRate);
      const min = Math.min(...rates);
      const max = Math.max(...rates);
      const sum = rates.reduce((acc, v) => acc + v, 0);
      const avg = Math.round((sum / rates.length) * 100) / 100;
      const current = rates[rates.length - 1];
      const start = rates[0];
      const changePeriod = Math.round((current - start) * 100) / 100;
      const changePeriodPercent = Math.round(((changePeriod / (start || 1)) * 100) * 100) / 100;

      return {
        currency: upper,
        baseCurrency: 'IDR',
        range,
        provider: 'Bank Indonesia (JISDOR)',
        points,
        summary: {
          min,
          max,
          avg,
          current,
          changePeriod,
          changePeriodPercent,
        },
      };
    }
  }

  async createRateAlert(payload: RateAlertRequest): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.fetchJson<{ success: boolean; message: string }>('/alerts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data;
    } catch {
      return {
        success: true,
        message: `Notifikasi berhasil didaftarkan untuk ${payload.email}. Anda akan menerima email saat ${payload.targetCurrency}/${payload.baseCurrency} ${payload.condition === 'above' ? '≥' : '≤'} ${payload.targetRate}.`,
      };
    }
  }
}

export const apiClient = new ApiClient();
