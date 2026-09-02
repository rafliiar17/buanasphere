import { describe, it, expect, beforeEach } from 'bun:test';
import { t, setLocale, getLocale } from '../src/lib/i18n';

describe('Global App Loading Splash Screen & Telemetry (ADR-0027)', () => {
  beforeEach(() => {
    setLocale('id');
  });

  it('should translate all splash telemetry keys in Indonesian', () => {
    setLocale('id');
    expect(t('splash.welcome')).toContain('Selamat Datang di Kurs.World');
    expect(t('splash.tagline')).toContain('Pasar Valuta Asing Global 195+ Negara');
    expect(t('splash.edgeConnecting')).toContain('Cloudflare Workers Edge Network');
    expect(t('splash.ratesLoading')).toContain('195+ Valuta Asing');
    expect(t('splash.uiPreparing')).toContain('Antarmuka Interaktif');
    expect(t('splash.edgeBadge')).toContain('Edge Execution <50ms');
  });

  it('should translate all splash telemetry keys in English', () => {
    setLocale('en');
    expect(t('splash.welcome')).toContain('Welcome to Kurs.World');
    expect(t('splash.tagline')).toContain('Global FX Rates for 195+ Countries');
    expect(t('splash.edgeConnecting')).toContain('Cloudflare Workers Edge Network');
    expect(t('splash.ratesLoading')).toContain('195+ World FX Exchange Rates');
    expect(t('splash.uiPreparing')).toContain('Interactive UI');
    expect(t('splash.edgeBadge')).toContain('Edge Execution <50ms');
  });
});
