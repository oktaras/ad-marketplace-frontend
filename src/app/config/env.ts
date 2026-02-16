import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_URL: z.string().min(1).optional(),
  VITE_TON_CONNECT_MANIFEST_URL: z.string().min(1).optional(),
  VITE_TON_NETWORK: z.enum(['mainnet', 'testnet']).optional(),
  VITE_TELEGRAM_SUPPORT_URL: z.string().optional(),
  VITE_FORCE_THEME: z.enum(['light', 'dark']).optional(),
  VITE_ENABLE_ANALYTICS: z.string().optional(),
  VITE_FEATURE_CHANNEL_ANALYTICS: z.string().optional(),
  VITE_FEATURE_TON_ESCROW: z.string().optional(),
  VITE_DEAL_CHAT_DELETE_TOPICS_ON_CLOSE: z.string().optional(),
  VITE_SUPPORTED_CURRENCIES: z.string().optional(),
  VITE_DEFAULT_CURRENCY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(import.meta.env);

if (!parsed.success) {
  // Keep startup explicit in development when env is malformed.
  throw new Error(`Invalid frontend env: ${parsed.error.message}`);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes') {
    return true;
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no') {
    return false;
  }

  return fallback;
}

function resolveManifestFallback(apiUrl: string | undefined): string {
  const fallback = `${window.location.origin}/api/tonconnect-manifest.json`;
  const normalizedApi = apiUrl?.trim();

  if (!normalizedApi || /your-domain\.com/i.test(normalizedApi)) {
    return fallback;
  }

  try {
    const resolvedApiUrl = new URL(normalizedApi, window.location.origin);
    const normalizedPath = resolvedApiUrl.pathname.replace(/\/+$/, '');

    resolvedApiUrl.pathname = `${normalizedPath}/tonconnect-manifest.json`;
    resolvedApiUrl.search = '';
    resolvedApiUrl.hash = '';

    return resolvedApiUrl.toString();
  } catch {
    return fallback;
  }
}

function resolveManifestUrl(customUrl: string | undefined, apiUrl: string | undefined): string {
  const fallback = resolveManifestFallback(apiUrl);

  if (!customUrl) {
    return fallback;
  }

  const normalized = customUrl.trim();
  if (!normalized) {
    return fallback;
  }

  // Prevent accidental placeholder from copied env templates.
  if (/your-domain\.com/i.test(normalized)) {
    return fallback;
  }

  try {
    return new URL(normalized, window.location.origin).toString();
  } catch {
    return fallback;
  }
}

function resolveTelegramSupportUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).toString();
  } catch {
    return null;
  }
}

function parseCurrencyList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const normalized = value
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => entry.length > 0);

  return Array.from(new Set(normalized));
}

function resolveSupportedCurrencies(value: string | undefined): string[] {
  const parsedCurrencies = parseCurrencyList(value);

  if (parsedCurrencies.length > 0) {
    return parsedCurrencies;
  }

  return ['TON'];
}

function resolveDefaultCurrency(value: string | undefined, supportedCurrencies: string[]): string {
  const fallback = supportedCurrencies[0];

  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return fallback;
  }

  if (!supportedCurrencies.includes(normalized)) {
    throw new Error(
      `Invalid frontend env: VITE_DEFAULT_CURRENCY must be one of [${supportedCurrencies.join(', ')}]`,
    );
  }

  return normalized;
}

const supportedCurrencies = resolveSupportedCurrencies(parsed.data.VITE_SUPPORTED_CURRENCIES);
const defaultCurrency = resolveDefaultCurrency(parsed.data.VITE_DEFAULT_CURRENCY, supportedCurrencies);

export const env = {
  apiUrl: parsed.data.VITE_API_URL ?? '/api',
  tonConnectManifestUrl: resolveManifestUrl(parsed.data.VITE_TON_CONNECT_MANIFEST_URL, parsed.data.VITE_API_URL),
  tonNetwork: parsed.data.VITE_TON_NETWORK ?? 'testnet',
  telegramSupportUrl: resolveTelegramSupportUrl(parsed.data.VITE_TELEGRAM_SUPPORT_URL),
  supportedCurrencies,
  defaultCurrency,
  forceTheme: parsed.data.VITE_FORCE_THEME,
  analyticsEnabled: parseBoolean(parsed.data.VITE_ENABLE_ANALYTICS, false),
  dealChatDeleteTopicsOnClose: parseBoolean(parsed.data.VITE_DEAL_CHAT_DELETE_TOPICS_ON_CLOSE, true),
  features: {
    channelAnalytics: parseBoolean(parsed.data.VITE_FEATURE_CHANNEL_ANALYTICS, true),
    tonEscrow: parseBoolean(parsed.data.VITE_FEATURE_TON_ESCROW, true),
  },
};
