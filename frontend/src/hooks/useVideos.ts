import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Video, PaginationParams, PaginatedResponse } from '@/types';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

interface UseVideosOptions extends PaginationParams {
  status?: Video['status'];
}

export function useVideos(options: UseVideosOptions = {}) {
  const { user } = useAuthStore();
  const {
    page = 1,
    per_page = DEFAULT_PAGE_SIZE,
    sort_by = 'created_at',
    sort_order = 'desc',
    status,
  } = options;

  return useQuery({
    queryKey: ['videos', user?.id, page, per_page, sort_by, sort_order, status],
    queryFn: async (): Promise<PaginatedResponse<Video>> => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('videos')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range((page - 1) * per_page, page * per_page - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Video[],
        total: count || 0,
        page,
        per_page,
        total_pages: Math.ceil((count || 0) / per_page),
      };
    },
    enabled: !!user,
  });
}

export function useVideo(videoId: string) {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: async (): Promise<Video> => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) throw error;
      return data as Video;
    },
    enabled: !!videoId,
  });
}

export function useUploadVideo() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      title,
      description,
    }: {
      file: File;
      title: string;
      description?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Generate unique path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${user.id}/${timestamp}_${sanitizedName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title,
          description,
          filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: uploadData.path,
          status: 'processing',
        } as any)
        .select()
        .single();

      if (videoError) throw videoError;

      return videoData as Video;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setUploadProgress(0);
    },
  });

  const uploadWithProgress = useCallback(
    async (file: File, title: string, description?: string) => {
      setUploadProgress(0);

      // Simulate progress for now (real implementation would use XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const result = await uploadMutation.mutateAsync({ file, title, description });
        setUploadProgress(100);
        clearInterval(progressInterval);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    [uploadMutation]
  );

  return {
    upload: uploadWithProgress,
    progress: uploadProgress,
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error,
  };
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      // Get video to delete storage file
      const { data: video, error: getError } = await supabase
        .from('videos')
        .select('storage_path')
        .eq('id', videoId)
        .single();

      if (getError) throw getError;

      // Delete from storage
      const videoData = video as { storage_path?: string } | null;
      if (videoData?.storage_path) {
        await supabase.storage.from('videos').remove([videoData.storage_path]);
      }

      // Delete record
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}
