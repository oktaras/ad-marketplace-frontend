import { createContext, useContext } from 'react';
import type { ThemeMode } from '@/shared/theme/mode';

export type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeModeContext = createContext<ThemeContextValue | null>(null);

export function useThemeMode(): ThemeContextValue {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }

  return context;
}
