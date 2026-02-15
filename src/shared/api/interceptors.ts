import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { getTelegramInitData } from '@/shared/lib/telegram';

export function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const initData = getTelegramInitData();
    if (initData) {
      config.headers['X-Telegram-Init-Data'] = initData;
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        useAuthStore.getState().logout();
      }

      if (error instanceof Error) {
        return Promise.reject(error);
      }

      return Promise.reject(new Error('Unknown API error'));
    },
  );
}
