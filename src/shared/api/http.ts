import axios from 'axios';
import { env } from '@/app/config/env';
import { setupInterceptors } from '@/shared/api/interceptors';

function normalizeAxiosBase(apiUrl: string): string {
  const trimmed = apiUrl.trim();

  if (!trimmed) {
    return '/api';
  }

  if (trimmed === '/api' || trimmed.endsWith('/api')) {
    return trimmed;
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return `${withoutTrailingSlash}/api`;
}

export const http = axios.create({
  baseURL: normalizeAxiosBase(env.apiUrl),
  headers: {
    'Content-Type': 'application/json',
  },
});

setupInterceptors(http);
