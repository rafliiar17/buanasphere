export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'kurs_world_theme';

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  }
  // User requested default dark
  return 'dark';
}

let currentTheme: Theme = getInitialTheme();
const listeners = new Set<(theme: Theme) => void>();

export function getTheme(): Theme {
  return currentTheme;
}

export function applyThemeToDOM(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
}

export function setTheme(newTheme: Theme) {
  currentTheme = newTheme;
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }
  applyThemeToDOM(newTheme);
  listeners.forEach(fn => fn(newTheme));
}

export function toggleTheme(): Theme {
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function subscribeTheme(callback: (theme: Theme) => void): () => void {
  listeners.add(callback);
  callback(currentTheme);
  return () => {
    listeners.delete(callback);
  };
}
