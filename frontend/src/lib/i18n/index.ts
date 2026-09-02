import { idTranslations } from './locales/id';
import { enTranslations } from './locales/en';
import type { SupportedLocale, TranslationParams } from './types';
import { localeState } from './state.svelte';
export * from './types';
export * from './iso-countries';

// Map of translations
const translations: Record<SupportedLocale, typeof idTranslations> = {
  id: idTranslations,
  en: enTranslations,
};

const listeners = new Set<(locale: SupportedLocale) => void>();

export function getLocale(): SupportedLocale {
  return localeState.current;
}

export function setLocale(newLocale: SupportedLocale) {
  localeState.set(newLocale);
  listeners.forEach(fn => fn(newLocale));
}

export function subscribeLocale(callback: (locale: SupportedLocale) => void): () => void {
  listeners.add(callback);
  callback(localeState.current);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Main translation function with dot-notation key lookup and parameter interpolation.
 * Accesses localeState.current so that Svelte 5 automatically tracks reactivity in components!
 */
export function t(keyPath: string, params?: TranslationParams, targetLocale?: SupportedLocale): string {
  const activeLocale = targetLocale || localeState.current;
  const dict = translations[activeLocale] || translations.id;
  const fallbackDict = translations.id;

  const keys = keyPath.split('.');
  let current: any = dict;
  let fallback: any = fallbackDict;

  for (const k of keys) {
    current = current?.[k];
    fallback = fallback?.[k];
  }

  let text = typeof current === 'string' ? current : typeof fallback === 'string' ? fallback : keyPath;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }

  return text;
}

/**
 * Locale-aware Number & Currency Formatter
 */
export function formatCurrencyLocale(
  amount: number,
  currencyCode = 'IDR',
  options: { showFraction?: boolean; withPrefix?: boolean } = {}
): string {
  const { showFraction = false, withPrefix = true } = options;
  const activeLocale = localeState.current;
  const locale = activeLocale === 'en' ? 'en-US' : 'id-ID';

  if (currencyCode === 'IDR') {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: showFraction ? 2 : 0,
      maximumFractionDigits: showFraction ? 2 : 0,
    }).format(amount);

    return withPrefix ? (activeLocale === 'en' ? `IDR ${formatted}` : `Rp ${formatted}`) : formatted;
  }

  return new Intl.NumberFormat(locale, {
    style: withPrefix ? 'currency' : 'decimal',
    currency: currencyCode,
    minimumFractionDigits: showFraction ? 2 : 0,
    maximumFractionDigits: showFraction ? 2 : 0,
  }).format(amount);
}

export function formatDateLocale(dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    const activeLocale = localeState.current;
    const locale = activeLocale === 'en' ? 'en-US' : 'id-ID';
    return d.toLocaleDateString(locale, options || { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
}

export function formatTimeLocale(dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    const activeLocale = localeState.current;
    const locale = activeLocale === 'en' ? 'en-US' : 'id-ID';
    return d.toLocaleTimeString(locale, options || { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

export function formatDateTimeLocale(dateInput: string | number | Date): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    const activeLocale = localeState.current;
    const locale = activeLocale === 'en' ? 'en-US' : 'id-ID';
    const dateStr = d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return '-';
  }
}

/**
 * Get localized region label based on active locale
 */
export function getLocalizedRegion(regionId: string, targetLocale?: SupportedLocale): string {
  const activeLocale = targetLocale || localeState.current;
  const key = `map.regions.${regionId}`;
  const translated = t(key, undefined, activeLocale);
  if (translated !== key) return translated;
  return regionId;
}
