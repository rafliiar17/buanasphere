import { describe, it, expect } from 'bun:test';
import { resolvePathToAppId, isLandingPath } from '../src/lib/framework/geoglobe/router';
import { apiClient } from '../src/lib/api/client';

describe('ADR 0045: Nimda Operator Console Frontend Suite (/nimda)', () => {
  describe('1. Router Mapping for /nimda', () => {
    it('recognizes /nimda as a dedicated operator route, not a landing page', () => {
      expect(isLandingPath('/nimda')).toBe(false);
      expect(isLandingPath('/nimda/')).toBe(false);
    });

    it('resolves /nimda gracefully in router', () => {
      const appId = resolvePathToAppId('/nimda');
      expect(appId).toBe('nimda-operator');
    });
  });

  describe('2. ApiClient Admin Methods (/nimda)', () => {
    it('apiClient provides admin methods with X-Admin-Key support', () => {
      expect(typeof apiClient.nimdaGetHealth).toBe('function');
      expect(typeof apiClient.nimdaTriggerIngest).toBe('function');
      expect(typeof apiClient.nimdaPurgeCache).toBe('function');
      expect(typeof apiClient.nimdaGetQuarantine).toBe('function');
      expect(typeof apiClient.nimdaGetApiKeys).toBe('function');
      expect(typeof apiClient.nimdaCreateApiKey).toBe('function');
      expect(typeof apiClient.nimdaToggleApiKey).toBe('function');
      expect(typeof apiClient.nimdaDeleteApiKey).toBe('function');
    });
  });
});
