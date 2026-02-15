import type { ReactNode } from 'react';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { TonProvider } from '@/app/providers/TonProvider';
import { TmaProvider } from '@/app/providers/TmaProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { ToastProvider } from '@/app/providers/ToastProvider';
import { I18nProvider } from '@/app/providers/I18nProvider';
import { AuthBootstrapProvider } from '@/app/providers/AuthBootstrapProvider';
import { AppErrorBoundary } from '@/app/providers/AppErrorBoundary';

type Props = {
  children: ReactNode;
};

/**
 * Root provider composition for the app.
 * Order matters - TmaProvider must be outermost to provide TMA context to all others.
 */
export function AppProviders({ children }: Props) {
  return (
    <TmaProvider>
      <AppErrorBoundary>
        <TonProvider>
          <QueryProvider>
            <I18nProvider>
              <ThemeProvider>
                <ToastProvider>
                  <AuthBootstrapProvider>{children}</AuthBootstrapProvider>
                </ToastProvider>
              </ThemeProvider>
            </I18nProvider>
          </QueryProvider>
        </TonProvider>
      </AppErrorBoundary>
    </TmaProvider>
  );
}
