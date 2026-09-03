/**
 * Global FX Market Sessions Engine
 *
 * Tracks operating hours and active status of the 5 major global foreign exchange
 * trading market sessions: Sydney, Tokyo, London, New York, and Jakarta.
 * All opening and closing calculations are normalized against UTC.
 */

export interface MarketSessionDefinition {
  id: string;
  city: string;
  country: string;
  iso3: string;
  currencyCode: string;
  flagEmoji: string;
  utcOffset: number;
  openUtcHour: number;
  closeUtcHour: number;
  sessionName: string;
  description: string;
}

export interface MarketSessionInfo extends MarketSessionDefinition {
  isOpen: boolean;
  localHours: number;
  localMinutes: number;
  localTimeFormatted: string;
}

export interface MarketSessionsSummary {
  sessions: MarketSessionInfo[];
  activeSessionsCount: number;
  isLondonNewYorkOverlap: boolean;
  activeSessionNames: string[];
  timestamp: Date;
}

export const FX_MARKET_SESSIONS: MarketSessionDefinition[] = [
  {
    id: 'jakarta',
    city: 'Jakarta',
    country: 'Indonesia',
    iso3: 'IDN',
    currencyCode: 'IDR',
    flagEmoji: '🇮🇩',
    utcOffset: 7,
    openUtcHour: 1, // 08:00 WIB
    closeUtcHour: 9, // 16:00 WIB
    sessionName: 'Sesi Jakarta (Domestik IDR)',
    description: 'Pasar Valas & Kliring Domestik Bank Indonesia / JISDOR',
  },
  {
    id: 'sydney',
    city: 'Sydney',
    country: 'Australia',
    iso3: 'AUS',
    currencyCode: 'AUD',
    flagEmoji: '🇦🇺',
    utcOffset: 10,
    openUtcHour: 22, // 08:00 AEST
    closeUtcHour: 7, // 17:00 AEST
    sessionName: 'Sesi Sydney (Pasifik)',
    description: 'Sesi pembuka perdagangan valas global harian',
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Jepang',
    iso3: 'JPN',
    currencyCode: 'JPY',
    flagEmoji: '🇯🇵',
    utcOffset: 9,
    openUtcHour: 0, // 09:00 JST
    closeUtcHour: 9, // 18:00 JST
    sessionName: 'Sesi Tokyo (Asia)',
    description: 'Pusat likuiditas valas Asia terdepan',
  },
  {
    id: 'london',
    city: 'London',
    country: 'Britania Raya',
    iso3: 'GBR',
    currencyCode: 'GBP',
    flagEmoji: '🇬🇧',
    utcOffset: 0,
    openUtcHour: 8, // 08:00 GMT
    closeUtcHour: 17, // 17:00 GMT
    sessionName: 'Sesi London (Eropa)',
    description: 'Pusat valas terbesar dunia (~38.1% volume global BIS)',
  },
  {
    id: 'newyork',
    city: 'New York',
    country: 'Amerika Serikat',
    iso3: 'USA',
    currencyCode: 'USD',
    flagEmoji: '🇺🇸',
    utcOffset: -5,
    openUtcHour: 13, // 08:00 EST
    closeUtcHour: 22, // 17:00 EST
    sessionName: 'Sesi New York (Amerika)',
    description: 'Pasar likuiditas denominasi US Dollar terbesar dunia',
  },
];

/**
 * Calculates real-time active status for all FX market sessions given a Date.
 */
export function calculateMarketSessions(targetDate: Date = new Date()): MarketSessionsSummary {
  const utcHours = targetDate.getUTCHours();
  const utcMinutes = targetDate.getUTCMinutes();
  const utcDecimal = utcHours + utcMinutes / 60;

  const sessions: MarketSessionInfo[] = FX_MARKET_SESSIONS.map((def) => {
    let isOpen = false;
    if (def.openUtcHour < def.closeUtcHour) {
      isOpen = utcDecimal >= def.openUtcHour && utcDecimal < def.closeUtcHour;
    } else {
      // Over-midnight wraps (e.g. Sydney 22:00 to 07:00 UTC)
      isOpen = utcDecimal >= def.openUtcHour || utcDecimal < def.closeUtcHour;
    }

    // Local time in session hub
    const localTotalMinutes = (utcHours * 60 + utcMinutes + def.utcOffset * 60 + 1440) % 1440;
    const localHours = Math.floor(localTotalMinutes / 60);
    const localMins = localTotalMinutes % 60;
    const localTimeFormatted = `${String(localHours).padStart(2, '0')}:${String(localMins).padStart(2, '0')}`;

    return {
      ...def,
      isOpen,
      localHours,
      localMinutes: localMins,
      localTimeFormatted,
    };
  });

  const activeSessions = sessions.filter((s) => s.isOpen);
  const londonSession = sessions.find((s) => s.id === 'london');
  const nySession = sessions.find((s) => s.id === 'newyork');
  const isLondonNewYorkOverlap = Boolean(londonSession?.isOpen && nySession?.isOpen);

  return {
    sessions,
    activeSessionsCount: activeSessions.length,
    isLondonNewYorkOverlap,
    activeSessionNames: activeSessions.map((s) => s.sessionName),
    timestamp: targetDate,
  };
}
