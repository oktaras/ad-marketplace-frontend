import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiError } from '@/shared/api/generated';

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  if (error instanceof ApiError) {
    return !NON_RETRYABLE_STATUSES.has(error.status);
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return !status || !NON_RETRYABLE_STATUSES.has(status);
  }

  return true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 8_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

type Props = {
  children: ReactNode;
};

export function QueryProvider({ children }: Props) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
