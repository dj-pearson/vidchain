import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('@/config/constants', () => ({
  HAS_SUPABASE: false,
  IS_DEVELOPMENT: true,
}));

// Import after mocks are set up
import { trackEvent, trackPageView } from './analytics';

describe('analytics', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    // Ensure sessionStorage is available
    if (!window.sessionStorage.getItem('vc_session_id')) {
      window.sessionStorage.setItem('vc_session_id', 'test-session-id');
    }
  });

  afterEach(() => {
    debugSpy.mockRestore();
    vi.clearAllTimers();
  });

  describe('trackEvent', () => {
    it('logs to console.debug in development mode', () => {
      trackEvent('auth_login', { method: 'email' });

      expect(debugSpy).toHaveBeenCalledWith(
        '[Analytics] auth_login',
        { method: 'email' }
      );
    });

    it('logs event name with empty string when no properties', () => {
      trackEvent('auth_logout');

      expect(debugSpy).toHaveBeenCalledWith(
        '[Analytics] auth_logout',
        ''
      );
    });

    it('accepts various event names', () => {
      trackEvent('video_upload_started', { fileSize: 1024 });

      expect(debugSpy).toHaveBeenCalledWith(
        '[Analytics] video_upload_started',
        { fileSize: 1024 }
      );
    });
  });

  describe('trackPageView', () => {
    it('calls trackEvent with page_view event name', () => {
      trackPageView('/dashboard');

      expect(debugSpy).toHaveBeenCalledWith(
        '[Analytics] page_view',
        { path: '/dashboard' }
      );
    });

    it('passes path as a property', () => {
      trackPageView('/verify');

      expect(debugSpy).toHaveBeenCalledWith(
        '[Analytics] page_view',
        { path: '/verify' }
      );
    });
  });
});
