import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { getApiInitDataHeader } from '@/shared/api/runtime';
import { isInvalidTelegramInitDataError } from '@/shared/api/error';

const INTERCEPTORS_ATTACHED = Symbol('tgAdsApiInterceptorsAttached');

type InterceptorAwareAxios = AxiosInstance & {
  [INTERCEPTORS_ATTACHED]?: boolean;
};

export function setupInterceptors(instance: AxiosInstance): void {
  const target = instance as InterceptorAwareAxios;
  if (target[INTERCEPTORS_ATTACHED]) {
    return;
  }
  target[INTERCEPTORS_ATTACHED] = true;

  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const initData = getApiInitDataHeader();
    if (initData) {
      config.headers['X-Telegram-Init-Data'] = initData;
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        if (isInvalidTelegramInitDataError(error)) {
          useAuthStore.getState().markInitDataInvalid();
        } else {
          useAuthStore.getState().logout();
        }
      }

      if (error instanceof Error) {
        return Promise.reject(error);
      }

      return Promise.reject(new Error('Unknown API error'));
    },
  );
}
