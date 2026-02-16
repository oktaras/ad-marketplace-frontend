import { AxiosError } from 'axios';
import { ApiError } from '@/shared/api/generated';

type ErrorBody = {
  error?: unknown;
  message?: unknown;
  code?: unknown;
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

function hasInvalidTelegramInitDataMessage(errorText: unknown, messageText: unknown): boolean {
  const values = [errorText, messageText];

  return values.some((value) => {
    if (typeof value !== 'string') {
      return false;
    }

    return value.toLowerCase().includes('invalid telegram init data');
  });
}

function readErrorBody(body: unknown): ErrorBody | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  return body as ErrorBody;
}

export const TELEGRAM_INIT_DATA_RESTART_MESSAGE =
  'Telegram session expired. Please restart the Mini App from Telegram.';

export function isInvalidTelegramInitDataError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const body = readErrorBody(error.body);
    const hasInvalidMessage = hasInvalidTelegramInitDataMessage(body?.error, body?.message)
      || hasInvalidTelegramInitDataMessage(error.message, null);

    return error.status === 401 && hasInvalidMessage;
  }

  if (error instanceof AxiosError) {
    const body = readErrorBody(error.response?.data);
    const hasInvalidMessage = hasInvalidTelegramInitDataMessage(body?.error, body?.message)
      || hasInvalidTelegramInitDataMessage(error.message, null);

    return error.response?.status === 401 && hasInvalidMessage;
  }

  if (error instanceof Error) {
    return hasInvalidTelegramInitDataMessage(error.message, null);
  }

  return false;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isInvalidTelegramInitDataError(error)) {
    return TELEGRAM_INIT_DATA_RESTART_MESSAGE;
  }

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
