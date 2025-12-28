import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { User as AppUser } from '@/types';
import { supabase, getSession, getUserProfile } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  profile: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          const { session, error } = await getSession();

          if (error) {
            set({ error: error.message, isLoading: false });
            return;
          }

          if (session?.user) {
            set({ user: session.user, isAuthenticated: true });

            // Fetch user profile
            const { data: profile } = await getUserProfile(session.user.id);
            if (profile) {
              set({ profile: profile as AppUser });
            }
          }
        } catch (err) {
          set({ error: 'Failed to initialize auth' });
        } finally {
          set({ isLoading: false });
        }
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setProfile: (profile) => {
        set({ profile });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            error: null,
          });
        } catch (err) {
          set({ error: 'Failed to logout' });
        }
      },

      refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        const { data: profile } = await getUserProfile(user.id);
        if (profile) {
          set({ profile: profile as AppUser });
        }
      },
    }),
    {
      name: 'vidchain-auth',
      partialize: (state) => ({
        // Only persist minimal auth state
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  const store = useAuthStore.getState();

  if (event === 'SIGNED_IN' && session?.user) {
    store.setUser(session.user);
    const { data: profile } = await getUserProfile(session.user.id);
    if (profile) {
      store.setProfile(profile as AppUser);
    }
  } else if (event === 'SIGNED_OUT') {
    store.setUser(null);
    store.setProfile(null);
  } else if (event === 'TOKEN_REFRESHED' && session?.user) {
    store.setUser(session.user);
  }
});
