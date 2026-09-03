import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Polyfill $state rune for non-compiler Bun test runner BEFORE module imports
// @ts-ignore
if (typeof globalThis.$state === 'undefined') {
  // @ts-ignore
  globalThis.$state = (initialValue: any) => initialValue;
}

const { GlobeState } = await import('../src/lib/state/globeState.svelte');
const { RatesState } = await import('../src/lib/state/ratesState.svelte');
const {
  EXTENDED_COUNTRIES_DATA,
  getCountryByIso3,
  getCountryByCurrency,
  getDefaultRate,
} = await import('../src/lib/data/countrySpatialData');

describe('Spatial Country Data & Fallbacks (countrySpatialData)', () => {
  it('contains at least 195 countries in EXTENDED_COUNTRIES_DATA', () => {
    expect(EXTENDED_COUNTRIES_DATA.length).toBeGreaterThanOrEqual(195);
  });

  it('correctly maps Indonesia (IDN / IDR)', () => {
    const idn = getCountryByIso3('IDN');
    expect(idn).toBeDefined();
    expect(idn?.countryName).toBe('Indonesia');
    expect(idn?.currencyCode).toBe('IDR');
    expect(idn?.flagEmoji).toBe('🇮🇩');
    expect(idn?.defaultRate).toBe(1);
  });

  it('correctly maps United States (USA / USD)', () => {
    const usa = getCountryByIso3('USA');
    expect(usa).toBeDefined();
    expect(usa?.currencyCode).toBe('USD');
    expect(usa?.flagEmoji).toBe('🇺🇸');
    expect(usa?.defaultRate).toBe(17765);
  });

  it('performs case-insensitive lookup by ISO-3', () => {
    const lower = getCountryByIso3('sgp');
    const upper = getCountryByIso3('SGP');
    expect(lower).toBeDefined();
    expect(lower?.countryName).toBe(upper?.countryName);
  });

  it('finds country by currency code', () => {
    const country = getCountryByCurrency('JPY');
    expect(country).toBeDefined();
    expect(country?.countryName).toBe('Jepang');
  });

  it('returns default rate information for a currency', () => {
    const defUsd = getDefaultRate('USD');
    expect(defUsd.rate).toBe(17765);
    expect(defUsd.buyRate).toBeLessThan(defUsd.rate);
    expect(defUsd.sellRate).toBeGreaterThan(defUsd.rate);
  });
});

describe('GlobeState (Svelte 5 Runes Class)', () => {
  let globe: InstanceType<typeof GlobeState>;

  beforeEach(() => {
    globe = new GlobeState();
  });

  it('initializes with default visualization state', () => {
    expect(globe.activeMetric).toBe('rate');
    expect(globe.selectedCountryIso3).toBeNull();
    expect(globe.hoveredCountryIso3).toBeNull();
    expect(globe.showLabels).toBe(true);
    expect(globe.showTimezoneLines).toBe(false);
    expect(globe.cameraAltitude).toBe(2.5);
    expect(globe.viewMode).toBe('globe');
  });

  it('updates activeMetric correctly', () => {
    globe.setActiveMetric('change');
    expect(globe.activeMetric).toBe('change');
    globe.setActiveMetric('flag');
    expect(globe.activeMetric).toBe('flag');
  });

  it('selects and deselects country with uppercase normalization', () => {
    globe.selectCountry('idn');
    expect(globe.selectedCountryIso3).toBe('IDN');
    expect(globe.selectedCountry).toBeDefined();
    expect(globe.selectedCountry?.countryName).toBe('Indonesia');

    globe.selectCountry(null);
    expect(globe.selectedCountryIso3).toBeNull();
    expect(globe.selectedCountry).toBeUndefined();
  });

  it('updates hovered country with uppercase normalization', () => {
    globe.hoverCountry('sgp');
    expect(globe.hoveredCountryIso3).toBe('SGP');
    expect(globe.hoveredCountry?.countryName).toBe('Singapura');

    globe.hoverCountry(null);
    expect(globe.hoveredCountryIso3).toBeNull();
    expect(globe.hoveredCountry).toBeUndefined();
  });

  it('toggles labels and timezone meridians', () => {
    globe.toggleLabels();
    expect(globe.showLabels).toBe(false);
    globe.toggleLabels();
    expect(globe.showLabels).toBe(true);

    globe.toggleTimezoneLines();
    expect(globe.showTimezoneLines).toBe(true);
    globe.toggleTimezoneLines();
    expect(globe.showTimezoneLines).toBe(false);
  });

  it('handles camera altitude and zoom controls within boundaries [0.5, 5.0]', () => {
    globe.zoomIn(0.5);
    expect(globe.cameraAltitude).toBe(2.0);

    globe.zoomOut(0.5);
    expect(globe.cameraAltitude).toBe(2.5);

    // Zoom way in - clamped at 0.5
    globe.setCameraAltitude(0.1);
    expect(globe.cameraAltitude).toBe(0.5);

    // Zoom way out - clamped at 5.0
    globe.setCameraAltitude(10.0);
    expect(globe.cameraAltitude).toBe(5.0);

    globe.resetCamera();
    expect(globe.cameraAltitude).toBe(2.5);
  });

  it('switches view modes across globe, matrix, and converter', () => {
    globe.setViewMode('matrix');
    expect(globe.viewMode).toBe('matrix');

    globe.setViewMode('converter');
    expect(globe.viewMode).toBe('converter');

    globe.setViewMode('globe');
    expect(globe.viewMode).toBe('globe');
  });
});

describe('RatesState (Live Rates, Conversions, and Fallbacks)', () => {
  let rates: InstanceType<typeof RatesState>;

  beforeEach(() => {
    rates = new RatesState();
  });

  it('initializes with bundled fallback rates for 140+ currencies', () => {
    expect(Object.keys(rates.liveRates).length).toBeGreaterThanOrEqual(140);
    expect(rates.isLoading).toBe(false);
    expect(rates.error).toBeNull();
    expect(rates.lastUpdated).toBeDefined();
  });

  it('retrieves rate by currency code with case-insensitivity', () => {
    const usd = rates.getRate('usd');
    expect(usd).toBeDefined();
    expect(usd?.currencyCode).toBe('USD');
    expect(usd?.middleRate).toBe(17765);
    expect(usd?.buyRate).toBeLessThan(17765);
    expect(usd?.sellRate).toBeGreaterThan(17765);
  });

  it('provides sorted ratesList getter', () => {
    const list = rates.ratesList;
    expect(list.length).toBeGreaterThanOrEqual(140);
    expect(list[0].currencyCode.localeCompare(list[1].currencyCode)).toBeLessThanOrEqual(0);
  });

  it('converts foreign currency to IDR accurately', () => {
    const conv = rates.convert(100, 'USD', 'IDR');
    expect(conv.result).toBe(1776500);
    expect(conv.rate).toBe(17765);
    expect(conv.inverseRate).toBeCloseTo(1 / 17765, 8);
  });

  it('converts IDR to foreign currency accurately', () => {
    const conv = rates.convert(1776500, 'IDR', 'USD');
    expect(conv.result).toBe(100);
    expect(conv.rate).toBeCloseTo(1 / 17765, 8);
    expect(conv.inverseRate).toBe(17765);
  });

  it('converts between two non-IDR cross-currencies', () => {
    // 1 USD = 17765 IDR, 1 SGD = 13350 IDR
    // 100 USD = 1,776,500 IDR -> in SGD = 1,776,500 / 13,350 = ~133.071 SGD
    const conv = rates.convert(100, 'USD', 'SGD');
    expect(conv.result).toBeCloseTo(133.071, 2);
    expect(conv.rate).toBeCloseTo(17765 / 13350, 4);
  });

  it('returns identity when converting identical currency', () => {
    const conv = rates.convert(250, 'EUR', 'EUR');
    expect(conv.result).toBe(250);
    expect(conv.rate).toBe(1);
    expect(conv.inverseRate).toBe(1);
  });

  it('handles 0 and negative amounts safely', () => {
    expect(rates.convert(0, 'USD', 'IDR').result).toBe(0);
    expect(rates.convert(-50, 'USD', 'IDR').result).toBe(0);
    expect(rates.convert(NaN, 'USD', 'IDR').result).toBe(0);
  });

  it('handles fetchRates failure gracefully by populating fallback data', async () => {
    // Mock global fetch to simulate network error
    const originalFetch = globalThis.fetch;
    // @ts-ignore
    globalThis.fetch = mock(() => Promise.reject(new Error('Network offline')));

    try {
      await rates.fetchRates('IDR');
      expect(rates.isLoading).toBe(false);
      expect(rates.error).toBe('Network offline');
      // Live rates still intact from fallback
      expect(rates.getRate('USD')?.middleRate).toBe(17765);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('updates rates when fetchRates receives valid API response', async () => {
    const mockApiResponse = {
      success: true,
      timestamp: '2026-09-03T12:00:00Z',
      data: [
        {
          baseCurrency: 'USD',
          quoteCurrency: 'IDR',
          buyRate: 17800,
          sellRate: 17900,
          middleRate: 17850,
          change24h: 0.45,
          providerName: 'Bank Indonesia Live',
        },
      ],
    };

    const originalFetch = globalThis.fetch;
    // @ts-ignore
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(mockApiResponse), { status: 200 }))
    );

    try {
      await rates.fetchRates('IDR');
      expect(rates.isLoading).toBe(false);
      expect(rates.error).toBeNull();
      const updatedUsd = rates.getRate('USD');
      expect(updatedUsd?.middleRate).toBe(17850);
      expect(updatedUsd?.buyRate).toBe(17800);
      expect(updatedUsd?.sellRate).toBe(17900);
      expect(updatedUsd?.change24h).toBe(0.45);
      expect(updatedUsd?.provider).toBe('Bank Indonesia Live');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
