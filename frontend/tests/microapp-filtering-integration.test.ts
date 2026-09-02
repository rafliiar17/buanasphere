import { describe, it, expect } from 'bun:test';
import {
  isCountryMatchingTimeFilter,
  isCountryMatchingFlightFilter,
  isCountryMatchingPassportFilter,
  isCountryMatchingAppFilter,
} from '../src/lib/framework/geoglobe/filterEngine';
import { EXTENDED_COUNTRIES_DATA } from '../src/lib/framework/geoglobe/countrySpatialData';

describe('Micro-App 2-Way Filtering Integration Suite (ADR 0031 / TDD)', () => {
  describe('1. TimeWorld Filtering Integration', () => {
    it('filters countries by daylight vs night', () => {
      const fixedDate = new Date('2026-09-02T12:00:00.000Z'); // 12:00 UTC = 19:00 WIB (night) & 08:00 NY (day)
      
      const isNyDay = isCountryMatchingTimeFilter('USA', 'daylight', fixedDate);
      expect(isNyDay).toBe(true);

      const isJktNight = isCountryMatchingTimeFilter('IDN', 'night', fixedDate);
      expect(isJktNight).toBe(true);
    });

    it('filters countries by active business office hours (09:00 - 17:00)', () => {
      const fixedDate = new Date('2026-09-02T12:00:00.000Z');
      
      const workingCountries = EXTENDED_COUNTRIES_DATA.filter((c) =>
        isCountryMatchingTimeFilter(c.iso3, 'working', fixedDate)
      );
      expect(workingCountries.length).toBeGreaterThan(0);
      expect(workingCountries.length).toBeLessThan(EXTENDED_COUNTRIES_DATA.length);
    });
  });

  describe('2. Flow Corridors 3D Arcs & Region Filtering', () => {
    it('filters remittance hubs and 3D arcs by regional corridors', () => {
      expect(isCountryMatchingFlightFilter('SAU', 'mideast')).toBe(true);
      expect(isCountryMatchingFlightFilter('ARE', 'mideast')).toBe(true);
      expect(isCountryMatchingFlightFilter('IDN', 'mideast')).toBe(true);
      expect(isCountryMatchingFlightFilter('USA', 'mideast')).toBe(false);
      expect(isCountryMatchingFlightFilter('JPN', 'mideast')).toBe(false);

      expect(isCountryMatchingFlightFilter('MYS', 'asean')).toBe(true);
      expect(isCountryMatchingFlightFilter('SGP', 'asean')).toBe(true);
      expect(isCountryMatchingFlightFilter('SAU', 'asean')).toBe(false);

      expect(isCountryMatchingFlightFilter('TWN', 'eastasia')).toBe(true);
      expect(isCountryMatchingFlightFilter('HKG', 'eastasia')).toBe(true);
      expect(isCountryMatchingFlightFilter('JPN', 'eastasia')).toBe(true);
      expect(isCountryMatchingFlightFilter('MYS', 'eastasia')).toBe(false);
    });
  });

  describe('3. Passport World Visa Requirement Filtering', () => {
    it('filters destinations based on Indonesian passport entry requirements', () => {
      expect(isCountryMatchingPassportFilter('SGP', 'free')).toBe(true); // Singapore: Visa Free
      expect(isCountryMatchingPassportFilter('MYS', 'free')).toBe(true); // Malaysia: Visa Free
      expect(isCountryMatchingPassportFilter('USA', 'free')).toBe(false); // USA: Visa Required
      expect(isCountryMatchingPassportFilter('GBR', 'free')).toBe(false); // UK: Visa Required

      expect(isCountryMatchingPassportFilter('USA', 'required')).toBe(true);
      expect(isCountryMatchingPassportFilter('GBR', 'required')).toBe(true);
      expect(isCountryMatchingPassportFilter('SGP', 'required')).toBe(false);

      expect(isCountryMatchingPassportFilter('IND', 'voa')).toBe(true); // India: VoA
      expect(isCountryMatchingPassportFilter('SAU', 'voa')).toBe(true); // Saudi: eVisa
      expect(isCountryMatchingPassportFilter('SGP', 'voa')).toBe(false);
    });
  });

  describe('4. Universal Matcher via isCountryMatchingAppFilter', () => {
    it('routes filter evaluation appropriately by appId', () => {
      expect(isCountryMatchingAppFilter('SGP', 'passport-power', { passportFilter: 'free' })).toBe(true);
      expect(isCountryMatchingAppFilter('USA', 'passport-power', { passportFilter: 'free' })).toBe(false);

      expect(isCountryMatchingAppFilter('SAU', 'remittance-flow', { flightFilter: 'mideast' })).toBe(true);
      expect(isCountryMatchingAppFilter('MYS', 'remittance-flow', { flightFilter: 'mideast' })).toBe(false);
    });
  });
});
