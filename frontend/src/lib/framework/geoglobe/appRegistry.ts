import type { GeoAppPlugin } from './types';

export class GeoAppRegistry {
  private apps: Map<string, GeoAppPlugin> = new Map();
  private activeAppId: string = 'fx-rates';

  register(plugin: GeoAppPlugin): void {
    this.apps.set(plugin.id, plugin);
  }

  getApp(id: string): GeoAppPlugin | undefined {
    return this.apps.get(id);
  }

  getAllApps(): GeoAppPlugin[] {
    return Array.from(this.apps.values());
  }

  setActiveApp(id: string): void {
    if (this.apps.has(id)) {
      this.activeAppId = id;
    }
  }

  getActiveApp(): GeoAppPlugin | undefined {
    return this.apps.get(this.activeAppId);
  }

  getActiveAppId(): string {
    return this.activeAppId;
  }
}

export const geoRegistry = new GeoAppRegistry();
