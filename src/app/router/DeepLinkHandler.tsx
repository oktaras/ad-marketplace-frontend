import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseDeepLink } from '@/app/config/deep-links';
import { resolveRoleSafePath } from '@/app/router/role-routing';
import { getTelegramStartParam } from '@/shared/lib/telegram';
import { useAuthStore } from '@/features/auth/model/auth.store';

type Props = {
  children: ReactNode;
};

export function DeepLinkHandler({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const activeRole = useAuthStore((state) => state.activeRole);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current || isBootstrapping || !isAuthenticated || !onboardingCompleted) {
      return;
    }

    handledRef.current = true;

    const startParam = getTelegramStartParam();
    const parsedTargetPath = parseDeepLink(startParam);

    if (!parsedTargetPath) {
      return;
    }

    const safeTargetPath = resolveRoleSafePath(parsedTargetPath, activeRole);

    if (safeTargetPath === location.pathname) {
      return;
    }

    void navigate(safeTargetPath, { replace: true });
  }, [activeRole, isAuthenticated, isBootstrapping, onboardingCompleted, location.pathname, navigate]);

  return <>{children}</>;
}
