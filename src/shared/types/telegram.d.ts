export {};

declare global {
  type TelegramWebAppColorScheme = 'light' | 'dark';

  interface TelegramWebAppInitDataUnsafe {
    start_param?: string;
    user?: {
      id?: number | string;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      language_code?: string;
    };
  }

  interface TelegramSafeAreaInset {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }

  interface TelegramWebApp {
    initData?: string;
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;
    colorScheme?: TelegramWebAppColorScheme;
    platform?: string;
    version?: string;
    viewportHeight?: number;
    viewportStableHeight?: number;
    isExpanded?: boolean;
    isFullscreen?: boolean;
    safeAreaInset?: TelegramSafeAreaInset;
    contentSafeAreaInset?: TelegramSafeAreaInset;
    ready: () => void;
    expand: () => void;
    enableClosingConfirmation: () => void;
    disableClosingConfirmation?: () => void;
    enableVerticalSwipes?: () => void;
    disableVerticalSwipes?: () => void;
    onEvent?: (eventType: string, handler: () => void) => void;
    offEvent?: (eventType: string, handler: () => void) => void;
    openTelegramLink?: (url: string) => void;
    openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
    close?: () => void;
    setHeaderColor: (color: string) => void;
    BackButton?: {
      show: () => void;
      hide: () => void;
      onClick: (handler: () => void) => void;
      offClick: (handler: () => void) => void;
    };
  }

  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
