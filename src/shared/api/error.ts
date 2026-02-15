import { AxiosError } from 'axios';
import { ApiError } from '@/shared/api/generated';

type ErrorBody = {
  error?: unknown;
  message?: unknown;
};

function readBodyMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const payload = body as ErrorBody;

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return readBodyMessage(error.body) ?? error.message ?? fallback;
  }

  if (error instanceof AxiosError) {
    return readBodyMessage(error.response?.data) ?? error.message ?? fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
