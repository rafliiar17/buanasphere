/**
 * Kurs World / GeoGlobe — Precise World Capital Coordinates and National Anthems.
 * Provides authentic geographical city coordinates and national anthem metadata.
 */
export interface NationalAnthem {
  title: string;
  nativeTitle?: string;
  composer?: string;
  adoptedYear?: number;
  audioUrl?: string;
}

export const CAPITAL_COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  // Asia Tenggara (ASEAN)
  IDN: { lat: -6.2088, lng: 106.8456 },   // Jakarta
  MYS: { lat: 3.1390, lng: 101.6869 },    // Kuala Lumpur
  SGP: { lat: 1.3521, lng: 103.8198 },    // Singapore
  THA: { lat: 13.7563, lng: 100.5018 },   // Bangkok
  PHL: { lat: 14.5995, lng: 120.9842 },   // Manila
  VNM: { lat: 21.0285, lng: 105.8542 },   // Hanoi
  BRN: { lat: 4.9031, lng: 114.9398 },    // Bandar Seri Begawan
  KHM: { lat: 11.5564, lng: 104.9282 },   // Phnom Penh
  LAO: { lat: 17.9757, lng: 102.6331 },   // Vientiane
  MMR: { lat: 19.7633, lng: 96.0785 },    // Naypyidaw
  TLS: { lat: -8.5569, lng: 125.5789 },   // Dili

  // Asia Timur & Selatan
  JPN: { lat: 35.6762, lng: 139.6503 },   // Tokyo
  CHN: { lat: 39.9042, lng: 116.4074 },   // Beijing
  HKG: { lat: 22.3193, lng: 114.1694 },   // Hong Kong
  TWN: { lat: 25.0330, lng: 121.5654 },   // Taipei
  KOR: { lat: 37.5665, lng: 126.9780 },   // Seoul
  PRK: { lat: 39.0392, lng: 125.7625 },   // Pyongyang
  IND: { lat: 28.6139, lng: 77.2090 },    // New Delhi
  PAK: { lat: 33.6844, lng: 73.0479 },    // Islamabad
  BGD: { lat: 23.8103, lng: 90.4125 },    // Dhaka
  LKA: { lat: 6.9271, lng: 79.8612 },     // Colombo / Sri Jayawardenepura
  NPL: { lat: 27.7172, lng: 85.3240 },    // Kathmandu
  BTN: { lat: 27.4728, lng: 89.6393 },    // Thimphu
  MDV: { lat: 4.1755, lng: 73.5093 },     // Malé
  MNG: { lat: 47.9188, lng: 106.9176 },   // Ulaanbaatar
  KAZ: { lat: 51.1694, lng: 71.4491 },    // Astana
  UZB: { lat: 41.2995, lng: 69.2401 },    // Tashkent
  KGZ: { lat: 42.8746, lng: 74.5698 },    // Bishkek
  TJK: { lat: 38.5598, lng: 68.7870 },    // Dushanbe
  TMT: { lat: 37.9601, lng: 58.3261 },    // Ashgabat
  AFG: { lat: 34.5553, lng: 69.2075 },    // Kabul

  // Timur Tengah
  SAU: { lat: 24.7136, lng: 46.6753 },    // Riyadh
  ARE: { lat: 24.4539, lng: 54.3773 },    // Abu Dhabi
  QAT: { lat: 25.2854, lng: 51.5310 },    // Doha
  KWT: { lat: 29.3759, lng: 47.9774 },    // Kuwait City
  BHR: { lat: 26.2285, lng: 50.5860 },    // Manama
  OMN: { lat: 23.5880, lng: 58.3829 },    // Muscat
  YEM: { lat: 15.3694, lng: 44.1910 },    // Sana'a
  JOR: { lat: 31.9454, lng: 35.9284 },    // Amman
  LBN: { lat: 33.8938, lng: 35.5018 },    // Beirut
  SYR: { lat: 33.5138, lng: 36.2765 },    // Damaskus
  IRQ: { lat: 33.3152, lng: 44.3661 },    // Baghdad
  IRN: { lat: 35.6892, lng: 51.3890 },    // Teheran
  ISR: { lat: 31.7683, lng: 35.2137 },    // Yerusalem
  PSE: { lat: 31.9038, lng: 35.2034 },    // Ramallah
  TUR: { lat: 39.9334, lng: 32.8597 },    // Ankara
  CYP: { lat: 35.1856, lng: 33.3823 },    // Nicosia

  // Eropa Barat & Utara
  GBR: { lat: 51.5074, lng: -0.1278 },    // London
  FRA: { lat: 48.8566, lng: 2.3522 },     // Paris
  DEU: { lat: 52.5200, lng: 13.4050 },    // Berlin
  ITA: { lat: 41.9028, lng: 12.4964 },    // Roma
  ESP: { lat: 40.4168, lng: -3.7038 },    // Madrid
  PRT: { lat: 38.7223, lng: -9.1393 },    // Lisbon
  NLD: { lat: 52.3676, lng: 4.9041 },     // Amsterdam
  BEL: { lat: 50.8503, lng: 4.3517 },     // Brussels
  CHE: { lat: 46.9480, lng: 7.4474 },     // Bern
  AUT: { lat: 48.2082, lng: 16.3738 },    // Wina
  IRL: { lat: 53.3498, lng: -6.2603 },    // Dublin
  SWE: { lat: 59.3293, lng: 18.0686 },    // Stockholm
  NOR: { lat: 59.9139, lng: 10.7522 },    // Oslo
  DNK: { lat: 55.6761, lng: 12.5683 },    // Kopenhagen
  FIN: { lat: 60.1699, lng: 24.9384 },    // Helsinki
  ISL: { lat: 64.1466, lng: -21.9426 },   // Reykjavik
  LUX: { lat: 49.6116, lng: 6.1319 },     // Luksemburg

  // Eropa Timur & Balkan
  RUS: { lat: 55.7558, lng: 37.6173 },    // Moskow
  UKR: { lat: 50.4501, lng: 30.5234 },    // Kyiv
  POL: { lat: 52.2297, lng: 21.0122 },    // Warsawa
  CZE: { lat: 50.0755, lng: 14.4378 },    // Praha
  SVK: { lat: 48.1486, lng: 17.1077 },    // Bratislava
  HUN: { lat: 47.4979, lng: 19.0402 },    // Budapest
  ROU: { lat: 44.4268, lng: 26.1025 },    // Bucharest
  BGR: { lat: 42.6977, lng: 23.3219 },    // Sofia
  GRC: { lat: 37.9838, lng: 23.7275 },    // Athena
  HRV: { lat: 45.8150, lng: 15.9819 },    // Zagreb
  SRB: { lat: 44.7866, lng: 20.4489 },    // Beograd
  BIH: { lat: 43.8563, lng: 18.4131 },    // Sarajevo
  SVN: { lat: 46.0569, lng: 14.5058 },    // Ljubljana
  ALB: { lat: 41.3275, lng: 19.8187 },    // Tirana
  MKD: { lat: 41.9981, lng: 21.4254 },    // Skopje
  MNE: { lat: 42.4304, lng: 19.2594 },    // Podgorica
  XKX: { lat: 42.6629, lng: 21.1655 },    // Pristina
  BLR: { lat: 53.9006, lng: 27.5590 },    // Minsk
  MDA: { lat: 47.0105, lng: 28.8638 },    // Chisinau
  EST: { lat: 59.4370, lng: 24.7535 },    // Tallinn
  LVA: { lat: 56.9496, lng: 24.1052 },    // Riga
  LTU: { lat: 54.6872, lng: 25.2797 },    // Vilnius
  GEO: { lat: 41.7151, lng: 44.8271 },    // Tbilisi
  ARM: { lat: 40.1792, lng: 44.4991 },    // Yerevan
  AZE: { lat: 40.4093, lng: 49.8671 },    // Baku

  // Amerika Utara & Selatan
  USA: { lat: 38.9072, lng: -77.0369 },   // Washington, D.C.
  CAN: { lat: 45.4215, lng: -75.6972 },   // Ottawa
  MEX: { lat: 19.4326, lng: -99.1332 },   // Mexico City
  BRA: { lat: -15.7975, lng: -47.8919 },  // Brasília
  ARG: { lat: -34.6037, lng: -58.3816 },  // Buenos Aires
  CHL: { lat: -33.4489, lng: -70.6693 },  // Santiago
  COL: { lat: 4.7110, lng: -74.0721 },    // Bogotá
  PER: { lat: -12.0464, lng: -77.0428 },  // Lima
  VEN: { lat: 10.4806, lng: -66.9036 },   // Caracas
  ECU: { lat: -0.1807, lng: -78.4678 },   // Quito
  BOL: { lat: -16.5000, lng: -68.1500 },  // La Paz / Sucre
  PRY: { lat: -25.2637, lng: -57.5759 },  // Asunción
  URY: { lat: -34.9011, lng: -56.1645 },  // Montevideo
  GUY: { lat: 6.8013, lng: -58.1551 },    // Georgetown
  SUR: { lat: 5.8520, lng: -55.2038 },    // Paramaribo
  PAN: { lat: 8.9824, lng: -79.5199 },    // Panama City
  CRI: { lat: 9.9281, lng: -84.0907 },    // San José
  NIC: { lat: 12.1149, lng: -86.2362 },   // Managua
  HND: { lat: 14.0723, lng: -87.1921 },   // Tegucigalpa
  SLV: { lat: 13.6929, lng: -89.2182 },   // San Salvador
  GTM: { lat: 14.6349, lng: -90.5069 },   // Guatemala City
  BLZ: { lat: 17.2510, lng: -88.7590 },   // Belmopan
  CUB: { lat: 23.1136, lng: -82.3666 },   // Havana
  DOM: { lat: 18.4861, lng: -69.9312 },   // Santo Domingo
  HTI: { lat: 18.5944, lng: -72.3074 },   // Port-au-Prince
  JAM: { lat: 17.9714, lng: -76.7936 },   // Kingston
  TTO: { lat: 10.6549, lng: -61.5019 },   // Port of Spain
  BHS: { lat: 25.0343, lng: -77.3963 },   // Nassau
  BRB: { lat: 13.1939, lng: -59.5432 },   // Bridgetown

  // Afrika
  EGY: { lat: 30.0444, lng: 31.2357 },    // Kairo
  ZAF: { lat: -25.7479, lng: 28.2293 },   // Pretoria / Cape Town
  NGA: { lat: 9.0765, lng: 7.3986 },      // Abuja
  KEN: { lat: -1.2921, lng: 36.8219 },    // Nairobi
  ETH: { lat: 9.0320, lng: 38.7482 },     // Addis Ababa
  GHA: { lat: 5.6037, lng: -0.1870 },     // Accra
  MAR: { lat: 34.0209, lng: -6.8416 },    // Rabat
  DZA: { lat: 36.7538, lng: 3.0588 },     // Aljir
  TUN: { lat: 36.8065, lng: 10.1815 },    // Tunis
  LBY: { lat: 32.8872, lng: 13.1913 },    // Tripoli
  SDN: { lat: 15.5007, lng: 32.5599 },    // Khartoum
  SSD: { lat: 4.8594, lng: 31.5713 },     // Juba
  UGA: { lat: 0.3476, lng: 32.5825 },     // Kampala
  TZA: { lat: -6.1630, lng: 35.7516 },    // Dodoma
  RWA: { lat: -1.9706, lng: 30.1044 },    // Kigali
  COD: { lat: -4.4419, lng: 15.2663 },    // Kinshasa
  COG: { lat: -4.2634, lng: 15.2429 },    // Brazzaville
  CMR: { lat: 3.8480, lng: 11.5021 },     // Yaoundé
  CIV: { lat: 6.8276, lng: -5.2893 },     // Yamoussoukro
  SEN: { lat: 14.7167, lng: -17.4677 },   // Dakar
  AGO: { lat: -8.8390, lng: 13.2894 },    // Luanda
  MOZ: { lat: -25.9692, lng: 32.5732 },   // Maputo
  ZMB: { lat: -15.3875, lng: 28.3228 },   // Lusaka
  ZWE: { lat: -17.8216, lng: 31.0492 },   // Harare
  BWA: { lat: -24.6282, lng: 25.9231 },   // Gaborone
  NAM: { lat: -22.5609, lng: 17.0658 },   // Windhoek
  MDG: { lat: -18.8792, lng: 47.5079 },   // Antananarivo
  MUS: { lat: -20.1609, lng: 57.5012 },   // Port Louis

  // Oseania & Pasifik
  AUS: { lat: -35.2809, lng: 149.1300 },  // Canberra
  NZL: { lat: -41.2865, lng: 174.7762 },  // Wellington
  PNG: { lat: -9.4438, lng: 147.1803 },   // Port Moresby
  FJI: { lat: -18.1416, lng: 178.4419 },  // Suva
  SLB: { lat: -9.4456, lng: 159.9729 },   // Honiara
  VUT: { lat: -17.7333, lng: 168.3273 },  // Port Vila
  WSM: { lat: -13.8333, lng: -171.7667 }, // Apia
  TON: { lat: -21.1393, lng: -175.2049 }, // Nuku'alofa
  FSM: { lat: 6.9172, lng: 158.1589 },    // Palikir
};

export const NATIONAL_ANTHEMS_MAP: Record<string, NationalAnthem> = {
  // Asia Tenggara (ASEAN)
  IDN: {
    title: 'Indonesia Raya',
    composer: 'Wage Rudolf Supratman',
    adoptedYear: 1945,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Indonesia_Raya_%28instrumental%29.ogg',
  },
  MYS: {
    title: 'Negaraku',
    nativeTitle: 'نݢاراکو',
    composer: 'Pierre-Jean de Béranger',
    adoptedYear: 1957,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Negaraku_instrumental.ogg',
  },
  SGP: {
    title: 'Majulah Singapura',
    composer: 'Zubir Said',
    adoptedYear: 1965,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Majulah_Singapura_instrumental.ogg',
  },
  THA: {
    title: 'Phleng Chat Thai',
    nativeTitle: 'เพลงชาติไทย',
    composer: 'Phra Chenduriyang',
    adoptedYear: 1939,
  },
  PHL: {
    title: 'Lupang Hinirang',
    nativeTitle: 'Chosen Land',
    composer: 'Julián Felipe',
    adoptedYear: 1898,
  },
  VNM: {
    title: 'Tiến Quân Ca',
    nativeTitle: 'Bài ca tiến quân',
    composer: 'Văn Cao',
    adoptedYear: 1945,
  },
  BRN: {
    title: 'Allah Peliharakan Sultan',
    composer: 'Awang Haji Besar bin Sagap',
    adoptedYear: 1951,
  },
  KHM: {
    title: 'Nokor Reach',
    nativeTitle: 'នគររាជ',
    composer: 'F. Perruchot & J. Schmitt',
    adoptedYear: 1941,
  },
  LAO: {
    title: 'Pheng Xat Lao',
    nativeTitle: 'ເພງຊາດລາວ',
    composer: 'Thongdy Sounthonevichit',
    adoptedYear: 1947,
  },
  MMR: {
    title: 'Kaba Ma Kyei',
    nativeTitle: 'ကမ္ဘာမကျေ',
    composer: 'YMB Saya Tin',
    adoptedYear: 1948,
  },
  TLS: {
    title: 'Pátria',
    composer: 'Afonso de Araujo',
    adoptedYear: 2002,
  },

  // Asia Timur & Selatan
  JPN: {
    title: 'Kimigayo',
    nativeTitle: '君が代',
    composer: 'Hiromori Hayashi',
    adoptedYear: 1880,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Kimi_ga_Yo_instrumental.ogg',
  },
  CHN: {
    title: 'Yìyǒngjūn Jìnxíngqǔ (Barisan Para Relawan)',
    nativeTitle: '义勇军进行曲',
    composer: 'Nie Er',
    adoptedYear: 1949,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/March_of_the_Volunteers_instrumental.ogg',
  },
  KOR: {
    title: 'Aegukga',
    nativeTitle: '애국가',
    composer: 'Ahn Eak-tai',
    adoptedYear: 1948,
  },
  PRK: {
    title: 'Aegukka',
    nativeTitle: '애국가',
    composer: 'Kim Won-gyun',
    adoptedYear: 1947,
  },
  TWN: {
    title: 'Lagu Kebangsaan Republik Tiongkok',
    nativeTitle: '中華民國國歌',
    composer: 'Cheng Maoyun',
    adoptedYear: 1930,
  },
  IND: {
    title: 'Jana Gana Mana',
    nativeTitle: 'जन गण मन',
    composer: 'Rabindranath Tagore',
    adoptedYear: 1950,
  },
  PAK: {
    title: 'Qaumī Tarāna',
    nativeTitle: 'قومی ترانہ',
    composer: 'Ghulam Ahmad Chagla',
    adoptedYear: 1954,
  },
  BGD: {
    title: 'Amar Shonar Bangla',
    nativeTitle: 'আমার সোনার বাংলা',
    composer: 'Rabindranath Tagore',
    adoptedYear: 1971,
  },
  LKA: {
    title: 'Sri Lanka Matha',
    nativeTitle: 'ශ්‍රී ලංකා මාතා',
    composer: 'Ananda Samarakoon',
    adoptedYear: 1951,
  },
  NPL: {
    title: 'Sayaun Thunga Phulka',
    nativeTitle: 'सयौं थुँगा फूलका',
    composer: 'Amber Gurung',
    adoptedYear: 2007,
  },
  KAZ: {
    title: 'Meniñ Qazaqstanym',
    nativeTitle: 'Менің Қазақстаным',
    composer: 'Shamshi Kaldayakov',
    adoptedYear: 2006,
  },
  UZB: {
    title: 'Oʻzbekiston Respublikasining Davlat Madhiyasi',
    composer: 'Mutal Burhonov',
    adoptedYear: 1992,
  },

  // Eropa
  GBR: {
    title: 'God Save the King',
    composer: 'Tradisional Anonim',
    adoptedYear: 1745,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/United_States_Navy_Band_-_God_Save_the_King.ogg',
  },
  FRA: {
    title: 'La Marseillaise',
    composer: 'Claude Joseph Rouget de Lisle',
    adoptedYear: 1795,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/La_Marseillaise.ogg',
  },
  DEU: {
    title: 'Das Lied der Deutschen',
    composer: 'Joseph Haydn',
    adoptedYear: 1922,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/German_national_anthem_performed_by_the_US_Navy_Band.ogg',
  },
  ITA: {
    title: 'Il Canto degli Italiani (Fratelli d\'Italia)',
    composer: 'Michele Novaro',
    adoptedYear: 1946,
  },
  ESP: {
    title: 'Marcha Real',
    composer: 'Manuel de Espinosa de los Monteros',
    adoptedYear: 1770,
  },
  NLD: {
    title: 'Wilhelmus van Nassouwe',
    composer: 'Adrianus Valerius',
    adoptedYear: 1932,
  },
  CHE: {
    title: 'Schweizerpsalm',
    composer: 'Alberik Zwyssig',
    adoptedYear: 1981,
  },
  SWE: {
    title: 'Du gamla, du fria',
    composer: 'Tradisional Rakyat Swedia',
    adoptedYear: 1844,
  },
  NOR: {
    title: 'Ja, vi elsker dette landet',
    composer: 'Rikard Nordraak',
    adoptedYear: 1864,
  },
  DNK: {
    title: 'Der er et yndigt land',
    composer: 'Hans Ernst Krøyer',
    adoptedYear: 1835,
  },
  FIN: {
    title: 'Maamme',
    composer: 'Fredrik Pacius',
    adoptedYear: 1848,
  },
  ISL: {
    title: 'Lofsöngur',
    composer: 'Sveinbjörn Sveinbjörnsson',
    adoptedYear: 1944,
  },
  RUS: {
    title: 'Gimn Rossiyskoy Federatsii',
    nativeTitle: 'Государственный гимн РФ',
    composer: 'Alexander Alexandrov',
    adoptedYear: 2000,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/National_Anthem_of_Russia_%282000%29%2C_instrumental%2C_one_verse.ogg',
  },
  UKR: {
    title: 'Shche ne vmerla Ukrainy',
    nativeTitle: 'Ще не вмерла України',
    composer: 'Mykhailo Verbytsky',
    adoptedYear: 1992,
  },
  POL: {
    title: 'Mazurek Dąbrowskiego',
    composer: 'Tradisional Polandia',
    adoptedYear: 1927,
  },
  GRC: {
    title: 'Ýmnos eis tin Eleftherían',
    nativeTitle: 'Ύμνος εις την Ελευθερίαν',
    composer: 'Nikolaos Mantzaros',
    adoptedYear: 1865,
  },
  PRT: {
    title: 'A Portuguesa',
    composer: 'Alfredo Keil',
    adoptedYear: 1911,
  },
  BEL: {
    title: 'La Brabançonne',
    composer: 'François van Campenhout',
    adoptedYear: 1830,
  },
  AUT: {
    title: 'Bundeshymne der Republik Österreich',
    composer: 'Wolfgang Amadeus Mozart',
    adoptedYear: 1946,
  },
  IRL: {
    title: 'Amhrán na bhFiann',
    composer: 'Peadar Kearney',
    adoptedYear: 1926,
  },

  // Amerika
  USA: {
    title: 'The Star-Spangled Banner',
    composer: 'John Stafford Smith',
    adoptedYear: 1931,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Star_Spangled_Banner_instrumental.ogg',
  },
  CAN: {
    title: 'O Canada',
    composer: 'Calixa Lavallée',
    adoptedYear: 1980,
  },
  MEX: {
    title: 'Himno Nacional Mexicano',
    composer: 'Jaime Nunó',
    adoptedYear: 1943,
  },
  BRA: {
    title: 'Hino Nacional Brasileiro',
    composer: 'Francisco Manuel da Silva',
    adoptedYear: 1831,
  },
  ARG: {
    title: 'Himno Nacional Argentino',
    composer: 'Blas Parera',
    adoptedYear: 1813,
  },
  CHL: {
    title: 'Himno Nacional de Chile',
    composer: 'Ramón Carnicer',
    adoptedYear: 1847,
  },
  COL: {
    title: 'Himno Nacional de la República de Colombia',
    composer: 'Oreste Sindici',
    adoptedYear: 1920,
  },
  PER: {
    title: 'Himno Nacional del Perú',
    composer: 'José Bernardo Alcedo',
    adoptedYear: 1821,
  },

  // Timur Tengah & Afrika
  SAU: {
    title: 'Aash Al Maleek (Hiduplah Sang Raja)',
    nativeTitle: 'عاش الملك',
    composer: 'Abdul Rahman Al-Khateeb',
    adoptedYear: 1950,
  },
  TUR: {
    title: 'İstiklal Marşı',
    composer: 'Osman Zeki Üngör',
    adoptedYear: 1921,
  },
  EGY: {
    title: 'Bilady, Bilady, Bilady',
    nativeTitle: 'بلادي بلادي بلادي',
    composer: 'Sayed Darwish',
    adoptedYear: 1979,
  },
  ZAF: {
    title: 'National Anthem of South Africa',
    composer: 'Enoch Sontonga & C.J. Langenhoven',
    adoptedYear: 1997,
  },
  NGA: {
    title: 'Nigeria, We Hail Thee',
    composer: 'Frances Berda',
    adoptedYear: 2024,
  },
  KEN: {
    title: 'Ee Mungu Nguvu Yetu',
    composer: 'Tradisional Kenya',
    adoptedYear: 1963,
  },
  MAR: {
    title: 'Cherifian Anthem',
    nativeTitle: 'النشيد الشريف',
    composer: 'Léo Morgan',
    adoptedYear: 1956,
  },
  ARE: {
    title: 'Ishy Bilady',
    nativeTitle: 'عيشي بلادي',
    composer: 'Saad Abdel Wahab',
    adoptedYear: 1971,
  },

  // Oseania
  AUS: {
    title: 'Advance Australia Fair',
    composer: 'Peter Dodds McCormick',
    adoptedYear: 1984,
  },
  NZL: {
    title: 'God Defend New Zealand',
    nativeTitle: 'Aotearoa',
    composer: 'John Joseph Woods',
    adoptedYear: 1977,
  },
};
