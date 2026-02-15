import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/analytics';

export function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackEvent(ANALYTICS_EVENT.pageView, {
      path: location.pathname,
    });
  }, [location.pathname]);

  return null;
}
