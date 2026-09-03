/**
 * Kurs World — World Map State Management
 * Standard TypeScript class and domain constants for 3D Globe and 2D Flat Choropleth Maps.
 */

import {
  REGION_FILTERS,
  type RegionFilter,
  type RegionId,
  type MetricType,
  type MapCountryData,
  COUNTRY_CURRENCY_MAP,
  PRESET_AMOUNTS,
} from './map-constants';
import type { RateItem } from '../../api/types';

export interface MetricOption {
  id: MetricType;
  label: string;
  emoji: string;
  description: string;
}

export const METRIC_OPTIONS: readonly MetricOption[] = [
  { id: 'rate', label: 'Kurs Nominal', emoji: '🪙', description: 'Nilai tukar terhadap Rupiah (IDR)' },
  { id: 'change', label: 'Tren 24 Jam', emoji: '📈', description: 'Persentase perubahan kurs 24 jam' },
  { id: 'flag', label: 'Bendera Negara', emoji: '🏁', description: 'Warna bendera nasional negara' },
];

export { REGION_FILTERS, PRESET_AMOUNTS };
export type { RegionFilter, RegionId, MetricType, MapCountryData };

export interface MapStateConfig {
  projectionMode?: 'globe' | 'flat';
  activeMetric?: MetricType;
  activeRegion?: string;
  selectedCurrencyCode?: string;
  selectedCountryIso3?: string;
  hoveredIso3?: string | null;
  searchQuery?: string;
  isSearchDropdownOpen?: boolean;
  isInspectorOpen?: boolean;
  showLabels?: boolean;
  convertAmount?: number;
  convertDirection?: 'foreign_to_idr' | 'idr_to_foreign';
  isControlsCollapsed?: boolean;
  isRegionDropdownOpen?: boolean;
}

/**
 * Standard Map State Class
 */
export class MapState {
  projectionMode: 'globe' | 'flat' = 'globe';
  activeMetric: MetricType = 'rate';
  activeRegion: string = 'all';
  selectedCurrencyCode: string = 'USD';
  selectedCountryIso3: string = 'IDN';
  hoveredIso3: string | null = null;
  searchQuery: string = '';
  isSearchDropdownOpen: boolean = false;
  isInspectorOpen: boolean = false;
  showLabels: boolean = true;
  convertAmount: number = 1;
  convertDirection: 'foreign_to_idr' | 'idr_to_foreign' = 'foreign_to_idr';
  isControlsCollapsed: boolean = false;
  isRegionDropdownOpen: boolean = false;
  highlightedIndex: number = 0;
  performanceMode: 'turbo' | 'quality' = 'quality';

  constructor(initial?: Partial<MapStateConfig & { performanceMode?: 'turbo' | 'quality' }>) {
    if (initial) {
      if (initial.performanceMode !== undefined) this.performanceMode = initial.performanceMode;
      if (initial.projectionMode !== undefined) this.projectionMode = initial.projectionMode;
      if (initial.activeMetric !== undefined) this.activeMetric = initial.activeMetric;
      if (initial.activeRegion !== undefined) this.activeRegion = initial.activeRegion;
      if (initial.selectedCurrencyCode !== undefined) this.selectedCurrencyCode = initial.selectedCurrencyCode;
      if (initial.selectedCountryIso3 !== undefined) this.selectedCountryIso3 = initial.selectedCountryIso3;
      if (initial.hoveredIso3 !== undefined) this.hoveredIso3 = initial.hoveredIso3;
      if (initial.searchQuery !== undefined) this.searchQuery = initial.searchQuery;
      if (initial.isSearchDropdownOpen !== undefined) this.isSearchDropdownOpen = initial.isSearchDropdownOpen;
      if (initial.isInspectorOpen !== undefined) this.isInspectorOpen = initial.isInspectorOpen;
      if (initial.showLabels !== undefined) this.showLabels = initial.showLabels;
      if (initial.convertAmount !== undefined) this.convertAmount = initial.convertAmount;
      if (initial.convertDirection !== undefined) this.convertDirection = initial.convertDirection;
      if (initial.isControlsCollapsed !== undefined) this.isControlsCollapsed = initial.isControlsCollapsed;
      if (initial.isRegionDropdownOpen !== undefined) this.isRegionDropdownOpen = initial.isRegionDropdownOpen;
    }
  }

  setProjection = (mode: 'globe' | 'flat') => {
    this.projectionMode = mode;
  };

  setMetric = (metric: MetricType) => {
    this.activeMetric = metric;
  };

  setRegion = (region: string) => {
    this.activeRegion = region;
  };

  selectCountry = (iso3: string, currencyCode?: string) => {
    this.selectedCountryIso3 = iso3;
    if (currencyCode) {
      this.selectedCurrencyCode = currencyCode;
    } else {
      const match = COUNTRY_CURRENCY_MAP.find((c) => c.iso3 === iso3);
      if (match) {
        this.selectedCurrencyCode = match.currencyCode;
      }
    }
  };

  setSearchQuery = (query: string) => {
    this.searchQuery = query;
    this.highlightedIndex = 0;
    if (query.trim().length > 0) {
      this.isSearchDropdownOpen = true;
    }
  };

  openInspector = (iso3?: string, currencyCode?: string) => {
    if (iso3) {
      this.selectCountry(iso3, currencyCode);
    }
    this.isInspectorOpen = true;
  };

  closeInspector = () => {
    this.isInspectorOpen = false;
  };

  toggleConvertDirection = () => {
    if (this.convertDirection === 'foreign_to_idr') {
      this.convertDirection = 'idr_to_foreign';
      if (this.convertAmount <= 1000) {
        this.convertAmount = 100000;
      }
    } else {
      this.convertDirection = 'foreign_to_idr';
      if (this.convertAmount >= 10000) {
        this.convertAmount = 1;
      }
    }
  };

  setConvertAmount = (amount: number) => {
    this.convertAmount = amount;
  };

  setHoveredIso3 = (iso3: string | null) => {
    this.hoveredIso3 = iso3;
  };

  toggleLabels = () => {
    this.showLabels = !this.showLabels;
  };

  setShowLabels = (show: boolean) => {
    this.showLabels = show;
  };

  toggleSearchDropdown = (open?: boolean) => {
    this.isSearchDropdownOpen = open !== undefined ? open : !this.isSearchDropdownOpen;
  };

  toggleControlsCollapsed = () => {
    this.isControlsCollapsed = !this.isControlsCollapsed;
  };

  toggleRegionDropdown = (open?: boolean) => {
    this.isRegionDropdownOpen = open !== undefined ? open : !this.isRegionDropdownOpen;
  };

  setPerformanceMode = (mode: 'turbo' | 'quality') => {
    this.performanceMode = mode;
  };

  togglePerformanceMode = () => {
    this.performanceMode = this.performanceMode === 'turbo' ? 'quality' : 'turbo';
  };

  resetView = () => {
    this.activeRegion = 'all';
    this.searchQuery = '';
    this.isSearchDropdownOpen = false;
    this.isRegionDropdownOpen = false;
  };

  /**
   * Search through available countries / currencies
   */
  getSearchResults = <T = any>(dataListOrQuery?: any, fallbackData?: any): T[] => {
    let query = this.searchQuery;
    let list: Array<any> = COUNTRY_CURRENCY_MAP;

    if (typeof dataListOrQuery === 'string') {
      query = dataListOrQuery;
      if (Array.isArray(fallbackData)) {
        list = fallbackData;
      }
    } else if (Array.isArray(dataListOrQuery)) {
      list = dataListOrQuery;
    }

    const q = (query || '').trim().toLowerCase();
    if (!q) return [];

    return list
      .filter((item: any) => {
        const countryMatch = (item.countryName || '').toLowerCase().includes(q);
        const codeMatch = (item.currencyCode || '').toLowerCase().includes(q);
        const currNameMatch = (item.currencyName || '').toLowerCase().includes(q);
        const iso3Match = (item.iso3 || '').toLowerCase().includes(q);
        const regionMatch = (item.regionLabel || '').toLowerCase().includes(q);
        return countryMatch || codeMatch || currNameMatch || iso3Match || regionMatch;
      })
      .slice(0, 15) as T[];
  };
}

export type MapStateStore = MapState;

/**
 * Factory function to instantiate a MapState
 */
export function createMapState(initial?: Partial<MapStateConfig>): MapState {
  return new MapState(initial);
}
