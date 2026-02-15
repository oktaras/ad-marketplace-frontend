import { APP_ROUTES } from '@/app/config/routes';
import type { ActiveRole } from '@/features/auth/model/roles';

type AssignedRole = Exclude<ActiveRole, null>;

const ADVERTISER_ONLY_PATTERNS: RegExp[] = [
  /^\/listings$/,
  /^\/listings\/[^/]+$/,
  /^\/channels$/,
  /^\/channels\/[^/]+$/,
  /^\/my-briefs$/,
  /^\/create-brief$/,
];

const PUBLISHER_ONLY_PATTERNS: RegExp[] = [
  /^\/my-channels$/,
  /^\/briefs$/,
  /^\/briefs\/[^/]+$/,
  /^\/briefs\/[^/]+\/applications$/,
  /^\/listings\/[^/]+\/settings$/,
  /^\/channels\/[^/]+\/settings$/,
  /^\/create-listing$/,
];

function normalizePathname(pathname: string): string {
  const withoutHash = pathname.split('#')[0] ?? pathname;
  const withoutQuery = withoutHash.split('?')[0] ?? withoutHash;
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const collapsedSlashes = withLeadingSlash.replace(/\/{2,}/g, '/');

  if (collapsedSlashes.length > 1 && collapsedSlashes.endsWith('/')) {
    return collapsedSlashes.slice(0, -1);
  }

  return collapsedSlashes;
}

function matchesAny(pathname: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(pathname));
}

export function getRequiredRoleForPath(pathname: string): AssignedRole | null {
  const normalizedPath = normalizePathname(pathname);

  if (matchesAny(normalizedPath, ADVERTISER_ONLY_PATTERNS)) {
    return 'advertiser';
  }

  if (matchesAny(normalizedPath, PUBLISHER_ONLY_PATTERNS)) {
    return 'publisher';
  }

  return null;
}

export function getDefaultRouteForRole(activeRole: ActiveRole): string {
  if (activeRole === 'advertiser') {
    return APP_ROUTES.channels;
  }

  if (activeRole === 'publisher') {
    return APP_ROUTES.briefs;
  }

  return APP_ROUTES.profile;
}

export function isPathAllowedForRole(pathname: string, activeRole: ActiveRole): boolean {
  const requiredRole = getRequiredRoleForPath(pathname);
  return !requiredRole || requiredRole === activeRole;
}

export function resolveRoleSafePath(pathname: string, activeRole: ActiveRole): string {
  const normalizedPath = normalizePathname(pathname);

  if (isPathAllowedForRole(normalizedPath, activeRole)) {
    return normalizedPath;
  }

  return getDefaultRouteForRole(activeRole);
}
