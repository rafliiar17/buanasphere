/**
 * Kurs World Globe.gl Architecture — Core Types & Interface Definitions
 */

export type GlobeThemeMode = 'dark' | 'light';

export interface GlobeTheme {
  mode: GlobeThemeMode;
  backgroundColor: string;
  atmosphereColor: string;
  atmosphereAltitude: number;
  globeImageUrl?: string;
  bumpImageUrl?: string;
  polygonDefaultColor: string;
  polygonStrokeColor: string;
  polygonHoverColor: string;
  polygonSelectedColor: string;
  arcDefaultColor: string | string[];
  pathDefaultColor: string;
  ringDefaultColor: string;
  labelColor: string;
  labelSelectedColor: string;
}

export interface CameraPointOfView {
  lat: number;
  lng: number;
  altitude: number;
}

export interface CameraTravelOptions {
  targetAltitude?: number;
  stage1DurationMs?: number;
  stage2DurationMs?: number;
  directDurationMs?: number;
  thresholdDeg?: number;
}

export interface TravelStage {
  lat: number;
  lng: number;
  altitude: number;
  durationMs: number;
}

export interface TravelTrajectory {
  isTwoStage: boolean;
  distanceDeg: number;
  stage1: TravelStage;
  stage2: TravelStage;
}

export interface RateChoroplethData {
  rate: number;
  change24h?: number;
  currencyCode?: string;
  formattedRate?: string;
  formattedChange?: string;
}

export interface PolygonLayerConfig {
  features: any[];
  selectedIso3?: string | null;
  hoveredIso3?: string | null;
  matchedIso3List?: string[];
  rateDataByIso3?: Record<string, RateChoroplethData>;
  activeMetric?: 'rate' | 'change' | 'flag' | 'default';
  theme?: GlobeTheme;
  getCustomAltitude?: (feat: any) => number;
  getCustomCapColor?: (feat: any) => string;
  onHover?: (feat: any | null, prevFeat: any | null) => void;
  onClick?: (feat: any, event: MouseEvent) => void;
}

export interface ArcData {
  id?: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color?: string | string[];
  altitude?: number;
  stroke?: number;
  dashLength?: number;
  dashGap?: number;
  dashInitialGap?: number;
  dashAnimateTime?: number;
  label?: string;
  fromIso3?: string;
  toIso3?: string;
  amount?: number;
  currency?: string;
}

export interface ArcLayerConfig {
  arcs: ArcData[];
  theme?: GlobeTheme;
  onClick?: (arc: ArcData, event: MouseEvent) => void;
  onHover?: (arc: ArcData | null, prevArc: ArcData | null) => void;
}

export interface PathData {
  id: string;
  coords: Array<[number, number, number?]>;
  color?: string | string[];
  stroke?: number;
  altitude?: number;
  dashLength?: number;
  dashGap?: number;
  dashAnimateTime?: number;
  label?: string;
  tooltipHtml?: string;
  isMeridian?: boolean;
  isEquator?: boolean;
  isTropic?: boolean;
}

export interface PathLayerConfig {
  paths: PathData[];
  theme?: GlobeTheme;
  onClick?: (path: PathData, event: MouseEvent) => void;
  onHover?: (path: PathData | null, prevPath: PathData | null) => void;
}

export interface RingData {
  id?: string;
  lat: number;
  lng: number;
  altitude?: number;
  maxRadius?: number;
  propagationSpeed?: number;
  repeatPeriod?: number;
  color?: string | ((t: number) => string);
  label?: string;
  magnitude?: number;
}

export interface RingLayerConfig {
  rings: RingData[];
  theme?: GlobeTheme;
}

export interface LabelData {
  id?: string;
  iso3?: string;
  lat: number;
  lng: number;
  text: string;
  shortText?: string;
  size?: number;
  color?: string;
  dotRadius?: number;
  dotOrientation?: 'right' | 'top' | 'bottom' | 'left';
  altitude?: number;
  lodLevel?: number; // 0 = global hub, 1 = regional/medium, 2 = local/detailed
  priority?: number;
}

export interface LabelLayerConfig {
  labels: LabelData[];
  cameraAltitude?: number;
  selectedIso3?: string | null;
  theme?: GlobeTheme;
  resolution?: number;
  onClick?: (label: LabelData, event: MouseEvent) => void;
  onHover?: (label: LabelData | null, prevLabel: LabelData | null) => void;
}

export interface GlobeInstance {
  pointOfView: (pov?: Partial<CameraPointOfView>, ms?: number) => any;
  width: (w?: number) => any;
  height: (h?: number) => any;
  backgroundColor: (c?: string) => any;
  showAtmosphere: (s?: boolean) => any;
  atmosphereColor: (c?: string) => any;
  atmosphereAltitude: (a?: number) => any;
  globeImageUrl: (url?: string | null) => any;
  bumpImageUrl: (url?: string | null) => any;
  // Polygons
  polygonsData: (d?: any[]) => any;
  polygonGeoJsonGeometry: (prop?: string | ((d: any) => any)) => any;
  polygonCapColor: (fn?: (d: any) => string) => any;
  polygonSideColor: (fn?: (d: any) => string) => any;
  polygonStrokeColor: (fn?: (d: any) => string) => any;
  polygonAltitude: (fn?: (d: any) => number) => any;
  polygonCapCurvatureResolution: (r?: number) => any;
  polygonLabel: (fn?: (d: any) => string) => any;
  onPolygonClick: (fn?: (d: any, event: MouseEvent) => void) => any;
  onPolygonHover: (fn?: (d: any, prev: any) => void) => any;
  // Arcs
  arcsData: (d?: any[]) => any;
  arcStartLat: (prop?: string | ((d: any) => number)) => any;
  arcStartLng: (prop?: string | ((d: any) => number)) => any;
  arcEndLat: (prop?: string | ((d: any) => number)) => any;
  arcEndLng: (prop?: string | ((d: any) => number)) => any;
  arcColor: (prop?: string | ((d: any) => any)) => any;
  arcAltitude: (prop?: string | number | ((d: any) => number)) => any;
  arcStroke: (prop?: string | number | ((d: any) => number)) => any;
  arcDashLength: (prop?: string | number | ((d: any) => number)) => any;
  arcDashGap: (prop?: string | number | ((d: any) => number)) => any;
  arcDashInitialGap: (prop?: string | number | ((d: any) => number)) => any;
  arcDashAnimateTime: (prop?: string | number | ((d: any) => number)) => any;
  arcLabel: (fn?: (d: any) => string) => any;
  onArcClick: (fn?: (d: any, event: MouseEvent) => void) => any;
  onArcHover: (fn?: (d: any, prev: any) => void) => any;
  // Paths
  pathsData: (d?: any[]) => any;
  pathPoints: (prop?: string | ((d: any) => any)) => any;
  pathPointLat: (prop?: string | ((d: any) => number)) => any;
  pathPointLng: (prop?: string | ((d: any) => number)) => any;
  pathPointAlt: (prop?: string | number | ((d: any) => number)) => any;
  pathColor: (prop?: string | ((d: any) => any)) => any;
  pathStroke: (prop?: string | number | ((d: any) => number)) => any;
  pathDashLength: (prop?: string | number | ((d: any) => number)) => any;
  pathDashGap: (prop?: string | number | ((d: any) => number)) => any;
  pathDashAnimateTime: (prop?: string | number | ((d: any) => number)) => any;
  pathLabel: (fn?: (d: any) => string) => any;
  onPathClick: (fn?: (d: any, event: MouseEvent) => void) => any;
  onPathHover: (fn?: (d: any, prev: any) => void) => any;
  // Rings
  ringsData: (d?: any[]) => any;
  ringLat: (prop?: string | ((d: any) => number)) => any;
  ringLng: (prop?: string | ((d: any) => number)) => any;
  ringAltitude: (prop?: string | number | ((d: any) => number)) => any;
  ringColor: (fn?: (d: any) => string | ((t: number) => string)) => any;
  ringMaxRadius: (prop?: string | number | ((d: any) => number)) => any;
  ringPropagationSpeed: (prop?: string | number | ((d: any) => number)) => any;
  ringRepeatPeriod: (prop?: string | number | ((d: any) => number)) => any;
  // Labels
  labelsData: (d?: any[]) => any;
  labelLat: (prop?: string | ((d: any) => number)) => any;
  labelLng: (prop?: string | ((d: any) => number)) => any;
  labelText: (prop?: string | ((d: any) => string)) => any;
  labelSize: (prop?: string | number | ((d: any) => number)) => any;
  labelDotRadius: (prop?: string | number | ((d: any) => number)) => any;
  labelDotOrientation: (prop?: string | ((d: any) => string)) => any;
  labelColor: (prop?: string | ((d: any) => string)) => any;
  labelAltitude: (prop?: string | number | ((d: any) => number)) => any;
  labelResolution: (r?: number) => any;
  labelIncludeDot: (fn?: (d: any) => boolean) => any;
  labelLabel: (fn?: (d: any) => string) => any;
  onLabelClick: (fn?: (d: any, event: MouseEvent) => void) => any;
  onLabelHover: (fn?: (d: any, prev: any) => void) => any;
  // Controls & Three.js internals
  controls: () => any;
  scene: () => any;
  camera: () => any;
  renderer: () => any;
  _destructor?: () => void;
  [key: string]: any;
}
