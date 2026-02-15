import { env } from '@/app/config/env';

export type CryptoCurrency = string;

const CURRENCY_ICON_MAP: Record<string, string> = {
  TON: '💎',
};

function getCurrencyIcon(currency: string): string {
  return CURRENCY_ICON_MAP[currency] || '¤';
}

export const DEFAULT_CURRENCY: CryptoCurrency = env.defaultCurrency;

export const SUPPORTED_CURRENCIES: Array<{
  value: CryptoCurrency;
  label: string;
  icon: string;
  available: boolean;
}> = env.supportedCurrencies.map((currency) => ({
  value: currency,
  label: currency,
  icon: getCurrencyIcon(currency),
  available: true,
}));

const SUPPORTED_CURRENCY_SET = new Set(
  SUPPORTED_CURRENCIES.map((currency) => currency.value.trim().toUpperCase()),
);

export function isSupportedCurrency(value: string | null | undefined): value is CryptoCurrency {
  const normalized = (value || '').trim().toUpperCase();
  return normalized.length > 0 && SUPPORTED_CURRENCY_SET.has(normalized);
}

export function normalizeCurrency(
  value: string | null | undefined,
  fallback: CryptoCurrency = DEFAULT_CURRENCY,
): CryptoCurrency {
  const normalized = (value || '').trim().toUpperCase();
  if (normalized.length > 0 && SUPPORTED_CURRENCY_SET.has(normalized)) {
    return normalized;
  }

  const normalizedFallback = fallback.trim().toUpperCase();
  if (normalizedFallback.length > 0 && SUPPORTED_CURRENCY_SET.has(normalizedFallback)) {
    return normalizedFallback;
  }

  return DEFAULT_CURRENCY;
}
