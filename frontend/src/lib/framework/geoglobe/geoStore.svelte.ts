import type { CountrySpatialMetadata, GeoAppPlugin } from './types';
import { geoRegistry } from './appRegistry';
import { EXTENDED_COUNTRIES_DATA } from './countrySpatialData';
import { fxRatesApp } from './plugins/fxRatesApp';
import { worldTimeApp } from './plugins/worldTimeApp';
import { flowCorridorsApp } from './plugins/flowCorridorsApp';
import { passportWorldApp } from './plugins/passportWorldApp';
import { floraFaunaApp } from './plugins/floraFaunaApp';
import { worldCapitalsApp } from './plugins/worldCapitalsApp';
import { earthquakeApp } from './plugins/earthquakeApp';
import { resolvePathToAppId, resolveAppIdToPath } from './router';
import {
  type TimeFilterType,
  type FlightCorridorFilterType,
  type PassportVisaFilterType,
  type NatureFilterType,
  isCountryMatchingAppFilter,
} from './filterEngine';

// Safe polyfill for non-browser runtime (e.g. Bun test) without triggering Svelte 5 browser getter trap
if (typeof window === 'undefined') {
  if (!('$state' in globalThis)) {
    (globalThis as any).$state = (val: any) => val;
  }
  if (!('$derived' in globalThis)) {
    (globalThis as any).$derived = (fn: any) => (typeof fn === 'function' ? fn() : fn);
  }
}

// Auto-register all built-in apps
geoRegistry.register(fxRatesApp);
geoRegistry.register(worldTimeApp);
geoRegistry.register(flowCorridorsApp);
geoRegistry.register(passportWorldApp);
geoRegistry.register(floraFaunaApp);
geoRegistry.register(worldCapitalsApp);
geoRegistry.register(earthquakeApp);

export function createGeoStore() {
  const initialAppId = typeof window !== 'undefined'
    ? resolvePathToAppId(window.location.pathname)
    : 'fx-rates';

  let activeAppId = $state(initialAppId);
  let activeMetricId = $state('rate');
  let selectedIso3 = $state('IDN');
  let cameraTravelSignal = $state<{ iso3: string; timestamp: number } | null>(null);
  let hoveredIso3 = $state<string | null>(null);
  let projectionMode = $state<'globe' | 'flat'>('globe');
  let isLauncherOpen = $state(false);
  let isInspectorOpen = $state(false);
  let showLabels = $state(true);
  let activeRegion = $state('all');
  let searchQuery = $state('');

  // 2-Way Reactive Filter States (ADR 0031 & ADR 0034)
  let timeFilter = $state<TimeFilterType>('all');
  let flightCorridorFilter = $state<FlightCorridorFilterType>('all');
  let passportVisaFilter = $state<PassportVisaFilterType>('all');
  let natureFilter = $state<NatureFilterType>('all');
  let customFilter = $state<unknown>('all');

  // Performance Profile (ADR 0035 - Laptop GPU & WebGL Optimization)
  let performanceMode = $state<'turbo' | 'quality'>('quality');
  let showTimezoneLines = $state(true);
  let autoRotate = $state(false);

  let appDataCache = $state<Record<string, Record<string, any>>>({});
  let isLoadingData = $state(false);

  async function loadDataForApp(app: GeoAppPlugin) {
    if (appDataCache[app.id]) return;
    isLoadingData = true;
    try {
      const data = await app.dataLoader(EXTENDED_COUNTRIES_DATA as CountrySpatialMetadata[]);
      appDataCache[app.id] = data;
    } catch (err) {
      console.error(`Failed loading data for app ${app.id}:`, err);
    } finally {
      isLoadingData = false;
    }
  }

  // Preload initial app data
  const initApp = geoRegistry.getApp(initialAppId) ?? fxRatesApp;
  activeMetricId = initApp.defaultMetricId;
  loadDataForApp(initApp);

  if (typeof window !== 'undefined') {
    // Listen to popstate for back/forward navigation
    window.addEventListener('popstate', () => {
      const targetAppId = resolvePathToAppId(window.location.pathname);
      if (targetAppId !== activeAppId) {
        activeAppId = targetAppId;
        const app = geoRegistry.getApp(targetAppId);
        if (app) {
          activeMetricId = app.defaultMetricId;
          loadDataForApp(app);
        }
      }
    });
  }

  function switchApp(appId: string) {
    const app = geoRegistry.getApp(appId);
    if (!app) return;
    activeAppId = appId;
    activeMetricId = app.defaultMetricId;
    customFilter = 'all';
    loadDataForApp(app);
    isLauncherOpen = false;

    // Update browser URL via HTML5 pushState without reload
    if (typeof window !== 'undefined') {
      const newPath = resolveAppIdToPath(appId);
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }
  }

  function setMetric(metricId: string) {
    activeMetricId = metricId;
  }

  function setProjection(mode: 'globe' | 'flat') {
    projectionMode = mode;
  }

  function selectCountry(iso3: string) {
    selectedIso3 = iso3.toUpperCase();
    isInspectorOpen = true;
    cameraTravelSignal = { iso3: selectedIso3, timestamp: Date.now() };
  }

  function travelToCountry(iso3: string) {
    selectedIso3 = iso3.toUpperCase();
    cameraTravelSignal = { iso3: selectedIso3, timestamp: Date.now() };
  }

  function closeInspector() {
    isInspectorOpen = false;
  }

  function openInspector(iso3?: string) {
    if (iso3) selectCountry(iso3);
    isInspectorOpen = true;
  }

  function toggleLauncher() {
    isLauncherOpen = !isLauncherOpen;
  }

  function toggleLabels() {
    showLabels = !showLabels;
  }

  function setShowLabels(val: boolean) {
    showLabels = val;
  }

  function setRegion(region: string) {
    activeRegion = region;
  }

  function setSearchQuery(q: string) {
    searchQuery = q;
  }

  function setTimeFilter(filter: TimeFilterType) {
    timeFilter = filter;
  }

  function setFlightCorridorFilter(filter: FlightCorridorFilterType) {
    flightCorridorFilter = filter;
  }

  function setPassportVisaFilter(filter: PassportVisaFilterType) {
    passportVisaFilter = filter;
  }

  function setNatureFilter(filter: NatureFilterType) {
    natureFilter = filter;
  }

  function setCustomFilter(filter: unknown) {
    customFilter = filter;
    if (activeAppId === 'world-time') timeFilter = filter as TimeFilterType;
    if (activeAppId === 'remittance-flow') flightCorridorFilter = filter as FlightCorridorFilterType;
    if (activeAppId === 'passport-power') passportVisaFilter = filter as PassportVisaFilterType;
    if (activeAppId === 'flora-fauna') natureFilter = filter as NatureFilterType;
  }

  function isCountryMatched(iso3: string): boolean {
    return isCountryMatchingAppFilter(iso3, activeAppId, {
      timeFilter,
      flightFilter: flightCorridorFilter,
      passportFilter: passportVisaFilter,
      natureFilter,
      customFilter,
      region: activeRegion,
    });
  }

  return {
    get activeAppId() { return activeAppId; },
    get activeApp() { return geoRegistry.getApp(activeAppId) ?? fxRatesApp; },
    get activeMetricId() { return activeMetricId; },
    get selectedIso3() { return selectedIso3; },
    get selectedCountry() { return EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === selectedIso3) ?? EXTENDED_COUNTRIES_DATA[0]; },
    get hoveredIso3() { return hoveredIso3; },
    set hoveredIso3(val) { hoveredIso3 = val; },
    get projectionMode() { return projectionMode; },
    get isLauncherOpen() { return isLauncherOpen; },
    set isLauncherOpen(val) { isLauncherOpen = val; },
    get isInspectorOpen() { return isInspectorOpen; },
    set isInspectorOpen(val) { isInspectorOpen = val; },
    get showLabels() { return showLabels; },
    set showLabels(val) { showLabels = val; },
    get activeRegion() { return activeRegion; },
    set activeRegion(val) { activeRegion = val; },
    get searchQuery() { return searchQuery; },
    set searchQuery(val) { searchQuery = val; },
    get timeFilter() { return timeFilter; },
    set timeFilter(val) { timeFilter = val; },
    get flightCorridorFilter() { return flightCorridorFilter; },
    set flightCorridorFilter(val) { flightCorridorFilter = val; },
    get passportVisaFilter() { return passportVisaFilter; },
    set passportVisaFilter(val) { passportVisaFilter = val; },
    get natureFilter() { return natureFilter; },
    set natureFilter(val) { natureFilter = val; },
    get customFilter() { return customFilter; },
    set customFilter(val) { customFilter = val; },
    get performanceMode() { return performanceMode; },
    set performanceMode(val) { performanceMode = val; },
    get currentAppData() { return appDataCache[activeAppId] ?? {}; },
    get isLoadingData() { return isLoadingData; },
    switchApp,
    setMetric,
    setProjection,
    get cameraTravelSignal() { return cameraTravelSignal; },
    travelToCountry,
    selectCountry,
    closeInspector,
    openInspector,
    toggleLauncher,
    toggleLabels,
    setShowLabels,
    setRegion,
    setSearchQuery,
    setTimeFilter,
    setFlightCorridorFilter,
    setPassportVisaFilter,
    setNatureFilter,
    setCustomFilter,
    get showTimezoneLines() { return showTimezoneLines; },
    setShowTimezoneLines: (show: boolean) => { showTimezoneLines = show; },
    toggleTimezoneLines: () => { showTimezoneLines = !showTimezoneLines; },
    get autoRotate() { return autoRotate; },
    toggleAutoRotate: () => {
      autoRotate = !autoRotate;
    },
    setAutoRotate: (enabled: boolean) => {
      autoRotate = enabled;
    },
    setPerformanceMode: (mode: 'turbo' | 'quality') => { performanceMode = mode; },
    togglePerformanceMode: () => { performanceMode = performanceMode === 'turbo' ? 'quality' : 'turbo'; },
    isCountryMatched,
    allApps: geoRegistry.getAllApps(),
    countries: EXTENDED_COUNTRIES_DATA,
  };
}

export const geoStore = createGeoStore();
