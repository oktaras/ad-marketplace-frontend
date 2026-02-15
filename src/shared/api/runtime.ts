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

// Configure a safe default at module load, before any query can execute.
OpenAPI.BASE = normalizeOpenApiBase(env.apiUrl);
OpenAPI.TOKEN = () => Promise.resolve(getTokenValue() ?? '');
OpenAPI.HEADERS = () => {
  const initData = getTelegramInitData();
  const headers: Record<string, string> = {};

  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  return Promise.resolve(headers);
};

export function configureApiRuntime(getToken: () => string | null): void {
  getTokenValue = getToken;

  if (configured) {
    return;
  }

  configured = true;
}
