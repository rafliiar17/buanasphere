/**
 * Kurs World / GeoGlobe — Precise World Capital Coordinates and National Anthems.
 * Provides authentic geographical city coordinates and national anthem metadata.
 * Decoupled from hardcoded TypeScript to JSON dataset (ADR 0071).
 */

import capitalDetailsRaw from './capital_details_dataset.json';

export interface NationalAnthem {
  title: string;
  nativeTitle?: string;
  composer?: string;
  adoptedYear?: number;
  audioUrl?: string;
}

export interface CapitalDetailsDataset {
  coordinates: Record<string, { lat: number; lng: number }>;
  anthems: Record<string, NationalAnthem>;
}

const dataset = capitalDetailsRaw as unknown as CapitalDetailsDataset;

export const CAPITAL_COORDINATES_MAP: Record<string, { lat: number; lng: number }> = dataset.coordinates;
export const NATIONAL_ANTHEMS_MAP: Record<string, NationalAnthem> = dataset.anthems;
