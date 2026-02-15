import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { configureApiRuntime } from '@/shared/api/runtime';
import { useTma } from '@/app/providers/TmaProvider';
import { getTelegramInitData } from '@/shared/lib/telegram';
import { AlertCircle } from 'lucide-react';

type Props = {
  children: ReactNode;
};

export function AuthBootstrapProvider({ children }: Props) {
  const { initDataRaw, isReady } = useTma();
  const authenticate = useAuthStore((state) => state.authenticate);
  const lastBootstrappedInitData = useRef<string | null>(null);
  const resolvedInitData = (initDataRaw?.trim() || getTelegramInitData()?.trim() || '');
  const missingInitData = isReady && !resolvedInitData;

  useEffect(() => {
    configureApiRuntime(
      () => useAuthStore.getState().token,
      () => resolvedInitData || null,
    );

    if (!isReady) {
      return;
    }

    const normalizedInitData = resolvedInitData;

    if (!normalizedInitData) {
      lastBootstrappedInitData.current = null;
      void authenticate('');
      return;
    }

    if (lastBootstrappedInitData.current === normalizedInitData) {
      return;
    }

    lastBootstrappedInitData.current = normalizedInitData;
    void authenticate(normalizedInitData);
  }, [authenticate, initDataRaw, isReady, resolvedInitData]);

  if (!isReady) {
    return null;
  }

  if (missingInitData) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420, display: 'grid', gap: 12, justifyItems: 'center' }}>
          <AlertCircle size={28} />
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Telegram Launch Data Is Missing</h1>
          <p style={{ color: 'var(--color-foreground-secondary)' }}>
            Open this Mini App from Telegram to continue. Direct browser access is blocked.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
