import { env } from '@/app/config/env';
import type { AnalyticsEventName, AnalyticsEventProperties } from '@/shared/analytics/events';

type PlausiblePropertyValue = string | number | boolean;
type PlausibleOptions = {
  props?: Record<string, PlausiblePropertyValue>;
};
type PlausibleTrack = (eventName: string, options?: PlausibleOptions) => void;

function normalizeProperties(properties: AnalyticsEventProperties): Record<string, PlausiblePropertyValue> {
  const normalized: Record<string, PlausiblePropertyValue> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      normalized[key] = value;
    }
  }

  return normalized;
}

function getPlausibleClient(): PlausibleTrack | null {
  const maybeClient = (window as Window & { plausible?: unknown }).plausible;
  return typeof maybeClient === 'function' ? (maybeClient as PlausibleTrack) : null;
}

export function trackEvent(eventName: AnalyticsEventName, properties: AnalyticsEventProperties = {}): void {
  if (!env.analyticsEnabled) {
    return;
  }

  const plausible = getPlausibleClient();

  if (!plausible) {
    return;
  }

  const props = normalizeProperties(properties);
  plausible(eventName, Object.keys(props).length > 0 ? { props } : undefined);
}
