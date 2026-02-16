import { afterEach, describe, expect, it } from 'vitest';
import { getTelegramStartParam } from '@/shared/lib/telegram';

function setTelegramWebApp(value: unknown): void {
  Object.defineProperty(window, 'Telegram', {
    configurable: true,
    writable: true,
    value: { WebApp: value },
  });
}

describe('getTelegramStartParam', () => {
  afterEach(() => {
    setTelegramWebApp(undefined);
    window.history.replaceState({}, '', '/');
  });

  it('reads start param from Telegram WebApp initDataUnsafe first', () => {
    setTelegramWebApp({
      initDataUnsafe: {
        start_param: 'deals-cmloaj26c0015s801ffbe3lcq',
      },
    });

    expect(getTelegramStartParam()).toBe('deals-cmloaj26c0015s801ffbe3lcq');
  });

  it('reads start param from initData payload', () => {
    setTelegramWebApp({
      initData: 'start_param=deals-cmloaj26c0015s801ffbe3lcq',
    });

    expect(getTelegramStartParam()).toBe('deals-cmloaj26c0015s801ffbe3lcq');
  });

  it('reads tgWebAppStartParam from URL query', () => {
    window.history.replaceState({}, '', '/?tgWebAppStartParam=deals-cmloaj26c0015s801ffbe3lcq');

    expect(getTelegramStartParam()).toBe('deals-cmloaj26c0015s801ffbe3lcq');
  });

  it('reads tgWebAppStartParam from URL hash', () => {
    window.history.replaceState({}, '', '/#tgWebAppStartParam=deals-cmloaj26c0015s801ffbe3lcq');

    expect(getTelegramStartParam()).toBe('deals-cmloaj26c0015s801ffbe3lcq');
  });
});
