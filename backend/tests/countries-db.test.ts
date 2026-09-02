import { describe, it, expect } from 'bun:test';
import { countriesTable, type CountryRow, type InsertCountryRow } from '../src/db/schema.ts';
import { ISO3_LOOKUP } from '../src/domain/country-map.ts';
import { getCachedCountries, getCountryByIso3, seedCountriesToDb, clearCountryCache } from '../src/service/country.ts';
import { createApp } from '../src/index.ts';

describe('Countries Database Schema & D1 Domain Mapping (SDLC)', () => {
  it('defines countriesTable with required schema columns and constraints', () => {
    expect(countriesTable).toBeDefined();
    expect(countriesTable.iso3).toBeDefined();
    expect(countriesTable.name).toBeDefined();
    expect(countriesTable.currencyCode).toBeDefined();
    expect(countriesTable.currencyName).toBeDefined();
    expect(countriesTable.flagEmoji).toBeDefined();
    expect(countriesTable.region).toBeDefined();
    expect(countriesTable.isActive).toBeDefined();
    expect(countriesTable.createdAt).toBeDefined();
    expect(countriesTable.updatedAt).toBeDefined();
  });

  it('correctly maps ISO-3 entries to database row formats', () => {
    const idn = ISO3_LOOKUP.get('IDN');
    expect(idn).toBeDefined();
    if (idn) {
      const row: InsertCountryRow = {
        iso3: idn.iso3,
        name: idn.countryName,
        currencyCode: idn.currencyCode,
        currencyName: idn.currencyName,
        flagEmoji: idn.flagEmoji,
        region: idn.region,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(row.iso3).toBe('IDN');
      expect(row.name).toBe('Indonesia');
      expect(row.currencyCode).toBe('IDR');
      expect(row.flagEmoji).toBe('🇮🇩');
      expect(row.region).toBe('Asia');
      expect(row.isActive).toBe(true);
    }
  });

  it('ensures high coverage of sovereign countries available for DB seeding', () => {
    expect(ISO3_LOOKUP.size).toBeGreaterThanOrEqual(160);
    expect(ISO3_LOOKUP.has('USA')).toBe(true);
    expect(ISO3_LOOKUP.has('JPN')).toBe(true);
    expect(ISO3_LOOKUP.has('DEU')).toBe(true);
    expect(ISO3_LOOKUP.has('GBR')).toBe(true);
    expect(ISO3_LOOKUP.has('AUS')).toBe(true);
  });

  it('CountryService retrieves country by ISO-3 correctly', async () => {
    clearCountryCache();
    const idn = await getCountryByIso3('IDN');
    expect(idn).toBeDefined();
    expect(idn?.iso3).toBe('IDN');
    expect(idn?.name).toBe('Indonesia');
    expect(idn?.currencyCode).toBe('IDR');
    expect(idn?.flagEmoji).toBe('🇮🇩');

    const lowerIdn = await getCountryByIso3('idn');
    expect(lowerIdn).toBeDefined();
    expect(lowerIdn?.iso3).toBe('IDN');

    const nonExistent = await getCountryByIso3('XYZNOTEXIST');
    expect(nonExistent).toBeUndefined();
  });

  it('Elysia GET /api/v1/countries returns all countries with 200 OK', async () => {
    const app = createApp();
    const res = await app.handle(new Request('http://localhost/api/v1/countries'));
    expect(res.status).toBe(200);

    const json = (await res.json()) as { success: boolean; total: number; data: any[] };
    expect(json.success).toBe(true);
    expect(json.total).toBeGreaterThanOrEqual(195);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('Elysia GET /api/v1/countries?region=asean filters ASEAN countries', async () => {
    const app = createApp();
    const res = await app.handle(new Request('http://localhost/api/v1/countries?region=asean'));
    expect(res.status).toBe(200);

    const json = (await res.json()) as { success: boolean; total: number; data: any[] };
    expect(json.success).toBe(true);
    expect(json.total).toBeGreaterThanOrEqual(10);
    const iso3List = json.data.map((c: any) => c.iso3);
    expect(iso3List).toContain('IDN');
    expect(iso3List).toContain('SGP');
    expect(iso3List).toContain('MYS');
    expect(iso3List).toContain('THA');
    expect(iso3List).not.toContain('USA');
  });

  it('Elysia GET /api/v1/countries/:iso3 returns country detail or 404', async () => {
    const app = createApp();
    const resOk = await app.handle(new Request('http://localhost/api/v1/countries/IDN'));
    expect(resOk.status).toBe(200);

    const jsonOk = (await resOk.json()) as { success: boolean; data: { iso3: string; name: string; currencyCode: string } };
    expect(jsonOk.success).toBe(true);
    expect(jsonOk.data.iso3).toBe('IDN');
    expect(jsonOk.data.name).toBe('Indonesia');
    expect(jsonOk.data.currencyCode).toBe('IDR');

    const res404 = await app.handle(new Request('http://localhost/api/v1/countries/ZZZ'));
    expect(res404.status).toBe(404);
    const json404 = (await res404.json()) as { success: boolean };
    expect(json404.success).toBe(false);
  });
});
