import type { CountrySpatialMetadata } from '$lib/framework/geoglobe/types';

export interface CountryIdMapping {
  iso3ToId: Record<string, number>;
  idToIso3: Record<number, string>;
  oceanId: number;
  totalCountries: number;
}

/**
 * Builds a deterministic 1-to-1 mapping between ISO-3 codes and 8-bit integers (1..255).
 * ID 0 is strictly reserved for Ocean/Lautan.
 */
export function buildCountryIdMapping(countries: readonly CountrySpatialMetadata[]): CountryIdMapping {
  const iso3ToId: Record<string, number> = {};
  const idToIso3: Record<number, string> = {};

  let currentId = 1;

  for (const country of countries) {
    if (!country.iso3 || country.iso3.length !== 3) continue;
    if (!iso3ToId[country.iso3]) {
      iso3ToId[country.iso3] = currentId;
      idToIso3[currentId] = country.iso3;
      currentId++;
      if (currentId > 255) {
        console.warn(`[CountryLutEngine] Warning: Exceeded 255 countries limit for 8-bit channel!`);
        break;
      }
    }
  }

  return {
    iso3ToId,
    idToIso3,
    oceanId: 0,
    totalCountries: currentId - 1,
  };
}

/**
 * Parses color strings (hex, rgba, rgb) to an [R, G, B, A] tuple (0..255).
 */
export function hexOrRgbaToRgbaArray(colorStr: string): [number, number, number, number] {
  if (!colorStr) return [0, 0, 0, 255];

  // 1. Hex format (#RRGGBB or #RGB)
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    return [r, g, b, 255];
  }

  // 2. RGBA format: rgba(r, g, b, a)
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/);
  if (rgbaMatch) {
    const r = Number(rgbaMatch[1]) || 0;
    const g = Number(rgbaMatch[2]) || 0;
    const b = Number(rgbaMatch[3]) || 0;
    const a = rgbaMatch[4] !== undefined ? Math.round(Number(rgbaMatch[4]) * 255) : 255;
    return [r, g, b, a];
  }

  return [100, 116, 139, 255];
}

/**
 * Creates a 256x1 RGBA Uint8Array buffer (1024 bytes) for the 1D Palette LUT DataTexture.
 */
export function createPaletteLutBuffer(oceanColor: string = '#0B0F19'): Uint8Array {
  const buffer = new Uint8Array(256 * 4);
  const [r, g, b, a] = hexOrRgbaToRgbaArray(oceanColor);

  // Slot 0 is Ocean
  buffer[0] = r;
  buffer[1] = g;
  buffer[2] = b;
  buffer[3] = a;

  // Initialize remaining slots with default neutral slate
  for (let i = 1; i < 256; i++) {
    const base = i * 4;
    buffer[base + 0] = 51;
    buffer[base + 1] = 65;
    buffer[base + 2] = 85;
    buffer[base + 3] = 230;
  }

  return buffer;
}

/**
 * Updates a specific country's color slot inside the 256x1 LUT buffer.
 */
export function updatePaletteLutSlot(
  buffer: Uint8Array,
  countryId: number,
  rgba: [number, number, number, number]
): void {
  if (countryId < 0 || countryId > 255) return;
  const base = countryId * 4;
  buffer[base + 0] = rgba[0];
  buffer[base + 1] = rgba[1];
  buffer[base + 2] = rgba[2];
  buffer[base + 3] = rgba[3];
}

/**
 * Resolves an equirectangular UV coordinate (u: 0..1, v: 0..1) on the sphere
 * directly to a Country ID and ISO-3 using the in-memory 2D ID map buffer.
 * Execution time: <0.001 milliseconds!
 */
export function pickCountryFromUv(
  u: number,
  v: number,
  buffer: Uint8Array,
  width: number,
  height: number,
  mapping: CountryIdMapping
): { countryId: number; iso3: string | null } {
  // Clamp UVs
  const safeU = Math.max(0, Math.min(0.99999, u));
  const safeV = Math.max(0, Math.min(0.99999, v));

  // Equirectangular mapping:
  // x = u * width
  // y = (1 - v) * height
  const x = Math.floor(safeU * width);
  const y = Math.floor((1 - safeV) * height);

  const idx = y * width + x;
  const countryId = idx < buffer.length ? buffer[idx] : 0;

  if (countryId === 0 || !mapping.idToIso3[countryId]) {
    return { countryId: 0, iso3: null };
  }

  return {
    countryId,
    iso3: mapping.idToIso3[countryId],
  };
}

/**
 * Renders GeoJSON features onto an offscreen 2D canvas with indexed 8-bit Country IDs.
 * Generates both the Canvas (for Three.js texture upload) and Uint8Array buffer (for fast UV picking).
 */
export function renderEquirectangularIdTexture(
  geoJsonFeatures: any[],
  mapping: CountryIdMapping,
  width: number = 2048,
  height: number = 1024
): { canvas: HTMLCanvasElement; buffer: Uint8Array } {
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : (new OffscreenCanvas(width, height) as unknown as HTMLCanvasElement);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;

  // Clear canvas to 0 (Ocean)
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  // Helper to convert (lng, lat) to canvas (x, y)
  function project(lng: number, lat: number): [number, number] {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  }

  // Draw each country with fillStyle = `rgb(countryId, countryId, countryId)`
  for (const feat of geoJsonFeatures) {
    const p = feat.properties;
    const iso3 = p.ISO_A3 || p.ADM0_A3 || p.SOV_A3 || p.adm0_a3 || p.iso_a3 || '';
    const countryId = mapping.iso3ToId[iso3];
    if (!countryId) continue;

    ctx.fillStyle = `rgb(${countryId}, ${countryId}, ${countryId})`;
    ctx.beginPath();

    const geom = feat.geometry;
    if (geom.type === 'Polygon') {
      drawPolygon(ctx, geom.coordinates, project);
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        drawPolygon(ctx, poly, project);
      }
    }

    ctx.fill('evenodd');
  }

  // Extract raw pixel buffer for instant zero-overhead UV picking
  const imgData = ctx.getImageData(0, 0, width, height);
  const buffer = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    buffer[i] = imgData.data[i * 4]; // R channel contains the country ID
  }

  return { canvas, buffer };
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  rings: number[][][],
  project: (lng: number, lat: number) => [number, number]
): void {
  for (const ring of rings) {
    if (ring.length === 0) continue;
    const [startX, startY] = project(ring[0][0], ring[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < ring.length; i++) {
      const [x, y] = project(ring[i][0], ring[i][1]);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}
