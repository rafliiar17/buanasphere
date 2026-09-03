/**
 * Kurs World — GeoGlobe State Store (Svelte 5 Runes)
 * Manages 3D globe visualization parameters, selected/hovered entities, and app view modes.
 */

import { getCountryByIso3, type CountrySpatialMetadata } from '../data/countrySpatialData';

export type ActiveMetric = 'rate' | 'change' | 'flag';
export type ViewMode = 'globe' | 'matrix' | 'converter';

export class GlobeState {
  activeMetric = $state<ActiveMetric>('rate');
  selectedCountryIso3 = $state<string | null>(null);
  hoveredCountryIso3 = $state<string | null>(null);
  showLabels = $state<boolean>(true);
  showTimezoneLines = $state<boolean>(false);
  cameraAltitude = $state<number>(2.5);
  viewMode = $state<ViewMode>('globe');

  // Derived properties
  get selectedCountry(): CountrySpatialMetadata | undefined {
    return this.selectedCountryIso3 ? getCountryByIso3(this.selectedCountryIso3) : undefined;
  }

  get hoveredCountry(): CountrySpatialMetadata | undefined {
    return this.hoveredCountryIso3 ? getCountryByIso3(this.hoveredCountryIso3) : undefined;
  }

  // Mutations
  setActiveMetric(metric: ActiveMetric) {
    this.activeMetric = metric;
  }

  selectCountry(iso3: string | null) {
    this.selectedCountryIso3 = iso3 ? iso3.toUpperCase() : null;
  }

  hoverCountry(iso3: string | null) {
    this.hoveredCountryIso3 = iso3 ? iso3.toUpperCase() : null;
  }

  toggleLabels() {
    this.showLabels = !this.showLabels;
  }

  toggleTimezoneLines() {
    this.showTimezoneLines = !this.showTimezoneLines;
  }

  setCameraAltitude(altitude: number) {
    // Clamp altitude between 0.5 (close) and 5.0 (far overview)
    this.cameraAltitude = Math.max(0.5, Math.min(5.0, Number(altitude.toFixed(2))));
  }

  zoomIn(step = 0.4) {
    this.setCameraAltitude(this.cameraAltitude - step);
  }

  zoomOut(step = 0.4) {
    this.setCameraAltitude(this.cameraAltitude + step);
  }

  resetCamera() {
    this.cameraAltitude = 2.5;
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
  }
}

export const globeState = new GlobeState();
