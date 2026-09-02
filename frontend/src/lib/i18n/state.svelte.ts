import type { SupportedLocale } from './types';

// Polyfill $state for non-compiled test/SSR environments
if (typeof (globalThis as any).$state !== 'function') {
  (globalThis as any).$state = (init: any) => init;
}

function getInitialLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('kurs_world_locale');
    if (saved === 'id' || saved === 'en') {
      return saved;
    }
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('en')) {
      return 'en';
    }
  }
  return 'id';
}

class ReactiveLocaleState {
  current = $state<SupportedLocale>(getInitialLocale());

  set(newLocale: SupportedLocale) {
    if (newLocale !== this.current) {
      this.current = newLocale;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kurs_world_locale', newLocale);
        document.documentElement.lang = newLocale;
      }
    }
  }
}

export const localeState = new ReactiveLocaleState();
