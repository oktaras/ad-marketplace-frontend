import { describe, expect, it } from 'vitest';
import {
  getOnboardingOnlyRedirect,
  getRequireOnboardingRedirect,
  getRoleGuardRedirect,
} from '@/app/router/guard-decisions';
import { APP_ROUTES } from '@/app/config/routes';

describe('onboarding guard decisions', () => {
  it('redirects unauthenticated users to onboarding', () => {
    const redirect = getRequireOnboardingRedirect({
      isAuthenticated: false,
      onboardingCompleted: false,
    });

    expect(redirect).toBe(APP_ROUTES.onboarding);
  });

  it('does not redirect authenticated completed users from protected routes', () => {
    const redirect = getRequireOnboardingRedirect({
      isAuthenticated: true,
      onboardingCompleted: true,
    });

    expect(redirect).toBeNull();
  });

  it('redirects completed users away from onboarding page', () => {
    const redirect = getOnboardingOnlyRedirect({
      isAuthenticated: true,
      onboardingCompleted: true,
    });

    expect(redirect).toBe(APP_ROUTES.home);
  });
});

describe('role guard decisions', () => {
  it('allows matching role', () => {
    const redirect = getRoleGuardRedirect({
      activeRole: 'advertiser',
      requiredRole: 'advertiser',
    });

    expect(redirect).toBeNull();
  });

  it('redirects advertiser away from publisher-only routes', () => {
    const redirect = getRoleGuardRedirect({
      activeRole: 'advertiser',
      requiredRole: 'publisher',
    });

    expect(redirect).toBe(APP_ROUTES.channels);
  });

  it('redirects publisher away from advertiser-only routes', () => {
    const redirect = getRoleGuardRedirect({
      activeRole: 'publisher',
      requiredRole: 'advertiser',
    });

    expect(redirect).toBe(APP_ROUTES.briefs);
  });

  it('redirects users without active role to profile for recovery', () => {
    const redirect = getRoleGuardRedirect({
      activeRole: null,
      requiredRole: 'publisher',
    });

    expect(redirect).toBe(APP_ROUTES.profile);
  });
});
