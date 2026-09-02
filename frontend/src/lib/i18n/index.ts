import { idTranslations } from './locales/id';
import { enTranslations } from './locales/en';
import type { SupportedLocale, TranslationParams } from './types';
export * from './types';

// Map of translations
const translations: Record<SupportedLocale, typeof idTranslations> = {
  id: idTranslations,
  en: enTranslations,
};

// Initial locale detection (localStorage -> browser language -> 'id')
function getInitialLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('kurs_world_locale');
    if (saved === 'id' || saved === 'en') {
      return saved;
    }
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('en')) {
      return 'en';
    }
  }
  return 'id';
}

// Reactive state container using an internal closure / module state
let currentLocaleState = getInitialLocale();
const listeners = new Set<(locale: SupportedLocale) => void>();

export function getLocale(): SupportedLocale {
  return currentLocaleState;
}

export function setLocale(newLocale: SupportedLocale) {
  if (newLocale !== currentLocaleState) {
    currentLocaleState = newLocale;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kurs_world_locale', newLocale);
      document.documentElement.lang = newLocale;
    }
    listeners.forEach(fn => fn(newLocale));
  }
}

export function subscribeLocale(callback: (locale: SupportedLocale) => void): () => void {
  listeners.add(callback);
  callback(currentLocaleState);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Main translation function with dot-notation key lookup and parameter interpolation
 * Example: t('navbar.disclaimerStrip') or t('matrix.pagination', { from: 1, to: 20, total: 195 })
 */
export function t(keyPath: string, params?: TranslationParams, targetLocale?: SupportedLocale): string {
  const activeLocale = targetLocale || currentLocaleState;
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
  const locale = currentLocaleState === 'en' ? 'en-US' : 'id-ID';

  if (currencyCode === 'IDR') {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: showFraction ? 2 : 0,
      maximumFractionDigits: showFraction ? 2 : 0,
    }).format(amount);

    return withPrefix ? (currentLocaleState === 'en' ? `IDR ${formatted}` : `Rp ${formatted}`) : formatted;
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
    const locale = currentLocaleState === 'en' ? 'en-US' : 'id-ID';
    return d.toLocaleDateString(locale, options || { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
}
