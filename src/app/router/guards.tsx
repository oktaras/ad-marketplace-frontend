import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import {
  getOnboardingOnlyRedirect,
  getRequireOnboardingRedirect,
  getRoleGuardRedirect,
} from '@/app/router/guard-decisions';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { PageLoading } from '@/shared/ui/PageLoading';

type GuardProps = {
  children: ReactNode;
};

export function RequireOnboarding({ children }: GuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return <PageLoading />;
  }

  const redirectTo = getRequireOnboardingRedirect({
    isAuthenticated,
    onboardingCompleted,
  });

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export function OnboardingOnly({ children }: GuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return <PageLoading />;
  }

  const redirectTo = getOnboardingOnlyRedirect({
    isAuthenticated,
    onboardingCompleted,
  });

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

type RoleGuardProps = GuardProps & {
  requiredRole: 'advertiser' | 'publisher';
};

function RequireRole({ children, requiredRole }: RoleGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const activeRole = useAuthStore((state) => state.activeRole);

  if (isBootstrapping) {
    return <PageLoading />;
  }

  const onboardingRedirect = getRequireOnboardingRedirect({
    isAuthenticated,
    onboardingCompleted,
  });

  if (onboardingRedirect) {
    return <Navigate to={onboardingRedirect} replace />;
  }

  const roleRedirect = getRoleGuardRedirect({
    activeRole,
    requiredRole,
  });

  if (roleRedirect) {
    return <Navigate to={roleRedirect} replace state={{ reason: 'role-forbidden', requiredRole }} />;
  }

  return <>{children}</>;
}

export function RequireAdvertiser({ children }: GuardProps) {
  return <RequireRole requiredRole="advertiser">{children}</RequireRole>;
}

export function RequirePublisher({ children }: GuardProps) {
  return <RequireRole requiredRole="publisher">{children}</RequireRole>;
}
