export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'theme-mode';

export function getStoredThemeMode(): ThemeMode {
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto';
}

export function setStoredThemeMode(mode: ThemeMode): void {
  window.localStorage.setItem(STORAGE_KEY, mode);
}
