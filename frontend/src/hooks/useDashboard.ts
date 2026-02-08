import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { DashboardStats, Verification } from '@/types';

/**
 * Hook that fetches real dashboard statistics from Supabase.
 * Queries actual video/verification counts instead of mock data.
 */
export function useDashboardStats() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('User not authenticated');

      // Run all count queries in parallel for performance
      const [
        videosResult,
        verifiedResult,
        pendingResult,
        monthlyResult,
      ] = await Promise.all([
        // Total videos
        supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),

        // Verified count
        supabase
          .from('verifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'verified'),

        // Pending count
        supabase
          .from('verifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['pending', 'processing']),

        // This month's verifications
        supabase
          .from('verifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', getStartOfMonth()),
      ]);

      return {
        total_videos: videosResult.count || 0,
        verified_videos: verifiedResult.count || 0,
        pending_verifications: pendingResult.count || 0,
        total_mints: verifiedResult.count || 0,
        verifications_this_month: monthlyResult.count || 0,
        storage_used_mb: 0, // Would need a storage query or metadata aggregation
      };
    },
    enabled: !!user,
    staleTime: 1000 * 30, // Refresh every 30 seconds
    refetchInterval: 1000 * 60, // Auto-refetch every minute
  });
}

/**
 * Hook that subscribes to real-time verification updates for the current user.
 * Automatically invalidates dashboard stats and verification queries when
 * a verification status changes.
 */
export function useRealtimeVerifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`dashboard:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'verifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate relevant queries so the dashboard updates in real-time
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', user.id] });
          queryClient.invalidateQueries({ queryKey: ['verifications'] });
          queryClient.invalidateQueries({ queryKey: ['videos'] });

          // If a verification just completed, also invalidate that specific query
          const newRecord = payload.new as Partial<Verification> | undefined;
          if (newRecord?.id) {
            queryClient.invalidateQueries({ queryKey: ['verification', newRecord.id] });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, queryClient]);
}

function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}
