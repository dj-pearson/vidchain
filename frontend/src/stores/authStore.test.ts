import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
  getSession: vi.fn().mockResolvedValue({ session: null, error: null }),
  getUserProfile: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

import { useAuthStore } from './authStore';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// Helper to create a mock Supabase User
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as User;
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset the store to initial-like state before each test
    const store = useAuthStore.getState();
    store.setUser(null);
    store.setProfile(null);
    store.setLoading(true);
    store.setError(null);
    vi.clearAllMocks();
    // Re-set the default resolved value after clearAllMocks
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
  });

  describe('initial state', () => {
    it('has null user after reset', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('has null profile after reset', () => {
      const state = useAuthStore.getState();
      expect(state.profile).toBeNull();
    });

    it('is not authenticated after reset', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('has null error after reset', () => {
      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('sets user and marks as authenticated', () => {
      const mockUser = createMockUser();
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('clears user and marks as not authenticated when null', () => {
      const mockUser = createMockUser();
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setProfile', () => {
    it('sets the user profile', () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
      };
      useAuthStore.getState().setProfile(mockProfile as any);

      const state = useAuthStore.getState();
      expect(state.profile).toEqual(mockProfile);
    });

    it('clears the profile when set to null', () => {
      useAuthStore.getState().setProfile({ id: 'user-123' } as any);
      useAuthStore.getState().setProfile(null);

      expect(useAuthStore.getState().profile).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('sets loading to true', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('sets loading to false', () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets an error message', () => {
      useAuthStore.getState().setError('Something went wrong');
      expect(useAuthStore.getState().error).toBe('Something went wrong');
    });

    it('clears the error when set to null', () => {
      useAuthStore.getState().setError('error');
      useAuthStore.getState().setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears user, profile, and authentication state', async () => {
      // Set up authenticated state
      useAuthStore.getState().setUser(createMockUser());
      useAuthStore.getState().setProfile({ id: 'user-123' } as any);

      // Perform logout
      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    it('calls supabase signOut', async () => {
      await useAuthStore.getState().logout();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('sets error if signOut throws', async () => {
      vi.mocked(supabase.auth.signOut).mockRejectedValueOnce(new Error('Network error'));

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().error).toBe('Failed to logout');
    });
  });
});
