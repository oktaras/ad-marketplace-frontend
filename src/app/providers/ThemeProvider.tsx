import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isColorDark, type RGB } from '@tma.js/sdk-react';
import { ThemeProvider as UiKitThemeProvider } from '@telegram-tools/ui-kit';
import { useTma } from '@/app/providers/TmaProvider';
import { getStoredThemeMode, setStoredThemeMode } from '@/shared/theme/mode';
import type { ThemeMode } from '@/shared/theme/mode';
import { ThemeModeContext } from '@/app/providers/theme-mode';

type Props = {
  children: ReactNode;
};

type ResolvedTheme = 'light' | 'dark';

const LIGHT_CHROME = {
  background: '#fafafa' as RGB,
  header: '#ffffff' as RGB, 
};

const DARK_CHROME = {
  background: '#12161f' as RGB,
  header: '#1f2631' as RGB,
};

function getTelegramThemeBackground(themeParams: typeof import('@tma.js/sdk-react').themeParams): RGB | undefined {
  return themeParams.bgColor() ?? themeParams.secondaryBgColor() ?? themeParams.sectionBgColor();
}

function getTelegramThemeHeader(themeParams: typeof import('@tma.js/sdk-react').themeParams): RGB | undefined {
  return themeParams.headerBgColor() ?? themeParams.secondaryBgColor() ?? themeParams.bgColor();
}

/**
 * Theme provider with user preference support.
 * - Auto mode: follows Telegram's colorScheme
 * - Light/Dark mode: uses fixed theme regardless of Telegram
 * - Defaults to Auto on first load
 */
export function ThemeProvider({ children }: Props) {
  const { colorScheme: telegramColorScheme, themeParams, miniApp, isInTelegram } = useTma();
  
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return getStoredThemeMode();
  });

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    setStoredThemeMode(nextMode);
  }, []);

  const telegramAutoTheme = useMemo<ResolvedTheme>(() => {
    if (!themeParams) return telegramColorScheme === 'dark' ? 'dark' : 'light';
    
    const backgroundColor = getTelegramThemeBackground(themeParams);
    if (backgroundColor) {
      try {
        return isColorDark(backgroundColor) ? 'dark' : 'light';
      } catch {
        // Fall back to Telegram colorScheme when params are malformed.
      }
    }
    return telegramColorScheme === 'dark' ? 'dark' : 'light';
  }, [telegramColorScheme, themeParams]);

  // Determine the actual theme to apply
  const appliedTheme = useMemo<ResolvedTheme>(() => {
    if (mode === 'auto') {
      return telegramAutoTheme;
    }
    return mode;
  }, [mode, telegramAutoTheme]);

  const chromeColors = useMemo<{
    header: RGB;
    background: RGB;
  }>(() => {
    if (mode === 'auto' && themeParams) {
      const fallback = appliedTheme === 'dark' ? DARK_CHROME : LIGHT_CHROME;
      return {
        header: getTelegramThemeHeader(themeParams) ?? fallback.header,
        background: getTelegramThemeBackground(themeParams) ?? fallback.background,
      };
    }

    return appliedTheme === 'dark' ? DARK_CHROME : LIGHT_CHROME;
  }, [appliedTheme, mode, themeParams]);

  useEffect(() => {
    if (!isInTelegram || !miniApp) {
      return;
    }

    try {
      // In v3, setHeaderColor and setBgColor handle support checks internally
      miniApp.setHeaderColor(chromeColors.header);
    } catch (error) {
      console.warn('Failed to sync Mini App header color:', error);
    }

    try {
      miniApp.setBgColor(chromeColors.background);
    } catch (error) {
      console.warn('Failed to sync Mini App background color:', error);
    }
  }, [chromeColors, isInTelegram, miniApp]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
    }),
    [mode, setMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <UiKitThemeProvider theme={appliedTheme}>{children}</UiKitThemeProvider>
    </ThemeModeContext.Provider>
  );
}
