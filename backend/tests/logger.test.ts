import { describe, expect, it } from 'bun:test';
import { Writable } from 'node:stream';
import { createLogger, createChildLogger, logEvent, logger, baseLoggerOptions } from '../src/logger/index.ts';
import { createApp } from '../src/index.ts';

describe('Structured Pino Logger', () => {
  it('should format log output as valid JSON with standard schema fields', async () => {
    const logLines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        logLines.push(chunk.toString());
        callback();
      },
    });

    const testLogger = createLogger(baseLoggerOptions, stream);

    testLogger.info(
      {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'open_er_api',
        currency_pair: 'USD/IDR',
        duration_ms: 142,
      },
      'Fetched latest rates from provider'
    );

    expect(logLines.length).toBe(1);
    const parsed = JSON.parse(logLines[0]!) as Record<string, unknown>;

    // Verify required standard attributes: time, level, msg, requestId, provider, currency_pair, duration_ms
    expect(parsed.level).toBe('info');
    expect(typeof parsed.time).toBe('number');
    expect(parsed.msg).toBe('Fetched latest rates from provider');
    expect(parsed.requestId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(parsed.provider).toBe('open_er_api');
    expect(parsed.currency_pair).toBe('USD/IDR');
    expect(parsed.duration_ms).toBe(142);
  });

  it('createChildLogger should attach contextual metadata to child logs', async () => {
    const logLines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        logLines.push(chunk.toString());
        callback();
      },
    });

    const rootLogger = createLogger(baseLoggerOptions, stream);
    const child = createChildLogger({ provider: 'bca', module: 'adapter' }, rootLogger);

    child.info({ duration_ms: 45 }, 'BCA rates generated');

    expect(logLines.length).toBe(1);
    const parsed = JSON.parse(logLines[0]!) as Record<string, unknown>;

    expect(parsed.provider).toBe('bca');
    expect(parsed.module).toBe('adapter');
    expect(parsed.duration_ms).toBe(45);
    expect(parsed.msg).toBe('BCA rates generated');
  });

  it('logEvent helper should log message with metadata', async () => {
    const logLines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        logLines.push(chunk.toString());
        callback();
      },
    });

    const testLogger = createLogger(baseLoggerOptions, stream);
    logEvent(
      'warn',
      'Exchange rate anomaly detected',
      { provider: 'bi', currency_pair: 'USD/IDR', buyRate: 16000, sellRate: 15000 },
      testLogger
    );

    expect(logLines.length).toBe(1);
    const parsed = JSON.parse(logLines[0]!) as Record<string, unknown>;

    expect(parsed.level).toBe('warn');
    expect(parsed.msg).toBe('Exchange rate anomaly detected');
    expect(parsed.provider).toBe('bi');
    expect(parsed.currency_pair).toBe('USD/IDR');
  });

  it('loggerMiddleware should inject x-request-id into response headers and trace request', async () => {
    const app = createApp();

    const customRequestId = 'req-test-uuid-12345';
    const response = await app.handle(
      new Request('http://localhost/api/v1/health', {
        headers: {
          'x-request-id': customRequestId,
        },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe(customRequestId);

    // Also verify auto-generated requestId when none provided
    const autoReqResponse = await app.handle(new Request('http://localhost/api/v1/health'));
    expect(autoReqResponse.status).toBe(200);
    expect(autoReqResponse.headers.get('x-request-id')).toBeTruthy();
  });
});
