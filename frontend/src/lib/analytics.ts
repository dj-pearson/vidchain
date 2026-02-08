import { supabase } from '@/lib/supabase';
import { HAS_SUPABASE, IS_DEVELOPMENT } from '@/config/constants';

// ============================================================================
// ANALYTICS EVENT TRACKING
// Lightweight, privacy-respecting analytics for measuring platform health,
// user engagement, and verification success rates.
// ============================================================================

export type AnalyticsEventName =
  // Page views
  | 'page_view'
  // Auth events
  | 'auth_login'
  | 'auth_signup'
  | 'auth_logout'
  // Video events
  | 'video_upload_started'
  | 'video_upload_completed'
  | 'video_upload_failed'
  | 'video_deleted'
  // Verification events
  | 'verification_started'
  | 'verification_completed'
  | 'verification_failed'
  | 'verification_public_lookup'
  // NFT events
  | 'nft_mint_started'
  | 'nft_mint_completed'
  | 'nft_mint_failed'
  // Marketplace events
  | 'marketplace_listing_viewed'
  | 'marketplace_listing_created'
  | 'marketplace_purchase'
  // Feature engagement
  | 'badge_generated'
  | 'embed_code_copied'
  | 'wallet_connected'
  | 'api_key_created';

export interface AnalyticsEvent {
  event_name: AnalyticsEventName;
  properties?: Record<string, unknown>;
  page_path?: string;
  referrer?: string;
  session_id?: string;
}

// Generate a session ID that persists for the browser session
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('vc_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('vc_session_id', sessionId);
  }
  return sessionId;
}

// In-memory buffer for batching events to reduce DB writes
let eventBuffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 10;

async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const events = [...eventBuffer];
  eventBuffer = [];

  if (!HAS_SUPABASE) {
    if (IS_DEVELOPMENT) {
      console.debug('[Analytics] Would flush events:', events);
    }
    return;
  }

  try {
    const rows = events.map((e) => ({
      event_name: e.event_name,
      properties: e.properties || {},
      page_path: e.page_path || window.location.pathname,
      referrer: e.referrer || document.referrer || null,
      session_id: e.session_id || getSessionId(),
      created_at: new Date().toISOString(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('analytics_events').insert(rows);

    if (error) {
      // If the table doesn't exist yet, log to console in dev
      if (IS_DEVELOPMENT) {
        console.debug('[Analytics] Insert failed (table may not exist yet):', error.message);
        console.debug('[Analytics] Events:', rows);
      }
    }
  } catch (err) {
    if (IS_DEVELOPMENT) {
      console.debug('[Analytics] Flush error:', err);
    }
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Track an analytics event.
 * Events are buffered and flushed periodically to minimize DB writes.
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  properties?: Record<string, unknown>
): void {
  const event: AnalyticsEvent = {
    event_name: eventName,
    properties,
    page_path: window.location.pathname,
    referrer: document.referrer || undefined,
    session_id: getSessionId(),
  };

  eventBuffer.push(event);

  if (IS_DEVELOPMENT) {
    console.debug(`[Analytics] ${eventName}`, properties || '');
  }

  // Flush immediately if buffer is full, otherwise schedule
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    flushEvents();
  } else {
    scheduleFlush();
  }
}

/**
 * Track a page view event. Called automatically by the usePageTracking hook.
 */
export function trackPageView(path: string): void {
  trackEvent('page_view', { path });
}

// Flush remaining events when the page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushEvents();
  });

  // Also flush on visibility change (tab switch on mobile)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEvents();
    }
  });
}
