import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackEvent, type AnalyticsEventName } from '@/lib/analytics';

/**
 * Hook that automatically tracks page views on route changes.
 * Place this once at the app level inside BrowserRouter.
 */
export function usePageTracking(): void {
  const location = useLocation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    // Only track if the path actually changed (not just search/hash)
    if (location.pathname !== previousPath.current) {
      previousPath.current = location.pathname;
      trackPageView(location.pathname);
    }
  }, [location.pathname]);
}

/**
 * Hook that returns a track function for use in components.
 * Provides a stable reference so it won't cause re-renders.
 */
export function useTrackEvent() {
  return trackEvent as (
    eventName: AnalyticsEventName,
    properties?: Record<string, unknown>
  ) => void;
}
