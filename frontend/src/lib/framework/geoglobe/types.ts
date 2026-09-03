/**
 * Kurs World — GeoGlobe Spatial Core Types & Framework Interfaces (ADR 0035).
 */

export interface CountrySpatialMetadata {
  iso3: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  flagEmoji: string;
  region: string;
  capital: string;
  lat: number;
  lng: number;
  utcOffset: number;
  continent: string;
  population?: number;
}

export interface GeoArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color?: string | string[];
  altitude?: number;
  stroke?: number;
  dashLength?: number;
  dashGap?: number;
  dashAnimateTime?: number;
  label?: string;
}

export interface GeoRing {
  lat: number;
  lng: number;
  maxRadius?: number;
  propagationSpeed?: number;
  repeatPeriod?: number;
  color?: string | ((t: number) => string);
}

export interface GeoMetric {
  id: string;
  label: string;
  unit?: string;
  formatValue: (val: any) => string;
  colorScale: (normalizedVal: number, rawVal?: any) => string;
  min?: number;
  max?: number;
}

export interface InspectorWidget {
  title: string;
  type: 'stats' | 'clock' | 'corridors' | 'passport' | 'fx_calculator';
  primaryValue?: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'danger';
  };
  statsGrid?: Array<{
    label: string;
    value: string;
    hint?: string;
  }>;
  customData?: any;
}

export interface FilterOption {
  id: string;
  label: string;
  icon?: any;
}

export interface TimezoneMeridianInfo {
  id: string;
  utcOffset: number;
  label?: string;
  gmtLabel: string;
  localTime: string;
  diffWib: string;
  keyRegions: string[];
  color?: string | string[];
}

export interface GeoPath {
  id: string;
  coords: Array<[number, number]>;
  color?: string | string[];
  stroke?: number;
  altitude?: number;
  dashLength?: number;
  dashGap?: number;
  animateTime?: number;
  label?: string;
  utcOffset?: number;
  gmtLabel?: string;
  localTime?: string;
  diffWib?: string;
  keyRegions?: string[];
  tooltipHtml?: string;
}

export interface GeoAppPlugin<TData = any> {
  id: string;
  name: string;
  tagline: string;
  icon?: any;
  category: string;
  defaultMetricId: string;
  canonicalPath?: string;
  aliasPaths?: string[];
  branding?: {
    main: string;
    sub: string;
    accentColor?: string;
    /** Optional disclaimer strip shown in Navbar below the header */
    disclaimer?: string;
  };
  splash?: {
    stepText: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
  filterOptions?: FilterOption[];
  cameraPresets?: Record<string, { lat: number; lng: number; altitude: number }>;
  filterPredicate?: (iso3: string, filterValue: unknown, data?: TData, country?: CountrySpatialMetadata) => boolean;
  metrics: GeoMetric[];
  dataLoader: (countries: CountrySpatialMetadata[]) => Promise<Record<string, TData>>;
  getArcData?: (selectedCountry: CountrySpatialMetadata, allData: Record<string, TData>) => GeoArc[];
  getRingData?: (selectedCountry: CountrySpatialMetadata, allData: Record<string, TData>) => GeoRing[];
  getPolygonColor?: (country: CountrySpatialMetadata, data: TData, activeMetric: string, theme: 'dark' | 'light', state?: { isMatched?: boolean; isSelected?: boolean; isHovered?: boolean }) => string;
  getTooltipHtml?: (country: CountrySpatialMetadata, data: TData, activeMetric: string, theme: 'dark' | 'light') => string;
  getPinLabel?: (country: CountrySpatialMetadata, data: TData, activeMetric: string) => { text: string; shortText?: string; size?: number; color?: string; lat?: number; lng?: number };
  getArcs?: (data: Record<string, TData>, activeFilter: string) => GeoArc[];
  getPaths?: (data: Record<string, TData>, activeMetric: string, theme: 'dark' | 'light') => GeoPath[];
  renderInspector?: (country: CountrySpatialMetadata, data: TData, allData?: Record<string, TData>) => InspectorWidget;
  ControlsComponent?: any;
  BottomDockComponent?: any;
}
