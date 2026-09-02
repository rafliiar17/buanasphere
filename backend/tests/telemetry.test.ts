import { describe, it, expect } from 'bun:test';
import {
  recordProviderFetch,
  recordApiRequest,
  recordConversion,
  type AnalyticsEngineDataPoint,
} from '../src/telemetry/index.ts';

// Mock AnalyticsEngineDataset implementation
class MockAnalyticsEngineDataset implements AnalyticsEngineDataset {
  public dataPoints: AnalyticsEngineDataPoint[] = [];

  writeDataPoint(event?: AnalyticsEngineDataPoint): void {
    if (event) {
      this.dataPoints.push(event);
    }
  }
}

describe('Cloudflare Workers Analytics Engine Telemetry (ADR-0023)', () => {
  it('should gracefully handle undefined AnalyticsEngineDataset without throwing', () => {
    expect(() => {
      recordProviderFetch(undefined, {
        provider: 'bi',
        durationMs: 142.5,
        status: 'success',
        rateCount: 28,
      });
    }).not.toThrow();

    expect(() => {
      recordApiRequest(undefined, {
        endpoint: '/api/v1/rates/latest',
        method: 'GET',
        statusCode: 200,
        durationMs: 4.2,
        cacheStatus: 'HIT',
      });
    }).not.toThrow();

    expect(() => {
      recordConversion(undefined, {
        from: 'USD',
        to: 'IDR',
        amount: 100,
        rateType: 'buy',
        durationMs: 1.8,
        bestProvider: 'mandiri',
      });
    }).not.toThrow();
  });

  it('should record provider fetch telemetry with accurate blobs and doubles mapping', () => {
    const mockAnalytics = new MockAnalyticsEngineDataset();

    recordProviderFetch(mockAnalytics, {
      provider: 'bca',
      durationMs: 85.3,
      status: 'success',
      rateCount: 16,
    });

    expect(mockAnalytics.dataPoints.length).toBe(1);
    const dp = mockAnalytics.dataPoints[0];

    expect(dp.blobs).toBeDefined();
    expect(dp.blobs![0]).toBe('provider_fetch');
    expect(dp.blobs![1]).toBe('bca');
    expect(dp.blobs![2]).toBe('success');
    expect(dp.blobs![3]).toBe(''); // No error

    expect(dp.doubles).toBeDefined();
    expect(dp.doubles![0]).toBe(85.3);
    expect(dp.doubles![1]).toBe(16);

    expect(dp.indexes).toBeDefined();
    expect(dp.indexes![0]).toBe('bca');
  });

  it('should record provider fetch failure with error reason', () => {
    const mockAnalytics = new MockAnalyticsEngineDataset();

    recordProviderFetch(mockAnalytics, {
      provider: 'mandiri',
      durationMs: 5002.1,
      status: 'error',
      rateCount: 0,
      errorReason: 'Request timeout after 5000ms',
    });

    expect(mockAnalytics.dataPoints.length).toBe(1);
    const dp = mockAnalytics.dataPoints[0];

    expect(dp.blobs![0]).toBe('provider_fetch');
    expect(dp.blobs![1]).toBe('mandiri');
    expect(dp.blobs![2]).toBe('error');
    expect(dp.blobs![3]).toBe('Request timeout after 5000ms');

    expect(dp.doubles![0]).toBe(5002.1);
    expect(dp.doubles![1]).toBe(0);
    expect(dp.indexes![0]).toBe('mandiri');
  });

  it('should record API request telemetry with cache status and status code', () => {
    const mockAnalytics = new MockAnalyticsEngineDataset();

    recordApiRequest(mockAnalytics, {
      endpoint: '/api/v1/rates/latest',
      method: 'GET',
      statusCode: 200,
      durationMs: 2.15,
      cacheStatus: 'HIT',
      currencyPair: 'USD/IDR',
    });

    expect(mockAnalytics.dataPoints.length).toBe(1);
    const dp = mockAnalytics.dataPoints[0];

    expect(dp.blobs![0]).toBe('api_request');
    expect(dp.blobs![1]).toBe('/api/v1/rates/latest');
    expect(dp.blobs![2]).toBe('GET');
    expect(dp.blobs![3]).toBe('HIT');
    expect(dp.blobs![4]).toBe('USD/IDR');

    expect(dp.doubles![0]).toBe(200);
    expect(dp.doubles![1]).toBe(2.15);
    expect(dp.indexes![0]).toBe('/api/v1/rates/latest');
  });

  it('should record currency conversion telemetry with pair and best provider', () => {
    const mockAnalytics = new MockAnalyticsEngineDataset();

    recordConversion(mockAnalytics, {
      from: 'EUR',
      to: 'IDR',
      amount: 500,
      rateType: 'sell',
      durationMs: 0.95,
      bestProvider: 'bca',
    });

    expect(mockAnalytics.dataPoints.length).toBe(1);
    const dp = mockAnalytics.dataPoints[0];

    expect(dp.blobs![0]).toBe('conversion');
    expect(dp.blobs![1]).toBe('EUR');
    expect(dp.blobs![2]).toBe('IDR');
    expect(dp.blobs![3]).toBe('sell');
    expect(dp.blobs![4]).toBe('bca');

    expect(dp.doubles![0]).toBe(500);
    expect(dp.doubles![1]).toBe(0.95);
    expect(dp.indexes![0]).toBe('EUR/IDR');
  });
});
