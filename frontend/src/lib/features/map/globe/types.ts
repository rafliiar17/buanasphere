import type { Theme } from '$lib/theme';
import type { MapCountryData, MetricType } from '../map-constants';
import type { GeoAppPlugin } from '$lib/framework/geoglobe/types';
import type { TravelStage, TravelTrajectory, CameraCoordinates } from '../cameraTravel';

export type { TravelStage, TravelTrajectory, CameraCoordinates };

export interface CameraPointOfView {
  lat: number;
  lng: number;
  altitude: number;
}

export interface PolygonLayerOptions {
  mapData: MapCountryData[];
  selectedIso3?: string | null;
  hoveredIso3?: string | null;
  currentTheme: Theme;
  activeMetric: MetricType;
  isMatched?: boolean;
  isFilterActive?: boolean;
  activeApp?: GeoAppPlugin | null;
  currentAppData?: Record<string, any> | null;
}

export interface PolygonAltitudeOptions {
  selectedIso3?: string | null;
  hoveredIso3?: string | null;
  isMatched?: boolean;
  isFilterActive?: boolean;
  isFlag?: boolean;
}

export interface TooltipHtmlOptions {
  mapData: MapCountryData[];
  currentTheme: Theme;
  activeMetric: MetricType;
  activeApp?: GeoAppPlugin | null;
  currentAppData?: Record<string, any> | null;
}

export interface ArcFilterOptions {
  activeApp?: GeoAppPlugin | null;
  currentAppData?: Record<string, any> | null;
  flightCorridorFilter: string;
  isCountryMatched: (iso3: string) => boolean;
}

export interface PathLayerOptions {
  showTimezoneLines: boolean;
  activeApp?: GeoAppPlugin | null;
  currentAppData?: Record<string, any> | null;
  activeMetric: MetricType;
  currentTheme: Theme;
}

export interface RingLayerOptions {
  activeApp?: GeoAppPlugin | null;
  currentAppData?: Record<string, any> | null;
  selectedIso3?: string | null;
}

export interface LabelLayerOptions {
  geoJsonFeatures: any[];
  mapData: MapCountryData[];
  selectedIso3?: string | null;
  currentTheme: Theme;
  activeMetric: MetricType;
  cameraAltitude: number;
  activeApp?: GeoAppPlugin | null;
  currentAppData?: Record<string, any> | null;
  isSimulatingTime?: boolean;
  simulatedMinutes?: number;
  simulationAnchorZone?: any;
}
