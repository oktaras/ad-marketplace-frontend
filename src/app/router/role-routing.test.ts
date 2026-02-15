import { describe, expect, it } from 'vitest';
import {
  getDefaultRouteForRole,
  getRequiredRoleForPath,
  isPathAllowedForRole,
  resolveRoleSafePath,
} from '@/app/router/role-routing';
import { APP_ROUTES } from '@/app/config/routes';

describe('role routing map', () => {
  it('assigns advertiser role to listings browse routes', () => {
    expect(getRequiredRoleForPath('/listings')).toBe('advertiser');
    expect(getRequiredRoleForPath('/listings/123')).toBe('advertiser');
  });

  it('assigns publisher role to briefs and settings routes', () => {
    expect(getRequiredRoleForPath('/briefs')).toBe('publisher');
    expect(getRequiredRoleForPath('/briefs/123/applications')).toBe('publisher');
    expect(getRequiredRoleForPath('/listings/123/settings')).toBe('publisher');
  });

  it('treats public routes as unrestricted', () => {
    expect(getRequiredRoleForPath('/')).toBeNull();
    expect(getRequiredRoleForPath('/deals/1')).toBeNull();
    expect(getRequiredRoleForPath('/profile')).toBeNull();
  });
});

describe('role routing decisions', () => {
  it('allows access for matching role', () => {
    expect(isPathAllowedForRole('/my-briefs', 'advertiser')).toBe(true);
    expect(isPathAllowedForRole('/briefs', 'publisher')).toBe(true);
    expect(isPathAllowedForRole('/channels', 'advertiser')).toBe(true);
  });

  it('blocks access for wrong role', () => {
    expect(isPathAllowedForRole('/my-briefs', 'publisher')).toBe(false);
    expect(isPathAllowedForRole('/my-channels', 'advertiser')).toBe(false);
  });

  it('resolves fallback to role-appropriate route when path is forbidden', () => {
    expect(resolveRoleSafePath('/my-briefs', 'publisher')).toBe(APP_ROUTES.briefs);
    expect(resolveRoleSafePath('/briefs', 'advertiser')).toBe(APP_ROUTES.channels);
  });

  it('resolves fallback to profile when no active role exists', () => {
    expect(resolveRoleSafePath('/briefs', null)).toBe(APP_ROUTES.profile);
    expect(getDefaultRouteForRole(null)).toBe(APP_ROUTES.profile);
  });
});
