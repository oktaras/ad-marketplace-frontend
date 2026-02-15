import { APP_ROUTES } from '@/app/config/routes';

const STATIC_DEEP_LINKS = new Set<string>([
  APP_ROUTES.home,
  APP_ROUTES.channels,
  APP_ROUTES.briefs,
  APP_ROUTES.deals,
  APP_ROUTES.profile,
  APP_ROUTES.createListing,
  APP_ROUTES.createBrief,
  APP_ROUTES.myChannels,
  APP_ROUTES.myBriefs,
]);

const STATIC_START_PARAM_TO_PATH = new Map<string, string>([
  ['home', APP_ROUTES.home],
  ['channels', APP_ROUTES.channels], // legacy token, routes to /listings
  ['listings', APP_ROUTES.channels],
  ['briefs', APP_ROUTES.briefs],
  ['deals', APP_ROUTES.deals],
  ['profile', APP_ROUTES.profile],
  ['create-listing', APP_ROUTES.createListing],
  ['create-brief', APP_ROUTES.createBrief],
  ['my-channels', APP_ROUTES.myChannels],
  ['my-briefs', APP_ROUTES.myBriefs],
]);

function normalizePath(path: string): string {
  const withoutHash = path.split('#')[0] ?? path;
  const withoutQuery = withoutHash.split('?')[0] ?? withoutHash;
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const collapsedSlashes = withLeadingSlash.replace(/\/{2,}/g, '/');

  if (collapsedSlashes.length > 1 && collapsedSlashes.endsWith('/')) {
    return collapsedSlashes.slice(0, -1);
  }

  return collapsedSlashes;
}

function decodeStartParam(startParam: string): string {
  try {
    return decodeURIComponent(startParam);
  } catch {
    return startParam;
  }
}

function canonicalizeListingsPath(path: string): string {
  if (path === '/channels') {
    return '/listings';
  }

  const channelPathMatch = path.match(/^\/channels\/([^/]+)(?:\/(settings))?$/);
  if (!channelPathMatch) {
    return path;
  }

  const channelId = channelPathMatch[1];
  const suffix = channelPathMatch[2] === 'settings' ? '/settings' : '';
  return `/listings/${channelId}${suffix}`;
}

function parseLegacyToken(token: string): string | null {
  const staticPath = STATIC_START_PARAM_TO_PATH.get(token);
  if (staticPath) {
    return staticPath;
  }

  const channelSettingsMatch = token.match(/^channels-([^/]+)-settings$/);
  if (channelSettingsMatch) {
    return `/listings/${channelSettingsMatch[1]}/settings`;
  }

  const listingSettingsMatch = token.match(/^listings-([^/]+)-settings$/);
  if (listingSettingsMatch) {
    return `/listings/${listingSettingsMatch[1]}/settings`;
  }

  const briefApplicationsMatch = token.match(/^briefs-([^/]+)-applications$/);
  if (briefApplicationsMatch) {
    return `/briefs/${briefApplicationsMatch[1]}/applications`;
  }

  const channelDetailMatch = token.match(/^channels-([^/]+)$/);
  if (channelDetailMatch) {
    return `/listings/${channelDetailMatch[1]}`;
  }

  const listingDetailMatch = token.match(/^listings-([^/]+)$/);
  if (listingDetailMatch) {
    return `/listings/${listingDetailMatch[1]}`;
  }

  const briefDetailMatch = token.match(/^briefs-([^/]+)$/);
  if (briefDetailMatch) {
    return `/briefs/${briefDetailMatch[1]}`;
  }

  const dealDetailMatch = token.match(/^deals-([^/]+)$/);
  if (dealDetailMatch) {
    return `/deals/${dealDetailMatch[1]}`;
  }

  return null;
}

function isSupportedDeepLink(path: string): boolean {
  if (STATIC_DEEP_LINKS.has(path)) {
    return true;
  }

  if (/^\/listings\/[^/]+(?:\/settings)?$/.test(path)) {
    return true;
  }

  if (/^\/briefs\/[^/]+(?:\/applications)?$/.test(path)) {
    return true;
  }

  if (/^\/deals\/[^/]+$/.test(path)) {
    return true;
  }

  return false;
}

export function parseDeepLink(startParam?: string | null): string | null {
  if (!startParam) {
    return null;
  }

  const decodedStartParam = decodeStartParam(startParam.trim());
  if (!decodedStartParam) {
    return null;
  }

  const directPathCandidate = decodedStartParam.includes('/') ? normalizePath(decodedStartParam) : null;
  if (directPathCandidate) {
    const canonicalPath = canonicalizeListingsPath(directPathCandidate);
    if (isSupportedDeepLink(canonicalPath)) {
      return canonicalPath;
    }
  }

  const fromLegacyToken = parseLegacyToken(decodedStartParam);
  if (fromLegacyToken) {
    const normalizedPath = normalizePath(fromLegacyToken);
    return isSupportedDeepLink(normalizedPath) ? normalizedPath : null;
  }

  return null;
}
