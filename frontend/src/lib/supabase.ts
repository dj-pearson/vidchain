import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/constants';

// Create Supabase client for self-hosted instance
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'vidchain',
    },
  },
});

// Auth helper functions
export const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
};

// Database helper functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<Database['public']['Tables']['users']['Update']>
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('users') as any)
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// Storage helper functions
export const uploadVideo = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
  return { data, error };
};

export const getVideoUrl = (path: string) => {
  const { data } = supabase.storage.from('videos').getPublicUrl(path);
  return data.publicUrl;
};

export const deleteVideo = async (path: string) => {
  const { error } = await supabase.storage.from('videos').remove([path]);
  return { error };
};

// Real-time subscriptions
export const subscribeToVerificationUpdates = (
  videoId: string,
  callback: (payload: unknown) => void
) => {
  return supabase
    .channel(`verification:${videoId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'verifications',
        filter: `video_id=eq.${videoId}`,
      },
      callback
    )
    .subscribe();
};
