import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { configureApiRuntime } from '@/shared/api/runtime';
import { useTma } from '@/app/providers/TmaProvider';

type Props = {
  children: ReactNode;
};

let didBootstrap = false;

export function AuthBootstrapProvider({ children }: Props) {
  const { initDataRaw } = useTma();
  const authenticate = useAuthStore((state) => state.authenticate);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);

  useEffect(() => {
    configureApiRuntime(() => useAuthStore.getState().token);

    if (didBootstrap) {
      return;
    }

    didBootstrap = true;

    if (!initDataRaw) {
      setBootstrapping(false);
      return;
    }

    void authenticate(initDataRaw);
  }, [authenticate, setBootstrapping, initDataRaw]);

  return <>{children}</>;
}
