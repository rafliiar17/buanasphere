import { describe, it, expect, beforeEach } from 'bun:test';
import { getTheme, setTheme, toggleTheme, subscribeTheme } from '../src/lib/theme';

describe('Dark/Light Theme System (Default Dark)', () => {
  beforeEach(() => {
    setTheme('dark');
  });

  it('should initialize with dark theme by default', () => {
    expect(getTheme()).toBe('dark');
  });

  it('should switch to light theme using setTheme', () => {
    setTheme('light');
    expect(getTheme()).toBe('light');
  });

  it('should toggle between dark and light themes using toggleTheme', () => {
    expect(getTheme()).toBe('dark');
    
    const nextTheme = toggleTheme();
    expect(nextTheme).toBe('light');
    expect(getTheme()).toBe('light');

    const backToDark = toggleTheme();
    expect(backToDark).toBe('dark');
    expect(getTheme()).toBe('dark');
  });

  it('should notify subscribers when theme changes', () => {
    const themeHistory: string[] = [];
    const unsub = subscribeTheme((theme) => {
      themeHistory.push(theme);
    });

    setTheme('light');
    setTheme('dark');
    unsub();
    setTheme('light'); // should not be captured after unsub

    expect(themeHistory).toEqual(['dark', 'light', 'dark']);
  });
});
