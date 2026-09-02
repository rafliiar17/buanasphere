import { describe, it, expect } from 'bun:test';
import { fxRatesApp } from '../src/lib/framework/geoglobe/plugins/fxRatesApp';
import { worldTimeApp } from '../src/lib/framework/geoglobe/plugins/worldTimeApp';
import { flowCorridorsApp } from '../src/lib/framework/geoglobe/plugins/flowCorridorsApp';
import { passportWorldApp } from '../src/lib/framework/geoglobe/plugins/passportWorldApp';
import { EXTENDED_COUNTRIES_DATA } from '../src/lib/framework/geoglobe/countrySpatialData';

describe('Isolated Micro-App Modules & Control State Suite (ADR 0030 / TDD)', () => {
  const indonesia = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'IDN')!;
  const japan = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'JPN')!;
  const saudi = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'SAU')!;
  const singapore = EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === 'SGP')!;

  describe('1. Kurs World Module (fx-rates)', () => {
    it('provides isolated spot rate & conversion metrics', async () => {
      const data = await fxRatesApp.dataLoader([japan, indonesia] as any);
      expect(data['JPN']).toBeDefined();
      expect(data['JPN'].rateToIdr).toBeGreaterThan(0);
      expect(data['JPN'].formattedRate).toContain('Rp');

      const inspector = fxRatesApp.renderInspector?.(japan as any, data['JPN'], data);
      expect(inspector?.type).toBe('fx_calculator');
      expect(inspector?.statsGrid?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('2. TimeWorld Module (world-time)', () => {
    it('calculates isolated solar time, daylight, and WIB difference without FX data', async () => {
      const data = await worldTimeApp.dataLoader([japan, indonesia, saudi] as any);
      
      expect(data['JPN'].utcOffset).toBe(9);
      expect(data['JPN'].differenceFromWibHours).toBe(2); // Tokyo UTC+9 vs Jakarta UTC+7 (+2 Jam)
      expect(data['SAU'].utcOffset).toBe(3);
      expect(data['SAU'].differenceFromWibHours).toBe(-4); // Riyadh UTC+3 vs Jakarta UTC+7 (-4 Jam)
      expect(data['IDN'].differenceFromWibHours).toBe(0);

      const inspector = worldTimeApp.renderInspector?.(japan as any, data['JPN'], data);
      expect(inspector?.type).toBe('clock');
      expect(inspector?.badge?.text).toMatch(/Dini Hari|Fajar|Pagi|Siang|Sore|Senja|Petang|Malam/);
    });

    it('filters countries currently in active business office hours (09:00 - 17:00)', async () => {
      const data = await worldTimeApp.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      const workingCountries = Object.entries(data).filter(([_, val]) => val.isWorkingHours);
      expect(workingCountries.length).toBeGreaterThan(0);
    });
  });

  describe('3. Flow Corridors Module (remittance-flow)', () => {
    it('generates 3D remittance flight corridors specifically terminating in Indonesia', async () => {
      const data = await flowCorridorsApp.dataLoader(EXTENDED_COUNTRIES_DATA as any);
      expect(data['SAU'].annualVolumeMillionUsd).toBe(3200);
      expect(data['MYS'].migrantWorkersCount).toBe(1400000);

      const arcs = flowCorridorsApp.getArcData ? flowCorridorsApp.getArcData(indonesia as any, data) : [];
      expect(arcs.length).toBeGreaterThanOrEqual(5);

      for (const arc of arcs) {
        expect(arc.endLat).toBe(indonesia.lat);
        expect(arc.endLng).toBe(indonesia.lng);
        expect(arc.altitude).toBeGreaterThan(0.2);
      }
    });
  });

  describe('4. Passport World Module (passport-power)', () => {
    it('provides isolated passport strength and Indonesian visa requirements', async () => {
      const data = await passportWorldApp.dataLoader([singapore, japan, indonesia] as any);
      
      expect(data['SGP'].visaFreeCount).toBeGreaterThanOrEqual(190);
      expect(data['SGP'].globalRank).toBe(1);
      expect(data['SGP'].visaRequirementForIndonesian).toBe('Visa Free');

      expect(data['IDN'].visaRequirementForIndonesian).toBe('Visa Free');

      const inspector = passportWorldApp.renderInspector?.(singapore as any, data['SGP'], data);
      expect(inspector?.type).toBe('passport');
      expect(inspector?.primaryValue).toContain('Destinasi');
    });
  });
});
