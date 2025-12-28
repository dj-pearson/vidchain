import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, subscribeToVerificationUpdates } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Verification, VerificationResult, PaginationParams, PaginatedResponse } from '@/types';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';
import { useEffect } from 'react';

interface UseVerificationsOptions extends PaginationParams {
  status?: Verification['status'];
  videoId?: string;
}

export function useVerifications(options: UseVerificationsOptions = {}) {
  const { user } = useAuthStore();
  const {
    page = 1,
    per_page = DEFAULT_PAGE_SIZE,
    sort_by = 'created_at',
    sort_order = 'desc',
    status,
    videoId,
  } = options;

  return useQuery({
    queryKey: ['verifications', user?.id, page, per_page, sort_by, sort_order, status, videoId],
    queryFn: async (): Promise<PaginatedResponse<Verification>> => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('verifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range((page - 1) * per_page, page * per_page - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (videoId) {
        query = query.eq('video_id', videoId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Verification[],
        total: count || 0,
        page,
        per_page,
        total_pages: Math.ceil((count || 0) / per_page),
      };
    },
    enabled: !!user,
  });
}

export function useVerification(verificationId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['verification', verificationId],
    queryFn: async (): Promise<Verification> => {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('id', verificationId)
        .single();

      if (error) throw error;
      return data as Verification;
    },
    enabled: !!verificationId,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!verificationId) return;

    const channel = subscribeToVerificationUpdates(verificationId, () => {
      queryClient.invalidateQueries({ queryKey: ['verification', verificationId] });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [verificationId, queryClient]);

  return query;
}

export function useVerificationByHash(sha256Hash: string) {
  return useQuery({
    queryKey: ['verification', 'hash', sha256Hash],
    queryFn: async (): Promise<Verification | null> => {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('sha256_hash', sha256Hash)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as Verification;
    },
    enabled: !!sha256Hash,
  });
}

export function useCreateVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      videoId,
      autoMint = false,
    }: {
      videoId: string;
      autoMint?: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Call edge function to process verification
      const { data, error } = await supabase.functions.invoke('process-verification', {
        body: {
          video_id: videoId,
          user_id: user.id,
          auto_mint: autoMint,
        },
      });

      if (error) throw error;
      return data as Verification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useMintNFT() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      verificationId,
      recipientAddress,
    }: {
      verificationId: string;
      recipientAddress?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Call edge function to mint NFT
      const { data, error } = await supabase.functions.invoke('mint-nft', {
        body: {
          verification_id: verificationId,
          recipient_address: recipientAddress,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['verification', variables.verificationId] });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
}

// Public verification lookup (no auth required)
export function usePublicVerification(tokenIdOrHash: string) {
  return useQuery({
    queryKey: ['public-verification', tokenIdOrHash],
    queryFn: async (): Promise<VerificationResult> => {
      // Call public edge function
      const { data, error } = await supabase.functions.invoke('verify', {
        body: { query: tokenIdOrHash },
      });

      if (error) throw error;
      return data as VerificationResult;
    },
    enabled: !!tokenIdOrHash,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
