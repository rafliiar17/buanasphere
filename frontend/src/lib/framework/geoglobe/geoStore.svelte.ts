import type { CountrySpatialMetadata, GeoAppPlugin } from './types';
import { geoRegistry } from './appRegistry';
import { EXTENDED_COUNTRIES_DATA } from './countrySpatialData';
import { fxRatesApp } from './plugins/fxRatesApp';
import { worldTimeApp } from './plugins/worldTimeApp';
import { flowCorridorsApp } from './plugins/flowCorridorsApp';
import { passportWorldApp } from './plugins/passportWorldApp';
import { resolvePathToAppId, resolveAppIdToPath } from './router';

// Auto-register all built-in apps
geoRegistry.register(fxRatesApp);
geoRegistry.register(worldTimeApp);
geoRegistry.register(flowCorridorsApp);
geoRegistry.register(passportWorldApp);

export function createGeoStore() {
  const initialAppId = typeof window !== 'undefined'
    ? resolvePathToAppId(window.location.pathname)
    : 'fx-rates';

  let activeAppId = $state(initialAppId);
  let activeMetricId = $state('rate');
  let selectedIso3 = $state('USA');
  let hoveredIso3 = $state<string | null>(null);
  let projectionMode = $state<'globe' | 'flat'>('globe');
  let isLauncherOpen = $state(false);
  let isInspectorOpen = $state(false);
  let showLabels = $state(true);
  let activeRegion = $state('all');
  let searchQuery = $state('');

  let appDataCache = $state<Record<string, Record<string, any>>>({});
  let isLoadingData = $state(false);

  const activeApp = $derived(geoRegistry.getApp(activeAppId) ?? fxRatesApp);
  const currentAppData = $derived(appDataCache[activeAppId] ?? {});

  const selectedCountry = $derived(
    EXTENDED_COUNTRIES_DATA.find((c) => c.iso3 === selectedIso3) ?? EXTENDED_COUNTRIES_DATA[0]
  );

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
  }

  function closeInspector() {
    isInspectorOpen = false;
  }

  function toggleLauncher() {
    isLauncherOpen = !isLauncherOpen;
  }

  return {
    get activeAppId() { return activeAppId; },
    get activeApp() { return activeApp; },
    get activeMetricId() { return activeMetricId; },
    get selectedIso3() { return selectedIso3; },
    get selectedCountry() { return selectedCountry; },
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
    get currentAppData() { return currentAppData; },
    get isLoadingData() { return isLoadingData; },
    switchApp,
    setMetric,
    setProjection,
    selectCountry,
    closeInspector,
    toggleLauncher,
    allApps: geoRegistry.getAllApps(),
    countries: EXTENDED_COUNTRIES_DATA,
  };
}

export const geoStore = createGeoStore();
