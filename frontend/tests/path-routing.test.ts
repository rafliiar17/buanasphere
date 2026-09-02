import { describe, it, expect } from 'bun:test';
import {
  resolvePathToAppId,
  resolveAppIdToPath,
  APP_PATH_MAP,
} from '../src/lib/framework/geoglobe/router';

describe('GeoGlobe Path-Based Micro-App Routing Unit Tests (ADR 0028 / TDD)', () => {
  describe('1. Path to App ID Resolution', () => {
    it('resolves root path "/" to "fx-rates" (Kurs World)', () => {
      expect(resolvePathToAppId('/')).toBe('fx-rates');
      expect(resolvePathToAppId('')).toBe('fx-rates');
    });

    it('resolves "/kurs" to "fx-rates"', () => {
      expect(resolvePathToAppId('/kurs')).toBe('fx-rates');
      expect(resolvePathToAppId('/kurs/')).toBe('fx-rates');
    });

    it('resolves "/time" to "world-time" (TimeWorld)', () => {
      expect(resolvePathToAppId('/time')).toBe('world-time');
      expect(resolvePathToAppId('/time/')).toBe('world-time');
    });

    it('resolves "/flight" and "/flow" to "remittance-flow" (Flow Corridors)', () => {
      expect(resolvePathToAppId('/flight')).toBe('remittance-flow');
      expect(resolvePathToAppId('/flight/')).toBe('remittance-flow');
      expect(resolvePathToAppId('/flow')).toBe('remittance-flow');
    });

    it('resolves "/passport" to "passport-power" (Passport World)', () => {
      expect(resolvePathToAppId('/passport')).toBe('passport-power');
      expect(resolvePathToAppId('/passport/')).toBe('passport-power');
    });

    it('falls back gracefully to "fx-rates" for unknown or unmatched paths', () => {
      expect(resolvePathToAppId('/unknown-route')).toBe('fx-rates');
      expect(resolvePathToAppId('/xyz123')).toBe('fx-rates');
    });
  });

  describe('2. App ID to Canonical Path Resolution', () => {
    it('maps "fx-rates" to canonical path "/kurs"', () => {
      expect(resolveAppIdToPath('fx-rates')).toBe('/kurs');
    });

    it('maps "world-time" to canonical path "/time"', () => {
      expect(resolveAppIdToPath('world-time')).toBe('/time');
    });

    it('maps "remittance-flow" to canonical path "/flight"', () => {
      expect(resolveAppIdToPath('remittance-flow')).toBe('/flight');
    });

    it('maps "passport-power" to canonical path "/passport"', () => {
      expect(resolveAppIdToPath('passport-power')).toBe('/passport');
    });

    it('defaults to "/kurs" for unknown app ID', () => {
      expect(resolveAppIdToPath('unknown-app')).toBe('/kurs');
    });
  });

  describe('3. Route Mapping Table Integrity', () => {
    it('contains all required route aliases', () => {
      expect(APP_PATH_MAP['/']).toBe('fx-rates');
      expect(APP_PATH_MAP['/kurs']).toBe('fx-rates');
      expect(APP_PATH_MAP['/time']).toBe('world-time');
      expect(APP_PATH_MAP['/flight']).toBe('remittance-flow');
      expect(APP_PATH_MAP['/flow']).toBe('remittance-flow');
      expect(APP_PATH_MAP['/passport']).toBe('passport-power');
    });
  });
});
