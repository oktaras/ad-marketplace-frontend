import { APP_ROUTES } from '@/app/config/routes';
import { getDefaultRouteForRole } from '@/app/router/role-routing';
import type { ActiveRole } from '@/features/auth/model/roles';

type OnboardingGuardInput = {
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
};

type RoleGuardInput = {
  activeRole: ActiveRole;
  requiredRole: Exclude<ActiveRole, null>;
};

export function getRequireOnboardingRedirect(input: OnboardingGuardInput): string | null {
  if (!input.isAuthenticated || !input.onboardingCompleted) {
    return APP_ROUTES.onboarding;
  }

  return null;
}

export function getOnboardingOnlyRedirect(input: OnboardingGuardInput): string | null {
  if (input.isAuthenticated && input.onboardingCompleted) {
    return APP_ROUTES.home;
  }

  return null;
}

export function getRoleGuardRedirect(input: RoleGuardInput): string | null {
  if (input.activeRole === input.requiredRole) {
    return null;
  }

  return getDefaultRouteForRole(input.activeRole);
}
