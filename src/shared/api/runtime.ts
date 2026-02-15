import { env } from '@/app/config/env';
import { OpenAPI } from '@/shared/api/generated';
import { getTelegramInitData } from '@/shared/lib/telegram';

function normalizeOpenApiBase(apiUrl: string): string {
  const trimmed = apiUrl.trim();

  if (!trimmed || trimmed === '/api') {
    return '';
  }

  if (trimmed.endsWith('/api')) {
    return trimmed.slice(0, -4);
  }

  return trimmed;
}

let configured = false;
let getTokenValue: () => string | null = () => null;
let getInitDataValue: () => string | null = () => null;

function resolveInitData(): string | undefined {
  const configuredValue = getInitDataValue()?.trim();
  if (configuredValue) {
    return configuredValue;
  }

  const runtimeValue = getTelegramInitData();
  if (runtimeValue && runtimeValue.trim()) {
    return runtimeValue;
  }

  return undefined;
}

// Configure a safe default at module load, before any query can execute.
OpenAPI.BASE = normalizeOpenApiBase(env.apiUrl);
OpenAPI.TOKEN = () => Promise.resolve(getTokenValue() ?? '');
OpenAPI.HEADERS = () => {
  const initData = resolveInitData();
  const headers: Record<string, string> = {};

  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  return Promise.resolve(headers);
};

export function configureApiRuntime(
  getToken: () => string | null,
  getInitData?: () => string | null | undefined,
): void {
  getTokenValue = getToken;
  if (getInitData) {
    getInitDataValue = () => getInitData() ?? null;
  }

  if (configured) {
    return;
  }

  configured = true;
}

export function getApiInitDataHeader(): string | undefined {
  return resolveInitData();
}
