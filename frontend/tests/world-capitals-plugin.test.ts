import { describe, it, expect } from 'bun:test';
import { EXTENDED_COUNTRIES_DATA } from '../src/lib/framework/geoglobe/countrySpatialData';
import { geoRegistry } from '../src/lib/framework/geoglobe/appRegistry';
import { resolvePathToAppId, resolveAppIdToPath } from '../src/lib/framework/geoglobe/router';
import { isCountryMatchingAppFilter } from '../src/lib/framework/geoglobe/filterEngine';
import { 
  worldCapitalsApp, 
  type WorldCapitalData 
} from '../src/lib/framework/geoglobe/plugins/worldCapitalsApp';
import { 
  WORLD_CAPITALS_DATASET, 
  getCapitalDataForCountry 
} from '../src/lib/framework/geoglobe/data/worldCapitalsData';

describe('World Capitals & Independence History Micro-App Plugin (ADR 0039 / TDD)', () => {
  describe('1. Standardized Plugin Interface Compliance', () => {
    it('declares correct metadata and canonical/alias paths', () => {
      expect(worldCapitalsApp.id).toBe('world-capitals');
      expect(worldCapitalsApp.name).toBe('Ibukota & Kemerdekaan');
      expect(worldCapitalsApp.canonicalPath).toBe('/capitals');
      expect(worldCapitalsApp.aliasPaths).toContain('/ibukota');
      expect(worldCapitalsApp.aliasPaths).toContain('/capital');
      expect(worldCapitalsApp.aliasPaths).toContain('/independence');
      expect(worldCapitalsApp.defaultMetricId).toBe('era');
      expect(worldCapitalsApp.category).toBe('history');
      expect(worldCapitalsApp.icon).toBe('Landmark');
    });

    it('declares required metrics including era and national day month', () => {
      const metricIds = worldCapitalsApp.metrics.map(m => m.id);
      expect(metricIds).toContain('era');
      expect(metricIds).toContain('national_month');
    });

    it('declares camera presets for major geopolitical continents', () => {
      expect(worldCapitalsApp.cameraPresets).toBeDefined();
      expect(worldCapitalsApp.cameraPresets?.all).toBeDefined();
      expect(worldCapitalsApp.cameraPresets?.asean).toBeDefined();
      expect(worldCapitalsApp.cameraPresets?.asia).toBeDefined();
      expect(worldCapitalsApp.cameraPresets?.europe).toBeDefined();
      expect(worldCapitalsApp.cameraPresets?.americas).toBeDefined();
      expect(worldCapitalsApp.cameraPresets?.africa).toBeDefined();
    });
  });

  describe('2. Comprehensive 195+ Countries Dataset Integrity', () => {
    it('covers all countries in EXTENDED_COUNTRIES_DATA with zero missing records', () => {
      expect(EXTENDED_COUNTRIES_DATA.length).toBeGreaterThanOrEqual(195);

      for (const country of EXTENDED_COUNTRIES_DATA) {
        const capitalData = getCapitalDataForCountry(country.iso3);
        expect(capitalData).toBeDefined();
        expect(capitalData.capital).toBeTruthy();
        expect(capitalData.foundationDate).toBeTruthy();
        expect(capitalData.independenceDay).toBeTruthy();
        expect(capitalData.sovereigntyFrom).toBeTruthy();
        expect(capitalData.historicalEra).toBeTruthy();
      }
    });

    it('accurately verifies Indonesia (IDN) historical records', () => {
      const idn = getCapitalDataForCountry('IDN');
      expect(idn.capital).toBe('Jakarta');
      expect(idn.independenceDay).toBe('17 Agustus');
      expect(idn.foundationDate).toContain('17 Agustus 1945');
      expect(idn.sovereigntyFrom).toContain('Belanda');
      expect(idn.historicalEra).toBe('post_ww2');
    });

    it('accurately handles ancient sovereign states without conventional colonizers', () => {
      const jpn = getCapitalDataForCountry('JPN');
      expect(jpn.capital).toBe('Tokyo');
      expect(jpn.historicalEra).toBe('ancient');
      expect(jpn.sovereigntyFrom).toContain('Kuno');

      const tha = getCapitalDataForCountry('THA');
      expect(tha.capital).toBe('Bangkok');
      expect(tha.historicalEra).toBe('ancient');
    });

    it('accurately handles planned and multi-capital nations', () => {
      const bra = getCapitalDataForCountry('BRA');
      expect(bra.capital).toBe('Brasília');
      expect(bra.capitalType).toBe('Planned Capital');

      const zaf = getCapitalDataForCountry('ZAF');
      expect(zaf.capital).toContain('Pretoria');
      expect(zaf.capitalType).toBe('Dual/Triple Capital');
    });
  });

  describe('3. Dynamic Auto-Routing Integration (ADR 0038)', () => {
    it('registers into GeoAppRegistry and activates dynamic route resolution', () => {
      geoRegistry.register(worldCapitalsApp);
      const app = geoRegistry.getApp('world-capitals');
      expect(app).toBeDefined();

      expect(resolvePathToAppId('/capitals')).toBe('world-capitals');
      expect(resolvePathToAppId('/ibukota')).toBe('world-capitals');
      expect(resolvePathToAppId('/capital')).toBe('world-capitals');
      expect(resolvePathToAppId('/independence')).toBe('world-capitals');
      expect(resolveAppIdToPath('world-capitals')).toBe('/capitals');
    });
  });

  describe('4. WebGL Visual Delegation Hooks', () => {
    it('generates distinct theme-aware polygon colors based on historical era', () => {
      const idnSpatial = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getCapitalDataForCountry('IDN');

      const darkColor = worldCapitalsApp.getPolygonColor!(
        idnSpatial,
        idnData,
        'era',
        'dark',
        { isMatched: true }
      );
      expect(darkColor).toMatch(/^rgba?\(/);

      const lightColor = worldCapitalsApp.getPolygonColor!(
        idnSpatial,
        idnData,
        'era',
        'light',
        { isMatched: true }
      );
      expect(lightColor).toMatch(/^rgba?\(/);
      expect(darkColor).not.toBe(lightColor);
    });

    it('generates rich tooltip HTML with flag, capital, independence day, and foundation date', () => {
      const idnSpatial = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getCapitalDataForCountry('IDN');

      const tooltip = worldCapitalsApp.getTooltipHtml!(
        idnSpatial,
        idnData,
        'era',
        'dark'
      );

      expect(tooltip).toContain('Jakarta');
      expect(tooltip).toContain('17 Agustus');
      expect(tooltip).toContain('1945');
      expect(tooltip).toContain('Indonesia');
      expect(tooltip).toContain('Belanda');
    });

    it('generates 3D landmark pin labels with capital city name', () => {
      const idnSpatial = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getCapitalDataForCountry('IDN');

      const pin = worldCapitalsApp.getPinLabel!(idnSpatial, idnData, 'era');
      expect(pin.text).toContain('Jakarta');
      expect(pin.text).toContain('Indonesia'); // emoji 🏛️ removed — renders as ?? on WebGL canvas
    });
  });

  describe('5. Dynamic Filtering Predicate', () => {
    it('filters countries accurately by historical era', () => {
      // Ancient
      expect(worldCapitalsApp.filterPredicate!('JPN', 'ancient', getCapitalDataForCountry('JPN'))).toBe(true);
      expect(worldCapitalsApp.filterPredicate!('IDN', 'ancient', getCapitalDataForCountry('IDN'))).toBe(false);

      // Post-WW2 (1945-1959)
      expect(worldCapitalsApp.filterPredicate!('IDN', 'post_ww2', getCapitalDataForCountry('IDN'))).toBe(true);
      expect(worldCapitalsApp.filterPredicate!('USA', 'post_ww2', getCapitalDataForCountry('USA'))).toBe(false);

      // Decolonization era (1960-1989)
      expect(worldCapitalsApp.filterPredicate!('NGA', 'decolonization', getCapitalDataForCountry('NGA'))).toBe(true);

      // Post-1990 (Post-Soviet / Modern)
      expect(worldCapitalsApp.filterPredicate!('KAZ', 'post_1990', getCapitalDataForCountry('KAZ'))).toBe(true);
    });

    it('integrates seamlessly with filterEngine isCountryMatchingAppFilter', async () => {
      const data = await worldCapitalsApp.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      geoRegistry.setAppData('world-capitals', data);

      const isIdnPostWw2 = isCountryMatchingAppFilter('IDN', 'world-capitals', {
        customFilter: 'post_ww2',
        appData: data,
      });
      expect(isIdnPostWw2).toBe(true);

      const isJpnPostWw2 = isCountryMatchingAppFilter('JPN', 'world-capitals', {
        customFilter: 'post_ww2',
        appData: data,
      });
      expect(isJpnPostWw2).toBe(false);
    });
  });

  describe('6. Inspector Drawer Widget', () => {
    it('renders a comprehensive historic profile widget for selected country', () => {
      const idnSpatial = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getCapitalDataForCountry('IDN');

      const widget = worldCapitalsApp.renderInspector!(idnSpatial, idnData);
      expect(widget.title).toContain('Indonesia');
      expect(widget.primaryValue).toBe('Jakarta');
      expect(widget.subtitle).toContain('17 Agustus');
      expect(widget.statsGrid?.length).toBeGreaterThanOrEqual(4);
    });
  });
});
