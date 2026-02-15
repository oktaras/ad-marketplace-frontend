import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { createContext, useContext } from 'react';
import { init, retrieveLaunchParams } from '@tma.js/sdk';
import {
  backButton,
  closingBehavior,
  miniApp,
  popup,
  settingsButton,
  themeParams,
  viewport,
  postEvent,
} from '@tma.js/sdk-react';

// Use typeof to get the types from the singleton instances
type BackButton = typeof backButton;
type ClosingBehavior = typeof closingBehavior;
type MiniApp = typeof miniApp;
type Popup = typeof popup;
type SettingsButton = typeof settingsButton;
type ThemeParams = typeof themeParams;
type Viewport = typeof viewport;

type TmaSdkComponents = {
  backButton: BackButton | null;
  miniApp: MiniApp | null;
  viewport: Viewport | null;
  popup: Popup | null;
  settingsButton: SettingsButton | null;
  themeParams: ThemeParams | null;
  closingBehavior: ClosingBehavior | null;
};

type TmaContextValue = {
  colorScheme: 'light' | 'dark';
  initDataRaw: string | undefined;
  isInTelegram: boolean;
  backButton: BackButton | null;
  miniApp: MiniApp | null;
  viewport: Viewport | null;
  popup: Popup | null;
  settingsButton: SettingsButton | null;
  themeParams: ThemeParams | null;
  closingBehavior: ClosingBehavior | null;
};

const TmaContext = createContext<TmaContextValue | null>(null);

export function useTma(): TmaContextValue {
  const context = useContext(TmaContext);

  if (!context) {
    throw new Error('useTma must be used within TmaProvider');
  }

  return context;
}

type Props = {
  children: ReactNode;
};

const PERSISTED_TG_CSS_VAR_NAMES = [
  'tg-viewport-height',
  'tg-viewport-stable-height',
  'tg-safe-area-inset-top',
  'tg-content-safe-area-inset-top',
  'tg-safe-area-inset-bottom',
  'tg-content-safe-area-inset-bottom',
  'tg-safe-area-inset-left',
  'tg-safe-area-inset-right',
  'tg-content-safe-area-inset-left',
  'tg-content-safe-area-inset-right',
] as const;

const EMPTY_TMA_SDK_COMPONENTS: TmaSdkComponents = {
  backButton: null,
  miniApp: null,
  viewport: null,
  popup: null,
  settingsButton: null,
  themeParams: null,
  closingBehavior: null,
};

function runCleanups(cleanups: Array<VoidFunction>): void {
  for (let index = cleanups.length - 1; index >= 0; index -= 1) {
    try {
      cleanups[index]();
    } catch (error) {
      console.warn('Failed to run cleanup handler:', error);
    }
  }
}

function persistTelegramViewportCssVars(): void {
  const root = document.documentElement;
  for (const name of PERSISTED_TG_CSS_VAR_NAMES) {
    const value = root.style.getPropertyValue(`--${name}`);
    if (value) {
      root.style.setProperty(`--p${name}`, value);
    }
  }
}



/**
 * Inner component that uses TMA SDK hooks.
 */
function TmaInitializer({ children }: Props) {
  const [initDataRaw, setInitDataRaw] = useState<string | undefined>();
  const [sdkComponents, setSdkComponents] = useState<TmaSdkComponents>(() => EMPTY_TMA_SDK_COMPONENTS);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(() => {
    // Initial color scheme from Telegram WebApp
    const webApp = window.Telegram?.WebApp;
    return webApp?.colorScheme === 'dark' ? 'dark' : 'light';
  });

  // Initialize TMA features on mount
  useEffect(() => {
    const sdkCleanups: Array<VoidFunction> = [];
    let isMounted = true;
    const root = document.documentElement;
    root.dataset.tmaLoaded = '0';

    const initTma = async () => {
      try {
        // Initialize SDK first - this is required in v3
        init();
        
        // Get launch params including initData
        const launchParams = retrieveLaunchParams();
        setInitDataRaw((launchParams.initDataRaw as string) || undefined);

        // Post ready events first
        postEvent('web_app_ready');
        postEvent('iframe_ready');
        postEvent('web_app_expand');

        // Mount all components using the new API
        if (backButton.isSupported() && !backButton.isMounted()) {
          backButton.mount();
          backButton.hide();
        }

        if (!miniApp.isMounted()) {
          miniApp.mount();
        }

        if (!viewport.isMounted()) {
          await viewport.mount();
        }

        if (settingsButton.isSupported() && !settingsButton.isMounted()) {
          settingsButton.mount();
          settingsButton.hide();
        }

        if (!themeParams.isMounted()) {
          themeParams.mount();
        }

        if (!closingBehavior.isMounted()) {
          closingBehavior.mount();
        }

        // Store unmount functions for cleanup
        sdkCleanups.push(
          () => backButton.isMounted() && backButton.unmount(),
          () => miniApp.isMounted() && miniApp.unmount(),
          () => settingsButton.isMounted() && settingsButton.unmount(),
          () => themeParams.isMounted() && themeParams.unmount(),
          () => closingBehavior.isMounted() && closingBehavior.unmount(),
        );

        if (!isMounted) {
          return;
        }

        // Bind CSS variables using SDK built-in functions
        if (miniApp.bindCssVars) {
          miniApp.bindCssVars();
        }

        setSdkComponents({
          backButton,
          miniApp,
          viewport,
          popup,
          settingsButton,
          themeParams,
          closingBehavior,
        });

        // Signal to Telegram that the app is ready
        miniApp.ready();

        const webApp = window.Telegram?.WebApp;
        if (webApp?.platform) {
          root.dataset.tmaPlatform = webApp.platform;
        }

        // Setup closing behavior - disable confirmation
        postEvent('web_app_setup_closing_behavior', { need_confirmation: false });

        // Disable vertical swipe for sticky app behavior
        postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });

        // Request fullscreen and lock orientation on mobile platforms
        const platform = webApp?.platform?.toLowerCase();
        if (platform === 'ios' || platform === 'android') {
          postEvent('web_app_toggle_orientation_lock', { locked: true });
          postEvent('web_app_request_fullscreen');
        }

        // Persist critical viewport CSS variables after initial render
        setTimeout(() => {
          persistTelegramViewportCssVars();
          root.dataset.tmaLoaded = '1';
        }, 120);

      } catch (error) {
        root.dataset.tmaLoaded = '1';
        console.warn('Failed to initialize TMA SDK:', error);
      }
    };

    void initTma();

    return () => {
      isMounted = false;
      delete root.dataset.tmaLoaded;
      runCleanups(sdkCleanups);
    };
  }, []);

  // Listen for theme changes via native WebApp API
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    const handleThemeChanged = () => {
      setColorScheme(webApp.colorScheme === 'dark' ? 'dark' : 'light');
    };

    webApp.onEvent?.('themeChanged', handleThemeChanged);

    return () => {
      webApp.offEvent?.('themeChanged', handleThemeChanged);
    };
  }, []);

  const value = useMemo<TmaContextValue>(
    () => ({
      colorScheme,
      initDataRaw,
      isInTelegram: true,
      ...sdkComponents,
    }),
    [colorScheme, initDataRaw, sdkComponents],
  );

  return <TmaContext.Provider value={value}>{children}</TmaContext.Provider>;
}

/**
 * Fallback provider for non-Telegram environments (browser dev).
 */
function TmaFallback({ children }: Props) {
  delete document.documentElement.dataset.tmaPlatform;
  delete document.documentElement.dataset.tmaLoaded;

  const value = useMemo<TmaContextValue>(
    () => ({
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      initDataRaw: undefined,
      isInTelegram: false,
      ...EMPTY_TMA_SDK_COMPONENTS,
    }),
    [],
  );

  return <TmaContext.Provider value={value}>{children}</TmaContext.Provider>;
}

/**
 * TMA SDK Provider - wraps app with Telegram Mini App SDK.
 * Provides init-data, theme, back-button, and swipe behavior.
 * Falls back gracefully in non-Telegram environments.
 */
export function TmaProvider({ children }: Props) {
  // Check if we're in Telegram environment
  const isInTelegram = Boolean(
    window.Telegram?.WebApp?.initData || window.location.hash.includes('tgWebAppData'),
  );

  if (!isInTelegram) {
    return <TmaFallback>{children}</TmaFallback>;
  }

  return <TmaInitializer>{children}</TmaInitializer>;
}
