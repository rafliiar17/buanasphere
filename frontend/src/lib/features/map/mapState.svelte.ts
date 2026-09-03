/**
 * Kurs World — World Map State Management (Svelte 5 Reactive Class)
 *
 * ADR-0034: Konversi dari plain TypeScript class ke Svelte 5 Reactive Class
 * menggunakan $state() rune pada setiap mutable property.
 *
 * Root Cause (Bug Fix): MapState sebelumnya adalah plain TypeScript class.
 * Saat di-wrap dengan $state(createMapState()), mutations via `this.prop = value`
 * di method class tidak selalu di-intercept oleh Svelte 5 Proxy, sehingga template
 * kondisional {mapState.activeMetric === 'rate'} tidak re-render saat setMetric() dipanggil.
 *
 * Fix: Gunakan $state() rune pada setiap property class — pattern "Svelte 5 Reactive Class"
 * yang didokumentasikan di svelte.dev/docs/svelte/$state#Classes.
 * File ini menggunakan ekstensi .svelte.ts agar Svelte compiler memproses runes di dalamnya.
 */

// Safe polyfill for non-browser runtime (e.g. Bun test)
if (typeof window === 'undefined') {
  if (!('$state' in globalThis)) {
    (globalThis as any).$state = (val: any) => val;
  }
  if (!('$derived' in globalThis)) {
    (globalThis as any).$derived = (fn: any) => (typeof fn === 'function' ? fn() : fn);
  }
}

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
import type { TimezoneMeridianInfo } from '../../framework/geoglobe/types';

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
  showFlags?: boolean;
  autoRotate?: boolean;
  convertAmount?: number;
  convertDirection?: 'foreign_to_idr' | 'idr_to_foreign';
  isControlsCollapsed?: boolean;
  isRegionDropdownOpen?: boolean;
}

/**
 * Svelte 5 Reactive Map State Class (ADR-0034)
 *
 * Setiap mutable property dideklarasikan dengan $state() rune agar Svelte compiler
 * menghasilkan getter/setter reactive yang memicu re-render template secara benar.
 */
export class MapState {
  projectionMode: 'globe' | 'flat' = $state('globe');
  activeMetric: MetricType = $state('rate');
  activeRegion: string = $state('all');
  selectedCurrencyCode: string = $state('USD');
  selectedCountryIso3: string = $state('IDN');
  hoveredIso3: string | null = $state(null);
  searchQuery: string = $state('');
  isSearchDropdownOpen: boolean = $state(false);
  isInspectorOpen: boolean = $state(false);
  showLabels: boolean = $state(true);
  showFlags: boolean = $state(false);
  autoRotate: boolean = $state(false);
  _previousMetricBeforeFlag: MetricType = 'rate';
  convertAmount: number = $state(1);
  convertDirection: 'foreign_to_idr' | 'idr_to_foreign' = $state('foreign_to_idr');
  isControlsCollapsed: boolean = $state(false);
  isRegionDropdownOpen: boolean = $state(false);
  highlightedIndex: number = $state(0);
  performanceMode: 'turbo' | 'quality' = $state('quality');
  showTimezoneLines: boolean = $state(false);
  selectedMeridian: TimezoneMeridianInfo | null = $state(null);
  cameraTravelSignal: { iso3: string; timestamp: number } | null = $state(null);

  constructor(initial?: Partial<MapStateConfig>) {
    if (initial) {
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
      if (initial.showFlags !== undefined) this.showFlags = initial.showFlags;
      if (initial.autoRotate !== undefined) this.autoRotate = initial.autoRotate;
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
    if (metric !== 'flag') {
      this.showFlags = false;
    } else {
      this.showFlags = true;
    }
  };

  toggleFlags = () => {
    this.showFlags = !this.showFlags;
    if (this.showFlags) {
      if (this.activeMetric !== 'flag') {
        this._previousMetricBeforeFlag = this.activeMetric;
      }
      this.activeMetric = 'flag';
    } else {
      this.activeMetric = this._previousMetricBeforeFlag ?? 'rate';
    }
  };

  setFlags = (enabled: boolean) => {
    if (this.showFlags === enabled) return;
    this.toggleFlags();
  };

  toggleAutoRotate = () => {
    this.autoRotate = !this.autoRotate;
  };

  setAutoRotate = (enabled: boolean) => {
    this.autoRotate = enabled;
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
    this.cameraTravelSignal = { iso3: this.selectedCountryIso3, timestamp: Date.now() };
  };

  travelToCountry = (iso3: string) => {
    this.selectCountry(iso3);
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

  toggleTimezoneLines = () => {
    this.showTimezoneLines = !this.showTimezoneLines;
  };

  setSelectedMeridian = (meridian: TimezoneMeridianInfo | null) => {
    this.selectedMeridian = meridian;
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
 * Factory function to instantiate a Svelte 5 Reactive MapState
 */
export function createMapState(initial?: Partial<MapStateConfig>): MapState {
  return new MapState(initial);
}
