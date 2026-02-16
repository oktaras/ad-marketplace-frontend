import { miniApp, requestContact } from '@tma.js/sdk-react';

function getTelegramHashParams(): URLSearchParams | null {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (!hash) {
    return null;
  }

  return new URLSearchParams(hash);
}

function getTelegramQueryParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function firstNonEmpty(params: URLSearchParams | null, keys: string[]): string | undefined {
  if (!params) {
    return undefined;
  }

  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim()) {
      return value;
    }
  }

  return undefined;
}

export function getTelegramInitData(): string | undefined {
  const webAppInitData = window.Telegram?.WebApp?.initData;

  if (webAppInitData && webAppInitData.trim()) {
    return webAppInitData;
  }

  const params = getTelegramHashParams();
  const encoded = params?.get('tgWebAppData');

  if (!encoded) {
    return undefined;
  }

  const normalized = encoded.trim();
  if (!normalized) {
    return undefined;
  }

  try {
    // Hash launch params store tgWebAppData URL-encoded.
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

function getTelegramInitDataParams(): URLSearchParams | null {
  const initData = getTelegramInitData();

  if (!initData) {
    return null;
  }

  return new URLSearchParams(initData);
}

export type TelegramInitUser = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  languageCode: string | null;
};

function normalizeTelegramInitUser(raw: unknown): TelegramInitUser | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const value = raw as Record<string, unknown>;
  const idRaw = value.id;
  const id = typeof idRaw === 'number'
    ? String(idRaw)
    : typeof idRaw === 'string' && idRaw.trim()
      ? idRaw.trim()
      : null;

  if (!id) {
    return null;
  }

  const usernameRaw = value.username;
  const username = typeof usernameRaw === 'string' && usernameRaw.trim()
    ? usernameRaw.replace(/^@+/, '').trim()
    : null;

  const firstNameRaw = value.first_name ?? value.firstName;
  const firstName = typeof firstNameRaw === 'string' && firstNameRaw.trim()
    ? firstNameRaw.trim()
    : null;

  const lastNameRaw = value.last_name ?? value.lastName;
  const lastName = typeof lastNameRaw === 'string' && lastNameRaw.trim()
    ? lastNameRaw.trim()
    : null;

  const photoUrlRaw = value.photo_url ?? value.photoUrl;
  const photoUrl = typeof photoUrlRaw === 'string' && photoUrlRaw.trim()
    ? photoUrlRaw.trim()
    : null;

  const languageCodeRaw = value.language_code ?? value.languageCode;
  const languageCode = typeof languageCodeRaw === 'string' && languageCodeRaw.trim()
    ? languageCodeRaw.trim()
    : null;

  return {
    id,
    username,
    firstName,
    lastName,
    photoUrl,
    languageCode,
  };
}

export function getTelegramInitUser(): TelegramInitUser | null {
  const fromWebApp = normalizeTelegramInitUser(window.Telegram?.WebApp?.initDataUnsafe?.user);
  if (fromWebApp) {
    return fromWebApp;
  }

  const rawUser = getTelegramInitDataParams()?.get('user');
  if (!rawUser) {
    return null;
  }

  try {
    return normalizeTelegramInitUser(JSON.parse(rawUser));
  } catch {
    return null;
  }
}

export function getTelegramStartParam(): string | undefined {
  const fromWebApp = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (fromWebApp && fromWebApp.trim()) {
    return fromWebApp;
  }

  const fromInitData = getTelegramInitDataParams()?.get('start_param');
  if (fromInitData && fromInitData.trim()) {
    return fromInitData;
  }

  // Telegram launch params are often passed as URL params (desktop/web clients).
  const fromQuery = firstNonEmpty(getTelegramQueryParams(), ['tgWebAppStartParam', 'startapp', 'start']);
  if (fromQuery) {
    return fromQuery;
  }

  const fromHash = firstNonEmpty(getTelegramHashParams(), ['tgWebAppStartParam', 'startapp', 'start']);
  if (fromHash) {
    return fromHash;
  }

  return undefined;
}

export function getTelegramLanguageCode(): string | undefined {
  const fromWebApp = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (fromWebApp && fromWebApp.trim()) {
    return fromWebApp;
  }

  const rawUser = getTelegramInitDataParams()?.get('user');
  if (!rawUser) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawUser) as { language_code?: unknown };
    return typeof parsed.language_code === 'string' ? parsed.language_code : undefined;
  } catch {
    return undefined;
  }
}

export type TelegramSharedContact = {
  userId: number;
  phoneNumber: string;
  firstName: string;
  lastName: string | null;
};

export async function requestTelegramContact(): Promise<TelegramSharedContact> {
  try {
    // In v3, requestContact returns a BetterPromise (auto-converted from TaskEither)
    const result = await requestContact();

    return {
      userId: result.contact.user_id,
      phoneNumber: result.contact.phone_number,
      firstName: result.contact.first_name,
      lastName: result.contact.last_name ?? null,
    };
  } catch (error) {
    throw new Error('Phone sharing is not supported or user denied access.');
  }
}
