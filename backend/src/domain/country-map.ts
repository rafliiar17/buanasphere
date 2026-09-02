/**
 * Domain entity and mapping definitions for ISO-3 Countries and Global Currencies.
 * Aligned with CONTEXT.md and AGENTS.md.
 * Covers 195+ UN Member States and Global Territories.
 */

export type Region = 'Americas' | 'Europe' | 'Asia' | 'Oceania' | 'Africa' | 'Middle East';

export interface CountryCurrencyEntry {
  iso3: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  flagEmoji: string;
  region: Region;
}

export interface ChoroplethData {
  locations: string[];
  z: number[];
  text: string[];
  customdata: string[];
}

export const COUNTRY_CURRENCY_LIST: readonly CountryCurrencyEntry[] = [
  // ==========================================
  // ASIA (35 countries & territories)
  // ==========================================
  { iso3: 'IDN', countryName: 'Indonesia', currencyCode: 'IDR', currencyName: 'Indonesian Rupiah', flagEmoji: '🇮🇩', region: 'Asia' },
  { iso3: 'SGP', countryName: 'Singapura', currencyCode: 'SGD', currencyName: 'Singapore Dollar', flagEmoji: '🇸🇬', region: 'Asia' },
  { iso3: 'MYS', countryName: 'Malaysia', currencyCode: 'MYR', currencyName: 'Malaysian Ringgit', flagEmoji: '🇲🇾', region: 'Asia' },
  { iso3: 'THA', countryName: 'Thailand', currencyCode: 'THB', currencyName: 'Thai Baht', flagEmoji: '🇹🇭', region: 'Asia' },
  { iso3: 'PHL', countryName: 'Filipina', currencyCode: 'PHP', currencyName: 'Philippine Peso', flagEmoji: '🇵🇭', region: 'Asia' },
  { iso3: 'VNM', countryName: 'Vietnam', currencyCode: 'VND', currencyName: 'Vietnamese Dong', flagEmoji: '🇻🇳', region: 'Asia' },
  { iso3: 'JPN', countryName: 'Jepang', currencyCode: 'JPY', currencyName: 'Japanese Yen', flagEmoji: '🇯🇵', region: 'Asia' },
  { iso3: 'CHN', countryName: 'Tiongkok', currencyCode: 'CNY', currencyName: 'Chinese Yuan', flagEmoji: '🇨🇳', region: 'Asia' },
  { iso3: 'HKG', countryName: 'Hong Kong', currencyCode: 'HKD', currencyName: 'Hong Kong Dollar', flagEmoji: '🇭🇰', region: 'Asia' },
  { iso3: 'KOR', countryName: 'Korea Selatan', currencyCode: 'KRW', currencyName: 'South Korean Won', flagEmoji: '🇰🇷', region: 'Asia' },
  { iso3: 'TWN', countryName: 'Taiwan', currencyCode: 'TWD', currencyName: 'New Taiwan Dollar', flagEmoji: '🇹🇼', region: 'Asia' },
  { iso3: 'IND', countryName: 'India', currencyCode: 'INR', currencyName: 'Indian Rupee', flagEmoji: '🇮🇳', region: 'Asia' },
  { iso3: 'PAK', countryName: 'Pakistan', currencyCode: 'PKR', currencyName: 'Pakistani Rupee', flagEmoji: '🇵🇰', region: 'Asia' },
  { iso3: 'BGD', countryName: 'Bangladesh', currencyCode: 'BDT', currencyName: 'Bangladeshi Taka', flagEmoji: '🇧🇩', region: 'Asia' },
  { iso3: 'LKA', countryName: 'Sri Lanka', currencyCode: 'LKR', currencyName: 'Sri Lankan Rupee', flagEmoji: '🇱🇰', region: 'Asia' },
  { iso3: 'NPL', countryName: 'Nepal', currencyCode: 'NPR', currencyName: 'Nepalese Rupee', flagEmoji: '🇳🇵', region: 'Asia' },
  { iso3: 'MMR', countryName: 'Myanmar', currencyCode: 'MMK', currencyName: 'Myanmar Kyat', flagEmoji: '🇲🇲', region: 'Asia' },
  { iso3: 'KHM', countryName: 'Kamboja', currencyCode: 'KHR', currencyName: 'Cambodian Riel', flagEmoji: '🇰🇭', region: 'Asia' },
  { iso3: 'LAO', countryName: 'Laos', currencyCode: 'LAK', currencyName: 'Lao Kip', flagEmoji: '🇱🇦', region: 'Asia' },
  { iso3: 'BRN', countryName: 'Brunei Darussalam', currencyCode: 'BND', currencyName: 'Brunei Dollar', flagEmoji: '🇧🇳', region: 'Asia' },
  { iso3: 'TLS', countryName: 'Timor Leste', currencyCode: 'USD', currencyName: 'US Dollar', flagEmoji: '🇹🇱', region: 'Asia' },
  { iso3: 'MNG', countryName: 'Mongolia', currencyCode: 'MNT', currencyName: 'Mongolian Tugrik', flagEmoji: '🇲🇳', region: 'Asia' },
  { iso3: 'KAZ', countryName: 'Kazakhstan', currencyCode: 'KZT', currencyName: 'Kazakhstani Tenge', flagEmoji: '🇰🇿', region: 'Asia' },
  { iso3: 'UZB', countryName: 'Uzbekistan', currencyCode: 'UZS', currencyName: 'Uzbekistani Som', flagEmoji: '🇺🇿', region: 'Asia' },
  { iso3: 'KGZ', countryName: 'Kirgizstan', currencyCode: 'KGS', currencyName: 'Kyrgyzstani Som', flagEmoji: '🇰🇬', region: 'Asia' },
  { iso3: 'TJK', countryName: 'Tajikistan', currencyCode: 'TJS', currencyName: 'Tajikistani Somoni', flagEmoji: '🇹🇯', region: 'Asia' },
  { iso3: 'TKM', countryName: 'Turkmenistan', currencyCode: 'TMT', currencyName: 'Turkmenistani Manat', flagEmoji: '🇹🇲', region: 'Asia' },
  { iso3: 'GEO', countryName: 'Georgia', currencyCode: 'GEL', currencyName: 'Georgian Lari', flagEmoji: '🇬🇪', region: 'Asia' },
  { iso3: 'ARM', countryName: 'Armenia', currencyCode: 'AMD', currencyName: 'Armenian Dram', flagEmoji: '🇦🇲', region: 'Asia' },
  { iso3: 'AZE', countryName: 'Azerbaijan', currencyCode: 'AZN', currencyName: 'Azerbaijani Manat', flagEmoji: '🇦🇿', region: 'Asia' },
  { iso3: 'MDV', countryName: 'Maladewa', currencyCode: 'MVR', currencyName: 'Maldivian Rufiyaa', flagEmoji: '🇲🇻', region: 'Asia' },
  { iso3: 'BTN', countryName: 'Bhutan', currencyCode: 'BTN', currencyName: 'Bhutanese Ngultrum', flagEmoji: '🇧🇹', region: 'Asia' },
  { iso3: 'AFG', countryName: 'Afghanistan', currencyCode: 'AFN', currencyName: 'Afghan Afghani', flagEmoji: '🇦🇫', region: 'Asia' },
  { iso3: 'MAC', countryName: 'Makau', currencyCode: 'MOP', currencyName: 'Macanese Pataca', flagEmoji: '🇲🇴', region: 'Asia' },
  { iso3: 'PRK', countryName: 'Korea Utara', currencyCode: 'KPW', currencyName: 'North Korean Won', flagEmoji: '🇰🇵', region: 'Asia' },

  // ==========================================
  // MIDDLE EAST (15 countries & territories)
  // ==========================================
  { iso3: 'SAU', countryName: 'Arab Saudi', currencyCode: 'SAR', currencyName: 'Saudi Riyal', flagEmoji: '🇸🇦', region: 'Middle East' },
  { iso3: 'ARE', countryName: 'Uni Emirat Arab', currencyCode: 'AED', currencyName: 'UAE Dirham', flagEmoji: '🇦🇪', region: 'Middle East' },
  { iso3: 'QAT', countryName: 'Qatar', currencyCode: 'QAR', currencyName: 'Qatari Riyal', flagEmoji: '🇶🇦', region: 'Middle East' },
  { iso3: 'KWT', countryName: 'Kuwait', currencyCode: 'KWD', currencyName: 'Kuwaiti Dinar', flagEmoji: '🇰🇼', region: 'Middle East' },
  { iso3: 'BHR', countryName: 'Bahrain', currencyCode: 'BHD', currencyName: 'Bahraini Dinar', flagEmoji: '🇧🇭', region: 'Middle East' },
  { iso3: 'OMN', countryName: 'Oman', currencyCode: 'OMR', currencyName: 'Omani Rial', flagEmoji: '🇴🇲', region: 'Middle East' },
  { iso3: 'JOR', countryName: 'Yordania', currencyCode: 'JOD', currencyName: 'Jordanian Dinar', flagEmoji: '🇯🇴', region: 'Middle East' },
  { iso3: 'LBN', countryName: 'Lebanon', currencyCode: 'LBP', currencyName: 'Lebanese Pound', flagEmoji: '🇱🇧', region: 'Middle East' },
  { iso3: 'IRQ', countryName: 'Irak', currencyCode: 'IQD', currencyName: 'Iraqi Dinar', flagEmoji: '🇮🇶', region: 'Middle East' },
  { iso3: 'ISR', countryName: 'Israel', currencyCode: 'ILS', currencyName: 'Israeli New Shekel', flagEmoji: '🇮🇱', region: 'Middle East' },
  { iso3: 'TUR', countryName: 'Turki', currencyCode: 'TRY', currencyName: 'Turkish Lira', flagEmoji: '🇹🇷', region: 'Middle East' },
  { iso3: 'IRN', countryName: 'Iran', currencyCode: 'IRR', currencyName: 'Iranian Rial', flagEmoji: '🇮🇷', region: 'Middle East' },
  { iso3: 'YEM', countryName: 'Yaman', currencyCode: 'YER', currencyName: 'Yemeni Rial', flagEmoji: '🇾🇪', region: 'Middle East' },
  { iso3: 'SYR', countryName: 'Suriah', currencyCode: 'SYP', currencyName: 'Syrian Pound', flagEmoji: '🇸🇾', region: 'Middle East' },
  { iso3: 'PSE', countryName: 'Palestina', currencyCode: 'ILS', currencyName: 'Israeli New Shekel', flagEmoji: '🇵🇸', region: 'Middle East' },

  // ==========================================
  // EUROPE (46 countries & territories)
  // ==========================================
  { iso3: 'DEU', countryName: 'Jerman', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇩🇪', region: 'Europe' },
  { iso3: 'FRA', countryName: 'Prancis', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇫🇷', region: 'Europe' },
  { iso3: 'ITA', countryName: 'Italia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇮🇹', region: 'Europe' },
  { iso3: 'ESP', countryName: 'Spanyol', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇪🇸', region: 'Europe' },
  { iso3: 'NLD', countryName: 'Belanda', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇳🇱', region: 'Europe' },
  { iso3: 'BEL', countryName: 'Belgia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇧🇪', region: 'Europe' },
  { iso3: 'AUT', countryName: 'Austria', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇦🇹', region: 'Europe' },
  { iso3: 'PRT', countryName: 'Portugal', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇵🇹', region: 'Europe' },
  { iso3: 'GRC', countryName: 'Yunani', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇬🇷', region: 'Europe' },
  { iso3: 'FIN', countryName: 'Finlandia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇫🇮', region: 'Europe' },
  { iso3: 'IRL', countryName: 'Irlandia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇮🇪', region: 'Europe' },
  { iso3: 'SVK', countryName: 'Slowakia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇸🇰', region: 'Europe' },
  { iso3: 'SVN', countryName: 'Slovenia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇸🇮', region: 'Europe' },
  { iso3: 'EST', countryName: 'Estonia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇪🇪', region: 'Europe' },
  { iso3: 'LVA', countryName: 'Latvia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇱🇻', region: 'Europe' },
  { iso3: 'LTU', countryName: 'Lituania', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇱🇹', region: 'Europe' },
  { iso3: 'CYP', countryName: 'Siprus', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇨🇾', region: 'Europe' },
  { iso3: 'MLT', countryName: 'Malta', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇲🇹', region: 'Europe' },
  { iso3: 'LUX', countryName: 'Luksemburg', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇱🇺', region: 'Europe' },
  { iso3: 'HRV', countryName: 'Kroasia', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇭🇷', region: 'Europe' },
  { iso3: 'GBR', countryName: 'Inggris', currencyCode: 'GBP', currencyName: 'British Pound', flagEmoji: '🇬🇧', region: 'Europe' },
  { iso3: 'CHE', countryName: 'Swiss', currencyCode: 'CHF', currencyName: 'Swiss Franc', flagEmoji: '🇨🇭', region: 'Europe' },
  { iso3: 'NOR', countryName: 'Norwegia', currencyCode: 'NOK', currencyName: 'Norwegian Krone', flagEmoji: '🇳🇴', region: 'Europe' },
  { iso3: 'SWE', countryName: 'Swedia', currencyCode: 'SEK', currencyName: 'Swedish Krona', flagEmoji: '🇸🇪', region: 'Europe' },
  { iso3: 'DNK', countryName: 'Denmark', currencyCode: 'DKK', currencyName: 'Danish Krone', flagEmoji: '🇩🇰', region: 'Europe' },
  { iso3: 'POL', countryName: 'Polandia', currencyCode: 'PLN', currencyName: 'Polish Zloty', flagEmoji: '🇵🇱', region: 'Europe' },
  { iso3: 'CZE', countryName: 'Ceko', currencyCode: 'CZK', currencyName: 'Czech Koruna', flagEmoji: '🇨🇿', region: 'Europe' },
  { iso3: 'HUN', countryName: 'Hongaria', currencyCode: 'HUF', currencyName: 'Hungarian Forint', flagEmoji: '🇭🇺', region: 'Europe' },
  { iso3: 'ROU', countryName: 'Rumania', currencyCode: 'RON', currencyName: 'Romanian Leu', flagEmoji: '🇷🇴', region: 'Europe' },
  { iso3: 'BGR', countryName: 'Bulgaria', currencyCode: 'BGN', currencyName: 'Bulgarian Lev', flagEmoji: '🇧🇬', region: 'Europe' },
  { iso3: 'SRB', countryName: 'Serbia', currencyCode: 'RSD', currencyName: 'Serbian Dinar', flagEmoji: '🇷🇸', region: 'Europe' },
  { iso3: 'ALB', countryName: 'Albania', currencyCode: 'ALL', currencyName: 'Albanian Lek', flagEmoji: '🇦🇱', region: 'Europe' },
  { iso3: 'BIH', countryName: 'Bosnia dan Herzegovina', currencyCode: 'BAM', currencyName: 'Bosnia-Herzegovina Convertible Mark', flagEmoji: '🇧🇦', region: 'Europe' },
  { iso3: 'MKD', countryName: 'Makedonia Utara', currencyCode: 'MKD', currencyName: 'Macedonian Denar', flagEmoji: '🇲🇰', region: 'Europe' },
  { iso3: 'ISL', countryName: 'Islandia', currencyCode: 'ISK', currencyName: 'Icelandic Krona', flagEmoji: '🇮🇸', region: 'Europe' },
  { iso3: 'UKR', countryName: 'Ukraina', currencyCode: 'UAH', currencyName: 'Ukrainian Hryvnia', flagEmoji: '🇺🇦', region: 'Europe' },
  { iso3: 'BLR', countryName: 'Belarus', currencyCode: 'BYN', currencyName: 'Belarusian Ruble', flagEmoji: '🇧🇾', region: 'Europe' },
  { iso3: 'RUS', countryName: 'Rusia', currencyCode: 'RUB', currencyName: 'Russian Ruble', flagEmoji: '🇷🇺', region: 'Europe' },
  { iso3: 'MDA', countryName: 'Moldova', currencyCode: 'MDL', currencyName: 'Moldovan Leu', flagEmoji: '🇲🇩', region: 'Europe' },
  { iso3: 'MNE', countryName: 'Montenegro', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇲🇪', region: 'Europe' },
  { iso3: 'AND', countryName: 'Andorra', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇦🇩', region: 'Europe' },
  { iso3: 'MCO', countryName: 'Monako', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇲🇨', region: 'Europe' },
  { iso3: 'SMR', countryName: 'San Marino', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇸🇲', region: 'Europe' },
  { iso3: 'LIE', countryName: 'Liechtenstein', currencyCode: 'CHF', currencyName: 'Swiss Franc', flagEmoji: '🇱🇮', region: 'Europe' },
  { iso3: 'VAT', countryName: 'Vatikan', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇻🇦', region: 'Europe' },
  { iso3: 'XKX', countryName: 'Kosovo', currencyCode: 'EUR', currencyName: 'Euro', flagEmoji: '🇽🇰', region: 'Europe' },

  // ==========================================
  // AMERICAS (35 countries & territories)
  // ==========================================
  { iso3: 'USA', countryName: 'Amerika Serikat', currencyCode: 'USD', currencyName: 'US Dollar', flagEmoji: '🇺🇸', region: 'Americas' },
  { iso3: 'CAN', countryName: 'Kanada', currencyCode: 'CAD', currencyName: 'Canadian Dollar', flagEmoji: '🇨🇦', region: 'Americas' },
  { iso3: 'MEX', countryName: 'Meksiko', currencyCode: 'MXN', currencyName: 'Mexican Peso', flagEmoji: '🇲🇽', region: 'Americas' },
  { iso3: 'BRA', countryName: 'Brasil', currencyCode: 'BRL', currencyName: 'Brazilian Real', flagEmoji: '🇧🇷', region: 'Americas' },
  { iso3: 'ARG', countryName: 'Argentina', currencyCode: 'ARS', currencyName: 'Argentine Peso', flagEmoji: '🇦🇷', region: 'Americas' },
  { iso3: 'CHL', countryName: 'Chili', currencyCode: 'CLP', currencyName: 'Chilean Peso', flagEmoji: '🇨🇱', region: 'Americas' },
  { iso3: 'COL', countryName: 'Kolombia', currencyCode: 'COP', currencyName: 'Colombian Peso', flagEmoji: '🇨🇴', region: 'Americas' },
  { iso3: 'PER', countryName: 'Peru', currencyCode: 'PEN', currencyName: 'Peruvian Sol', flagEmoji: '🇵🇪', region: 'Americas' },
  { iso3: 'VEN', countryName: 'Venezuela', currencyCode: 'VES', currencyName: 'Venezuelan Bolivar', flagEmoji: '🇻🇪', region: 'Americas' },
  { iso3: 'ECU', countryName: 'Ekuador', currencyCode: 'USD', currencyName: 'US Dollar', flagEmoji: '🇪🇨', region: 'Americas' },
  { iso3: 'URY', countryName: 'Uruguay', currencyCode: 'UYU', currencyName: 'Uruguayan Peso', flagEmoji: '🇺🇾', region: 'Americas' },
  { iso3: 'PRY', countryName: 'Paraguay', currencyCode: 'PYG', currencyName: 'Paraguayan Guarani', flagEmoji: '🇵🇾', region: 'Americas' },
  { iso3: 'BOL', countryName: 'Bolivia', currencyCode: 'BOB', currencyName: 'Bolivian Boliviano', flagEmoji: '🇧🇴', region: 'Americas' },
  { iso3: 'CRI', countryName: 'Kosta Rika', currencyCode: 'CRC', currencyName: 'Costa Rican Colon', flagEmoji: '🇨🇷', region: 'Americas' },
  { iso3: 'PAN', countryName: 'Panama', currencyCode: 'PAB', currencyName: 'Panamanian Balboa', flagEmoji: '🇵🇦', region: 'Americas' },
  { iso3: 'GTM', countryName: 'Guatemala', currencyCode: 'GTQ', currencyName: 'Guatemalan Quetzal', flagEmoji: '🇬🇹', region: 'Americas' },
  { iso3: 'HND', countryName: 'Honduras', currencyCode: 'HNL', currencyName: 'Honduran Lempira', flagEmoji: '🇭🇳', region: 'Americas' },
  { iso3: 'NIC', countryName: 'Nikaragua', currencyCode: 'NIO', currencyName: 'Nicaraguan Cordoba', flagEmoji: '🇳🇮', region: 'Americas' },
  { iso3: 'SLV', countryName: 'El Salvador', currencyCode: 'USD', currencyName: 'US Dollar', flagEmoji: '🇸🇻', region: 'Americas' },
  { iso3: 'DOM', countryName: 'Republik Dominika', currencyCode: 'DOP', currencyName: 'Dominican Peso', flagEmoji: '🇩🇴', region: 'Americas' },
  { iso3: 'JAM', countryName: 'Jamaika', currencyCode: 'JMD', currencyName: 'Jamaican Dollar', flagEmoji: '🇯🇲', region: 'Americas' },
  { iso3: 'TTO', countryName: 'Trinidad dan Tobago', currencyCode: 'TTD', currencyName: 'Trinidad and Tobago Dollar', flagEmoji: '🇹🇹', region: 'Americas' },
  { iso3: 'CUB', countryName: 'Kuba', currencyCode: 'CUP', currencyName: 'Cuban Peso', flagEmoji: '🇨🇺', region: 'Americas' },
  { iso3: 'BHS', countryName: 'Bahama', currencyCode: 'BSD', currencyName: 'Bahamian Dollar', flagEmoji: '🇧🇸', region: 'Americas' },
  { iso3: 'BRB', countryName: 'Barbados', currencyCode: 'BBD', currencyName: 'Barbadian Dollar', flagEmoji: '🇧🇧', region: 'Americas' },
  { iso3: 'BLZ', countryName: 'Belize', currencyCode: 'BZD', currencyName: 'Belize Dollar', flagEmoji: '🇧🇿', region: 'Americas' },
  { iso3: 'GUY', countryName: 'Guyana', currencyCode: 'GYD', currencyName: 'Guyanese Dollar', flagEmoji: '🇬🇾', region: 'Americas' },
  { iso3: 'SUR', countryName: 'Suriname', currencyCode: 'SRD', currencyName: 'Surinamese Dollar', flagEmoji: '🇸🇷', region: 'Americas' },
  { iso3: 'HTI', countryName: 'Haiti', currencyCode: 'HTG', currencyName: 'Haitian Gourde', flagEmoji: '🇭🇹', region: 'Americas' },
  { iso3: 'PRI', countryName: 'Puerto Riko', currencyCode: 'USD', currencyName: 'US Dollar', flagEmoji: '🇵🇷', region: 'Americas' },
  { iso3: 'ATG', countryName: 'Antigua dan Barbuda', currencyCode: 'XCD', currencyName: 'East Caribbean Dollar', flagEmoji: '🇦🇬', region: 'Americas' },
  { iso3: 'DMA', countryName: 'Dominika', currencyCode: 'XCD', currencyName: 'East Caribbean Dollar', flagEmoji: '🇩🇲', region: 'Americas' },
  { iso3: 'GRD', countryName: 'Grenada', currencyCode: 'XCD', currencyName: 'East Caribbean Dollar', flagEmoji: '🇬🇩', region: 'Americas' },
  { iso3: 'KNA', countryName: 'Saint Kitts dan Nevis', currencyCode: 'XCD', currencyName: 'East Caribbean Dollar', flagEmoji: '🇰🇳', region: 'Americas' },
  { iso3: 'LCA', countryName: 'Saint Lucia', currencyCode: 'XCD', currencyName: 'East Caribbean Dollar', flagEmoji: '🇱🇨', region: 'Americas' },
  { iso3: 'VCT', countryName: 'Saint Vincent dan Grenadines', currencyCode: 'XCD', currencyName: 'East Caribbean Dollar', flagEmoji: '🇻🇨', region: 'Americas' },

  // ==========================================
  // OCEANIA (16 countries & territories)
  // ==========================================
  { iso3: 'AUS', countryName: 'Australia', currencyCode: 'AUD', currencyName: 'Australian Dollar', flagEmoji: '🇦🇺', region: 'Oceania' },
  { iso3: 'NZL', countryName: 'Selandia Baru', currencyCode: 'NZD', currencyName: 'New Zealand Dollar', flagEmoji: '🇳🇿', region: 'Oceania' },
  { iso3: 'PNG', countryName: 'Papua Nugini', currencyCode: 'PGK', currencyName: 'Papua New Guinean Kina', flagEmoji: '🇵🇬', region: 'Oceania' },
  { iso3: 'FJI', countryName: 'Fiji', currencyCode: 'FJD', currencyName: 'Fijian Dollar', flagEmoji: '🇫🇯', region: 'Oceania' },
  { iso3: 'SLB', countryName: 'Kepulauan Solomon', currencyCode: 'SBD', currencyName: 'Solomon Islands Dollar', flagEmoji: '🇸🇧', region: 'Oceania' },
  { iso3: 'VUT', countryName: 'Vanuatu', currencyCode: 'VUV', currencyName: 'Vanuatu Vatu', flagEmoji: '🇻🇺', region: 'Oceania' },
  { iso3: 'WSM', countryName: 'Samoa', currencyCode: 'WST', currencyName: 'Samoan Tala', flagEmoji: '🇼🇸', region: 'Oceania' },
  { iso3: 'TON', countryName: 'Tonga', currencyCode: 'TOP', currencyName: 'Tongan Pa\'anga', flagEmoji: '🇹🇴', region: 'Oceania' },
  { iso3: 'KIR', countryName: 'Kiribati', currencyCode: 'AUD', currencyName: 'Australian Dollar', flagEmoji: '🇰🇮', region: 'Oceania' },
  { iso3: 'FSM', countryName: 'Mikronesia', currencyCode: 'USD', currencyName: 'US Dollar', flagEmoji: '🇫🇲', region: 'Oceania' },
  { iso3: 'MHL', countryName: 'Kepulauan Marshall', currencyCode: 'USD', currencyName: 'US Dollar', flagEmoji: '🇲🇭', region: 'Oceania' },
  { iso3: 'NRU', countryName: 'Nauru', currencyCode: 'AUD', currencyName: 'Australian Dollar', flagEmoji: '🇳🇷', region: 'Oceania' },
  { iso3: 'PLW', countryName: 'Palau', currencyCode: 'USD', currencyName: 'US Dollar', flagEmoji: '🇵🇼', region: 'Oceania' },
  { iso3: 'TUV', countryName: 'Tuvalu', currencyCode: 'AUD', currencyName: 'Australian Dollar', flagEmoji: '🇹🇻', region: 'Oceania' },
  { iso3: 'NCL', countryName: 'Kaledonia Baru', currencyCode: 'XPF', currencyName: 'CFP Franc', flagEmoji: '🇳🇨', region: 'Oceania' },
  { iso3: 'PYF', countryName: 'Polinesia Prancis', currencyCode: 'XPF', currencyName: 'CFP Franc', flagEmoji: '🇵🇫', region: 'Oceania' },

  // ==========================================
  // AFRICA (54 countries & territories)
  // ==========================================
  { iso3: 'ZAF', countryName: 'Afrika Selatan', currencyCode: 'ZAR', currencyName: 'South African Rand', flagEmoji: '🇿🇦', region: 'Africa' },
  { iso3: 'EGY', countryName: 'Mesir', currencyCode: 'EGP', currencyName: 'Egyptian Pound', flagEmoji: '🇪🇬', region: 'Africa' },
  { iso3: 'NGA', countryName: 'Nigeria', currencyCode: 'NGN', currencyName: 'Nigerian Naira', flagEmoji: '🇳🇬', region: 'Africa' },
  { iso3: 'KEN', countryName: 'Kenya', currencyCode: 'KES', currencyName: 'Kenyan Shilling', flagEmoji: '🇰🇪', region: 'Africa' },
  { iso3: 'GHA', countryName: 'Ghana', currencyCode: 'GHS', currencyName: 'Ghanaian Cedi', flagEmoji: '🇬🇭', region: 'Africa' },
  { iso3: 'MAR', countryName: 'Maroko', currencyCode: 'MAD', currencyName: 'Moroccan Dirham', flagEmoji: '🇲🇦', region: 'Africa' },
  { iso3: 'DZA', countryName: 'Aljazair', currencyCode: 'DZD', currencyName: 'Algerian Dinar', flagEmoji: '🇩🇿', region: 'Africa' },
  { iso3: 'TUN', countryName: 'Tunisia', currencyCode: 'TND', currencyName: 'Tunisian Dinar', flagEmoji: '🇹🇳', region: 'Africa' },
  { iso3: 'ETH', countryName: 'Etiopia', currencyCode: 'ETB', currencyName: 'Ethiopian Birr', flagEmoji: '🇪🇹', region: 'Africa' },
  { iso3: 'TZA', countryName: 'Tanzania', currencyCode: 'TZS', currencyName: 'Tanzanian Shilling', flagEmoji: '🇹🇿', region: 'Africa' },
  { iso3: 'UGA', countryName: 'Uganda', currencyCode: 'UGX', currencyName: 'Ugandan Shilling', flagEmoji: '🇺🇬', region: 'Africa' },
  { iso3: 'RWA', countryName: 'Rwanda', currencyCode: 'RWF', currencyName: 'Rwandan Franc', flagEmoji: '🇷🇼', region: 'Africa' },
  { iso3: 'MUS', countryName: 'Mauritius', currencyCode: 'MUR', currencyName: 'Mauritian Rupee', flagEmoji: '🇲🇺', region: 'Africa' },
  { iso3: 'SYC', countryName: 'Seychelles', currencyCode: 'SCR', currencyName: 'Seychellois Rupee', flagEmoji: '🇸🇨', region: 'Africa' },
  { iso3: 'AGO', countryName: 'Angola', currencyCode: 'AOA', currencyName: 'Angolan Kwanza', flagEmoji: '🇦🇴', region: 'Africa' },
  { iso3: 'MOZ', countryName: 'Mozambik', currencyCode: 'MZN', currencyName: 'Mozambican Metical', flagEmoji: '🇲🇿', region: 'Africa' },
  { iso3: 'ZMB', countryName: 'Zambia', currencyCode: 'ZMW', currencyName: 'Zambian Kwacha', flagEmoji: '🇿🇲', region: 'Africa' },
  { iso3: 'ZWE', countryName: 'Zimbabwe', currencyCode: 'ZWG', currencyName: 'Zimbabwean Dollar', flagEmoji: '🇿🇼', region: 'Africa' },
  { iso3: 'SEN', countryName: 'Senegal', currencyCode: 'XOF', currencyName: 'West African CFA Franc', flagEmoji: '🇸🇳', region: 'Africa' },
  { iso3: 'CIV', countryName: 'Pantai Gading', currencyCode: 'XOF', currencyName: 'West African CFA Franc', flagEmoji: '🇨🇮', region: 'Africa' },
  { iso3: 'MLI', countryName: 'Mali', currencyCode: 'XOF', currencyName: 'West African CFA Franc', flagEmoji: '🇲🇱', region: 'Africa' },
  { iso3: 'BFA', countryName: 'Burkina Faso', currencyCode: 'XOF', currencyName: 'West African CFA Franc', flagEmoji: '🇧🇫', region: 'Africa' },
  { iso3: 'NER', countryName: 'Niger', currencyCode: 'XOF', currencyName: 'West African CFA Franc', flagEmoji: '🇳🇪', region: 'Africa' },
  { iso3: 'TGO', countryName: 'Togo', currencyCode: 'XOF', currencyName: 'West African CFA Franc', flagEmoji: '🇹🇬', region: 'Africa' },
  { iso3: 'BEN', countryName: 'Benin', currencyCode: 'XOF', currencyName: 'West African CFA Franc', flagEmoji: '🇧🇯', region: 'Africa' },
  { iso3: 'GNB', countryName: 'Guinea-Bissau', currencyCode: 'XOF', currencyName: 'West African CFA Franc', flagEmoji: '🇬🇼', region: 'Africa' },
  { iso3: 'CMR', countryName: 'Kamerun', currencyCode: 'XAF', currencyName: 'Central African CFA Franc', flagEmoji: '🇨🇲', region: 'Africa' },
  { iso3: 'GAB', countryName: 'Gabon', currencyCode: 'XAF', currencyName: 'Central African CFA Franc', flagEmoji: '🇬🇦', region: 'Africa' },
  { iso3: 'COG', countryName: 'Republik Kongo', currencyCode: 'XAF', currencyName: 'Central African CFA Franc', flagEmoji: '🇨🇬', region: 'Africa' },
  { iso3: 'TCD', countryName: 'Chad', currencyCode: 'XAF', currencyName: 'Central African CFA Franc', flagEmoji: '🇹🇩', region: 'Africa' },
  { iso3: 'CAF', countryName: 'Republik Afrika Tengah', currencyCode: 'XAF', currencyName: 'Central African CFA Franc', flagEmoji: '🇨🇫', region: 'Africa' },
  { iso3: 'GNQ', countryName: 'Guinea Khatulistiwa', currencyCode: 'XAF', currencyName: 'Central African CFA Franc', flagEmoji: '🇬🇶', region: 'Africa' },
  { iso3: 'COD', countryName: 'Republik Demokratik Kongo', currencyCode: 'CDF', currencyName: 'Congolese Franc', flagEmoji: '🇨🇩', region: 'Africa' },
  { iso3: 'MDG', countryName: 'Madagaskar', currencyCode: 'MGA', currencyName: 'Malagasy Ariary', flagEmoji: '🇲🇬', region: 'Africa' },
  { iso3: 'BWP', countryName: 'Botswana', currencyCode: 'BWP', currencyName: 'Botswanan Pula', flagEmoji: '🇧🇼', region: 'Africa' },
  { iso3: 'NAM', countryName: 'Namibia', currencyCode: 'NAD', currencyName: 'Namibian Dollar', flagEmoji: '🇳🇦', region: 'Africa' },
  { iso3: 'SWZ', countryName: 'Eswatini', currencyCode: 'SZL', currencyName: 'Swazi Lilangeni', flagEmoji: '🇸🇿', region: 'Africa' },
  { iso3: 'LSO', countryName: 'Lesotho', currencyCode: 'LSL', currencyName: 'Lesotho Loti', flagEmoji: '🇱🇸', region: 'Africa' },
  { iso3: 'SDN', countryName: 'Sudan', currencyCode: 'SDG', currencyName: 'Sudanese Pound', flagEmoji: '🇸🇩', region: 'Africa' },
  { iso3: 'SSD', countryName: 'Sudan Selatan', currencyCode: 'SSP', currencyName: 'South Sudanese Pound', flagEmoji: '🇸🇸', region: 'Africa' },
  { iso3: 'LBY', countryName: 'Libya', currencyCode: 'LYD', currencyName: 'Libyan Dinar', flagEmoji: '🇱🇾', region: 'Africa' },
  { iso3: 'MRT', countryName: 'Mauritania', currencyCode: 'MRU', currencyName: 'Mauritanian Ouguiya', flagEmoji: '🇲🇷', region: 'Africa' },
  { iso3: 'GMB', countryName: 'Gambia', currencyCode: 'GMD', currencyName: 'Gambian Dalasi', flagEmoji: '🇬🇲', region: 'Africa' },
  { iso3: 'SLE', countryName: 'Sierra Leone', currencyCode: 'SLE', currencyName: 'Sierra Leonean Leone', flagEmoji: '🇸🇱', region: 'Africa' },
  { iso3: 'LBR', countryName: 'Liberia', currencyCode: 'LRD', currencyName: 'Liberian Dollar', flagEmoji: '🇱🇷', region: 'Africa' },
  { iso3: 'GIN', countryName: 'Guinea', currencyCode: 'GNF', currencyName: 'Guinean Franc', flagEmoji: '🇬🇳', region: 'Africa' },
  { iso3: 'BDI', countryName: 'Burundi', currencyCode: 'BIF', currencyName: 'Burundian Franc', flagEmoji: '🇧🇮', region: 'Africa' },
  { iso3: 'DJI', countryName: 'Jibuti', currencyCode: 'DJF', currencyName: 'Djiboutian Franc', flagEmoji: '🇩🇯', region: 'Africa' },
  { iso3: 'ERI', countryName: 'Eritrea', currencyCode: 'ERN', currencyName: 'Eritrean Nakfa', flagEmoji: '🇪🇷', region: 'Africa' },
  { iso3: 'CPV', countryName: 'Tanjung Verde', currencyCode: 'CVE', currencyName: 'Cape Verdean Escudo', flagEmoji: '🇨🇻', region: 'Africa' },
  { iso3: 'COM', countryName: 'Komoro', currencyCode: 'KMF', currencyName: 'Comorian Franc', flagEmoji: '🇰🇲', region: 'Africa' },
  { iso3: 'STP', countryName: 'Sao Tome dan Principe', currencyCode: 'STN', currencyName: 'Sao Tome and Principe Dobra', flagEmoji: '🇸🇹', region: 'Africa' },
  { iso3: 'SOM', countryName: 'Somalia', currencyCode: 'SOS', currencyName: 'Somali Shilling', flagEmoji: '🇸🇴', region: 'Africa' },
];

/**
 * Normalization map for alternative ISO-3 codes, currency codes, or common aliases.
 */
const ISO3_ALIASES: ReadonlyMap<string, string> = new Map([
  ['UGX', 'UGA'],
  ['IRR', 'IRN'],
  ['UK', 'GBR'],
]);

export const ISO3_LOOKUP: ReadonlyMap<string, CountryCurrencyEntry> = new Map(
  COUNTRY_CURRENCY_LIST.map((c) => [c.iso3.toUpperCase(), c])
);

export const CURRENCY_TO_COUNTRIES_MAP: ReadonlyMap<string, CountryCurrencyEntry[]> = (() => {
  const map = new Map<string, CountryCurrencyEntry[]>();
  for (const entry of COUNTRY_CURRENCY_LIST) {
    const code = entry.currencyCode.toUpperCase();
    const existing = map.get(code) ?? [];
    existing.push(entry);
    map.set(code, existing);
  }
  return map;
})();

export function getCountryByIso3(iso3: string): CountryCurrencyEntry | undefined {
  if (!iso3) return undefined;
  const upper = iso3.toUpperCase();
  const direct = ISO3_LOOKUP.get(upper);
  if (direct) return direct;

  const aliasTarget = ISO3_ALIASES.get(upper);
  if (aliasTarget) {
    return ISO3_LOOKUP.get(aliasTarget);
  }
  return undefined;
}

export function getCountriesByCurrency(currencyCode: string): CountryCurrencyEntry[] {
  if (!currencyCode) return [];
  return CURRENCY_TO_COUNTRIES_MAP.get(currencyCode.toUpperCase()) ?? [];
}

export function getIso3ByCurrency(currencyCode: string): string[] {
  const countries = getCountriesByCurrency(currencyCode);
  return countries.map((c) => c.iso3);
}

export function getAllCountryMappings(): CountryCurrencyEntry[] {
  return [...COUNTRY_CURRENCY_LIST];
}
