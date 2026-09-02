import type { SupportedLocale } from './types';

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
  private _current: SupportedLocale = getInitialLocale();
  private _listeners = new Set<(locale: SupportedLocale) => void>();

  get current(): SupportedLocale {
    return this._current;
  }

  set current(val: SupportedLocale) {
    if (val !== this._current) {
      this._current = val;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kurs_world_locale', val);
        document.documentElement.lang = val;
      }
      this._listeners.forEach((fn) => fn(val));
    }
  }

  set(newLocale: SupportedLocale) {
    this.current = newLocale;
  }

  subscribe(callback: (locale: SupportedLocale) => void): () => void {
    this._listeners.add(callback);
    callback(this._current);
    return () => {
      this._listeners.delete(callback);
    };
  }
}

export const localeState = new ReactiveLocaleState();
