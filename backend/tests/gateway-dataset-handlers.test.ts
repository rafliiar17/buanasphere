import { describe, it, expect } from 'bun:test';
import { timeHandler, calculateSubsolarPoint } from '../src/gateway/handlers/timeHandler.ts';
import { passportHandler } from '../src/gateway/handlers/passportHandler.ts';
import { flightHandler } from '../src/gateway/handlers/flightHandler.ts';
import { natureHandler } from '../src/gateway/handlers/natureHandler.ts';
import { capitalsHandler } from '../src/gateway/handlers/capitalsHandler.ts';
import {
  registerAllMicroappHandlers,
  MicroappRegistry,
  defaultGatewayRegistry,
  quakeHandler,
  populationHandler,
} from '../src/gateway/index.ts';

describe('Microapp Dataset Handlers Suite (ADR 0074 / TDD)', () => {
  describe('1. timeHandler (World Time & Solar Position)', () => {
    it('has expected metadata and TTL', () => {
      expect(timeHandler.id).toBe('time');
      expect(timeHandler.name).toBe('World Time & Solar Position');
      expect(timeHandler.cacheTtlSeconds).toBe(10);
      expect(typeof timeHandler.handle).toBe('function');
    });

    it('returns valid live server UTC time, timestamp, and solar coordinates', async () => {
      const result = await timeHandler.handle({});

      expect(result).toBeDefined();
      expect(typeof result.utc).toBe('string');
      expect(new Date(result.utc).toISOString()).toBe(result.utc);
      expect(typeof result.unixTimestampMs).toBe('number');
      expect(result.unixTimestampMs).toBeGreaterThan(1700000000000);
      expect(typeof result.unixTimestampSec).toBe('number');

      // Solar coordinates
      expect(result.subsolarPoint).toBeDefined();
      expect(typeof result.subsolarPoint.latitude).toBe('number');
      expect(typeof result.subsolarPoint.longitude).toBe('number');
      // Subsolar latitude (solar declination) must be within Earth axial tilt [-23.45, 23.45]
      expect(result.subsolarPoint.latitude).toBeGreaterThanOrEqual(-24);
      expect(result.subsolarPoint.latitude).toBeLessThanOrEqual(24);
      // Longitude between -180 and 180
      expect(result.subsolarPoint.longitude).toBeGreaterThanOrEqual(-180);
      expect(result.subsolarPoint.longitude).toBeLessThanOrEqual(180);

      // Timezone offsets helper map
      expect(result.timezoneOffsets).toBeDefined();
      expect(result.timezoneOffsets['WIB']).toBe(7);
      expect(result.timezoneOffsets['UTC']).toBe(0);
      expect(result.timezoneOffsets['JST']).toBe(9);
    });

    it('calculates deterministic solar subsolar point for fixed dates', () => {
      // Near Northern Summer Solstice (June 21, 12:00 UTC)
      // Longitude should be near 0 degrees, Latitude near +23.4 degrees
      const solsticeDate = new Date('2026-06-21T12:00:00Z');
      const point = calculateSubsolarPoint(solsticeDate);

      expect(point.latitude).toBeGreaterThan(22);
      expect(point.latitude).toBeLessThan(24);
      expect(Math.abs(point.longitude)).toBeLessThan(15);

      // Equinox (March 21, 12:00 UTC)
      // Latitude should be near 0 degrees
      const equinoxDate = new Date('2026-03-21T12:00:00Z');
      const equinoxPoint = calculateSubsolarPoint(equinoxDate);
      expect(Math.abs(equinoxPoint.latitude)).toBeLessThan(3);
    });
  });

  describe('2. passportHandler (Passport Power Index)', () => {
    it('has expected metadata and TTL', () => {
      expect(passportHandler.id).toBe('passport');
      expect(passportHandler.name).toBe('Passport Power Index');
      expect(passportHandler.cacheTtlSeconds).toBe(86400);
    });

    it('returns list of passport mobility ranking scores and statistics', async () => {
      const result = await passportHandler.handle({});

      expect(result).toBeDefined();
      expect(Array.isArray(result.rankings)).toBe(true);
      expect(result.rankings.length).toBeGreaterThanOrEqual(15);
      expect(result.totalRanked).toBeGreaterThanOrEqual(15);

      // Check ranking order
      const first = result.rankings[0];
      expect(first.rank).toBe(1);
      expect(first.visaFree).toBeGreaterThanOrEqual(190);
      expect(first.iso3).toBeDefined();
    });

    it('filters passport mobility details by ISO-3', async () => {
      // Test Singapore (top ranked)
      const sgp = await passportHandler.handle({ iso3: 'SGP' });
      expect(sgp).toBeDefined();
      expect(sgp.iso3).toBe('SGP');
      expect(sgp.rank).toBe(1);
      expect(sgp.visaFree).toBe(195);
      expect(sgp.indoRequirement).toBe('Visa Free');

      // Test Indonesia
      const idn = await passportHandler.handle({ iso3: 'IDN' });
      expect(idn).toBeDefined();
      expect(idn.iso3).toBe('IDN');
      expect(idn.visaFree).toBe(78);
      expect(idn.rank).toBe(68);

      // Test Japan
      const jpn = await passportHandler.handle({ country: 'jpn' }); // case insensitive
      expect(jpn.iso3).toBe('JPN');
      expect(jpn.rank).toBe(2);
    });

    it('handles non-existent country ISO-3 gracefully', async () => {
      const unknown = await passportHandler.handle({ iso3: 'XYZ' });
      expect(unknown.error || unknown.found === false).toBeTruthy();
    });
  });

  describe('3. flightHandler (Global Flight & Remittance Corridors)', () => {
    it('has expected metadata and TTL', () => {
      expect(flightHandler.id).toBe('flight');
      expect(flightHandler.name).toBe('Global Flight & Remittance Corridors');
      expect(flightHandler.cacheTtlSeconds).toBe(86400);
    });

    it('returns top international flight corridors with origin-destination coordinates', async () => {
      const result = await flightHandler.handle({});

      expect(result).toBeDefined();
      expect(Array.isArray(result.corridors)).toBe(true);
      expect(result.corridors.length).toBeGreaterThanOrEqual(10);
      expect(result.destination).toBeDefined();
      expect(result.destination.iso3).toBe('IDN');
      expect(result.destination.capital).toBe('Jakarta');
      expect(result.destination.lat).toBeCloseTo(-6.2088, 2);
      expect(result.destination.lng).toBeCloseTo(106.8456, 2);

      const corridor = result.corridors[0];
      expect(corridor.originIso3).toBeDefined();
      expect(typeof corridor.originCoordinates.lat).toBe('number');
      expect(typeof corridor.originCoordinates.lng).toBe('number');
      expect(typeof corridor.remittanceVolumeMillionUsd).toBe('number');
      expect(typeof corridor.passengerVolumeEstimate).toBe('number');
      expect(typeof corridor.distanceKm).toBe('number');
      expect(corridor.distanceKm).toBeGreaterThan(0);
    });

    it('filters corridors by region or minimum volume', async () => {
      // ASEAN corridors
      const asean = await flightHandler.handle({ region: 'asean' });
      expect(Array.isArray(asean.corridors)).toBe(true);
      expect(asean.corridors.every((c: any) => c.region === 'asean')).toBe(true);

      // Middle East corridors
      const mideast = await flightHandler.handle({ region: 'mideast' });
      expect(mideast.corridors.some((c: any) => c.originIso3 === 'SAU')).toBe(true);

      // Min volume filter
      const highVolume = await flightHandler.handle({ minVolume: 2000 });
      expect(highVolume.corridors.every((c: any) => c.remittanceVolumeMillionUsd >= 2000)).toBe(true);
    });
  });

  describe('4. natureHandler (Flora & Fauna National Emblems)', () => {
    it('has expected metadata and TTL', () => {
      expect(natureHandler.id).toBe('nature');
      expect(natureHandler.name).toBe('Flora & Fauna National Emblems');
      expect(natureHandler.cacheTtlSeconds).toBe(86400);
    });

    it('returns emblems for IDN, USA, JPN, etc.', async () => {
      // Indonesia (Komodo Dragon, Rafflesia)
      const idn = await natureHandler.handle({ iso3: 'IDN' });
      expect(idn).toBeDefined();
      expect(idn.iso3).toBe('IDN');
      expect(idn.nationalAnimal).toBeDefined();
      expect(idn.nationalAnimal.commonName).toContain('Komodo Dragon');
      expect(idn.nationalFlower).toBeDefined();
      expect(idn.nationalFlower.commonName).toContain('Rafflesia');
      expect(idn.conservationStatus).toBeDefined();

      // USA (Bald Eagle / American Bison)
      const usa = await natureHandler.handle({ iso3: 'USA' });
      expect(usa).toBeDefined();
      expect(usa.iso3).toBe('USA');
      expect(usa.nationalAnimal).toBeDefined();
      expect(usa.nationalAnimal.commonName.length).toBeGreaterThan(0);
      expect(usa.nationalFlower).toBeDefined();

      // Japan (Green Pheasant / Cherry Blossom / Macaque)
      const jpn = await natureHandler.handle({ iso3: 'JPN' });
      expect(jpn).toBeDefined();
      expect(jpn.iso3).toBe('JPN');
      expect(jpn.nationalAnimal).toBeDefined();
      expect(jpn.nationalFlower).toBeDefined();
    });

    it('returns full catalog when no iso3 is specified', async () => {
      const full = await natureHandler.handle({});
      expect(full).toBeDefined();
      expect(Array.isArray(full.countries)).toBe(true);
      expect(full.totalCountries).toBeGreaterThanOrEqual(20);
      expect(full.countries.some((c: any) => c.iso3 === 'IDN')).toBe(true);
    });
  });

  describe('5. capitalsHandler (World Capitals & National Anthems)', () => {
    it('has expected metadata and TTL', () => {
      expect(capitalsHandler.id).toBe('capitals');
      expect(capitalsHandler.name).toBe('World Capitals & National Anthems');
      expect(capitalsHandler.cacheTtlSeconds).toBe(86400);
    });

    it('returns capital and anthem for a country', async () => {
      // Indonesia
      const idn = await capitalsHandler.handle({ iso3: 'IDN' });
      expect(idn).toBeDefined();
      expect(idn.iso3).toBe('IDN');
      expect(idn.capital).toBe('Jakarta');
      expect(idn.coordinates.lat).toBeCloseTo(-6.2088, 2);
      expect(idn.coordinates.lng).toBeCloseTo(106.8456, 2);
      expect(typeof idn.elevationMeters).toBe('number');
      expect(idn.nationalAnthem).toBeDefined();
      expect(idn.nationalAnthem.title).toBe('Indonesia Raya');
      expect(idn.nationalAnthem.composer).toBe('Wage Rudolf Supratman');
      expect(idn.nationalAnthem.audioUrl).toBeDefined();

      // Japan
      const jpn = await capitalsHandler.handle({ iso3: 'JPN' });
      expect(jpn.capital).toBe('Tokyo');
      expect(jpn.nationalAnthem).toBeDefined();
      expect(jpn.nationalAnthem.title).toBe('Kimigayo');

      // USA
      const usa = await capitalsHandler.handle({ iso3: 'USA' });
      expect(usa.capital).toBe('Washington, D.C.');
      expect(usa.nationalAnthem.title).toBe('The Star-Spangled Banner');
    });

    it('returns full list of capitals when no iso3 is given', async () => {
      const all = await capitalsHandler.handle({});
      expect(all).toBeDefined();
      expect(Array.isArray(all.capitals)).toBe(true);
      expect(all.totalCapitals).toBeGreaterThanOrEqual(190);
    });
  });

  describe('6. registerAllMicroappHandlers and gateway index', () => {
    it('registers all 7 microapp handlers into registry', () => {
      const customRegistry = new MicroappRegistry();
      registerAllMicroappHandlers(customRegistry);

      const handlers = customRegistry.getAll();
      expect(handlers.length).toBe(7);

      const ids = handlers.map((h) => h.id);
      expect(ids).toContain('quake');
      expect(ids).toContain('population');
      expect(ids).toContain('time');
      expect(ids).toContain('passport');
      expect(ids).toContain('flight');
      expect(ids).toContain('nature');
      expect(ids).toContain('capitals');

      // Verify defaultGatewayRegistry also contains all handlers
      const defaultCatalog = defaultGatewayRegistry.getCatalog();
      expect(defaultCatalog.length).toBeGreaterThanOrEqual(7);
      const catalogIds = defaultCatalog.map((c) => c.id);
      expect(catalogIds).toContain('time');
      expect(catalogIds).toContain('passport');
      expect(catalogIds).toContain('flight');
      expect(catalogIds).toContain('nature');
      expect(catalogIds).toContain('capitals');
    });
  });
});
