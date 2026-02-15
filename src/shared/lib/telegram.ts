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

  return encoded.trim() ? encoded : undefined;
}

function getTelegramInitDataParams(): URLSearchParams | null {
  const initData = getTelegramInitData();

  if (!initData) {
    return null;
  }

  return new URLSearchParams(initData);
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
