/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_TON_CONNECT_MANIFEST_URL: string;
  readonly VITE_TELEGRAM_SUPPORT_URL: string | undefined;
  readonly VITE_FORCE_THEME: 'light' | 'dark' | undefined;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_FEATURE_CHANNEL_ANALYTICS: string;
  readonly VITE_FEATURE_TON_ESCROW: string;
  readonly VITE_DEAL_CHAT_DELETE_TOPICS_ON_CLOSE: string;
  readonly VITE_SUPPORTED_CURRENCIES: string | undefined;
  readonly VITE_DEFAULT_CURRENCY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
