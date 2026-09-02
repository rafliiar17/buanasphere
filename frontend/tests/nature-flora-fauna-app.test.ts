import { describe, it, expect } from 'bun:test';
import { 
  resolvePathToAppId, 
  resolveAppIdToPath, 
  APP_PATH_MAP, 
  CANONICAL_APP_PATHS 
} from '../src/lib/framework/geoglobe/router';
import { floraFaunaApp } from '../src/lib/framework/geoglobe/plugins/floraFaunaApp';
import { 
  FLORA_FAUNA_DATASET, 
  MEGADIVERSE_ISO3_LIST, 
  getFloraFaunaDataForCountry 
} from '../src/lib/framework/geoglobe/data/floraFaunaData';
import { 
  isCountryMatchingNatureFilter,
  isCountryMatchingAppFilter,
  type NatureFilterType
} from '../src/lib/framework/geoglobe/filterEngine';
import { EXTENDED_COUNTRIES_DATA } from '../src/lib/framework/geoglobe/countrySpatialData';

describe('Nature World (/nature & /flora-fauna) Micro-App Suite (ADR 0034 / TDD)', () => {
  
  describe('1. Routing & URL Resolution', () => {
    it('resolves canonical path "/nature" to "flora-fauna"', () => {
      expect(resolvePathToAppId('/nature')).toBe('flora-fauna');
    });

    it('resolves path aliases ("/flora-fauna", "/flora", "/fauna", "/wildlife") to "flora-fauna"', () => {
      expect(resolvePathToAppId('/flora-fauna')).toBe('flora-fauna');
      expect(resolvePathToAppId('/flora')).toBe('flora-fauna');
      expect(resolvePathToAppId('/fauna')).toBe('flora-fauna');
      expect(resolvePathToAppId('/wildlife')).toBe('flora-fauna');
    });

    it('resolves trailing slash paths gracefully (e.g. "/nature/")', () => {
      expect(resolvePathToAppId('/nature/')).toBe('flora-fauna');
      expect(resolvePathToAppId('/flora-fauna/')).toBe('flora-fauna');
    });

    it('maps "flora-fauna" app ID to canonical URL path "/nature"', () => {
      expect(resolveAppIdToPath('flora-fauna')).toBe('/nature');
    });

    it('contains all required path mappings in APP_PATH_MAP and CANONICAL_APP_PATHS', () => {
      expect(APP_PATH_MAP['/nature']).toBe('flora-fauna');
      expect(APP_PATH_MAP['/flora-fauna']).toBe('flora-fauna');
      expect(CANONICAL_APP_PATHS['flora-fauna']).toBe('/nature');
    });
  });

  describe('2. Biodiversity Dataset Integrity (FLORA_FAUNA_DATASET)', () => {
    it('provides rich biodiversity dataset for all spatial countries', () => {
      expect(EXTENDED_COUNTRIES_DATA.length).toBeGreaterThanOrEqual(180);
      for (const country of EXTENDED_COUNTRIES_DATA) {
        const data = getFloraFaunaDataForCountry(country.iso3);
        expect(data).toBeDefined();
        expect(data.animal.commonName).toBeTruthy();
        expect(data.animal.scientificName).toBeTruthy();
        expect(data.animal.emoji).toBeTruthy();
        expect(data.animal.iucnStatus).toBeDefined();
        expect(data.plant.commonName).toBeTruthy();
        expect(data.plant.scientificName).toBeTruthy();
        expect(data.primaryBiome).toBeTruthy();
        expect(data.biodiversityScore).toBeGreaterThanOrEqual(0);
        expect(data.biodiversityScore).toBeLessThanOrEqual(100);
      }
    });

    it('accurately specifies Indonesia (IDN) as a top Megadiverse nation with Komodo & Rafflesia', () => {
      const idn = getFloraFaunaDataForCountry('IDN');
      expect(idn.isMegadiverse).toBe(true);
      expect(idn.globalBiodiversityRank).toBe(3);
      expect(idn.animal.commonName).toContain('Komodo');
      expect(idn.animal.scientificName).toContain('Varanus komodoensis');
      expect(idn.plant.commonName).toContain('Rafflesia');
      expect(idn.primaryBiome).toBe('Tropical Rainforest');
      expect(idn.conservationHotspot).toBe(true);
    });

    it('accurately specifies Brazil (BRA) as #1 Megadiverse nation with Jaguar', () => {
      const bra = getFloraFaunaDataForCountry('BRA');
      expect(bra.isMegadiverse).toBe(true);
      expect(bra.globalBiodiversityRank).toBe(1);
      expect(bra.animal.commonName).toContain('Jaguar');
      expect(bra.primaryBiome).toBe('Tropical Rainforest');
    });

    it('accurately specifies Madagascar (MDG) with high endemism and Lemurs', () => {
      const mdg = getFloraFaunaDataForCountry('MDG');
      expect(mdg.animal.commonName).toContain('Lemur');
      expect(mdg.plant.commonName).toContain('Baobab');
      expect(mdg.conservationHotspot).toBe(true);
      expect(mdg.endemicSpeciesHighlights.length).toBeGreaterThan(0);
    });

    it('contains all 17 recognized Megadiverse countries in MEGADIVERSE_ISO3_LIST', () => {
      expect(MEGADIVERSE_ISO3_LIST).toContain('IDN');
      expect(MEGADIVERSE_ISO3_LIST).toContain('BRA');
      expect(MEGADIVERSE_ISO3_LIST).toContain('COL');
      expect(MEGADIVERSE_ISO3_LIST).toContain('CHN');
      expect(MEGADIVERSE_ISO3_LIST).toContain('AUS');
      expect(MEGADIVERSE_ISO3_LIST).toContain('PER');
      expect(MEGADIVERSE_ISO3_LIST).toContain('MEX');
      expect(MEGADIVERSE_ISO3_LIST).toContain('IND');
      expect(MEGADIVERSE_ISO3_LIST).toContain('MDG');
      expect(MEGADIVERSE_ISO3_LIST).toContain('ZAF');
      expect(MEGADIVERSE_ISO3_LIST).toContain('COD');
      expect(MEGADIVERSE_ISO3_LIST).toContain('MYS');
      expect(MEGADIVERSE_ISO3_LIST).toContain('PHL');
      expect(MEGADIVERSE_ISO3_LIST.length).toBeGreaterThanOrEqual(17);
    });
  });

  describe('3. Pluggable GeoGlobe Plugin Architecture (floraFaunaApp)', () => {
    it('conforms to GeoAppPlugin interface and registers with id "flora-fauna"', () => {
      expect(floraFaunaApp.id).toBe('flora-fauna');
      expect(floraFaunaApp.name).toBe('Nature World');
      expect(floraFaunaApp.defaultMetricId).toBe('biodiversity');
      expect(floraFaunaApp.metrics.length).toBeGreaterThanOrEqual(2);
    });

    it('loads application data via dataLoader() hook for all countries', async () => {
      const dataMap = await floraFaunaApp.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      expect(Object.keys(dataMap).length).toBe(EXTENDED_COUNTRIES_DATA.length);
      expect(dataMap['IDN']).toBeDefined();
      expect(dataMap['USA']).toBeDefined();
      expect(dataMap['JPN']).toBeDefined();
    });

    it('renders rich Universal Inspector Widget with animal, plant, and IUCN badge', () => {
      const idnCountry = EXTENDED_COUNTRIES_DATA.find(c => c.iso3 === 'IDN')!;
      const idnData = getFloraFaunaDataForCountry('IDN');
      const widget = floraFaunaApp.renderInspector!(idnCountry as any, idnData, {});

      expect(widget).toBeDefined();
      expect(widget.type).toBe('stats');
      expect(widget.title).toContain('Indonesia');
      expect(widget.primaryValue).toContain('Komodo');
      expect(widget.badge).toBeDefined();
      expect(widget.badge?.text).toContain('Megadiverse');
      expect(widget.statsGrid?.length).toBeGreaterThanOrEqual(4);
      expect(widget.statsGrid?.some(s => s.label.includes('Satwa Ikonik'))).toBe(true);
      expect(widget.statsGrid?.some(s => s.label.includes('Bunga / Flora'))).toBe(true);
    });
  });

  describe('4. 2-Way Reactive Nature Filtering (filterEngine.ts)', () => {
    it('filters countries by "all" filter (matches any country)', () => {
      expect(isCountryMatchingNatureFilter('IDN', 'all')).toBe(true);
      expect(isCountryMatchingNatureFilter('SGP', 'all')).toBe(true);
      expect(isCountryMatchingNatureFilter('ISL', 'all')).toBe(true);
    });

    it('filters countries by "megadiverse" category', () => {
      expect(isCountryMatchingNatureFilter('IDN', 'megadiverse')).toBe(true);
      expect(isCountryMatchingNatureFilter('BRA', 'megadiverse')).toBe(true);
      expect(isCountryMatchingNatureFilter('AUS', 'megadiverse')).toBe(true);
      expect(isCountryMatchingNatureFilter('SGP', 'megadiverse')).toBe(false);
      expect(isCountryMatchingNatureFilter('CHE', 'megadiverse')).toBe(false);
    });

    it('filters countries by "endangered" IUCN risk category', () => {
      expect(isCountryMatchingNatureFilter('IDN', 'endangered')).toBe(true);
      expect(isCountryMatchingNatureFilter('MDG', 'endangered')).toBe(true);
    });

    it('filters countries by "rainforest" tropical biome category', () => {
      expect(isCountryMatchingNatureFilter('IDN', 'rainforest')).toBe(true);
      expect(isCountryMatchingNatureFilter('BRA', 'rainforest')).toBe(true);
      expect(isCountryMatchingNatureFilter('COD', 'rainforest')).toBe(true);
      expect(isCountryMatchingNatureFilter('EGY', 'rainforest')).toBe(false);
      expect(isCountryMatchingNatureFilter('ISL', 'rainforest')).toBe(false);
    });

    it('filters countries by "endemic" species category', () => {
      expect(isCountryMatchingNatureFilter('MDG', 'endemic')).toBe(true);
      expect(isCountryMatchingNatureFilter('AUS', 'endemic')).toBe(true);
      expect(isCountryMatchingNatureFilter('IDN', 'endemic')).toBe(true);
    });

    it('integrates with universal matcher isCountryMatchingAppFilter for "flora-fauna"', () => {
      expect(
        isCountryMatchingAppFilter('IDN', 'flora-fauna', { natureFilter: 'megadiverse' })
      ).toBe(true);

      expect(
        isCountryMatchingAppFilter('SGP', 'flora-fauna', { natureFilter: 'megadiverse' })
      ).toBe(false);
    });
  });
});
