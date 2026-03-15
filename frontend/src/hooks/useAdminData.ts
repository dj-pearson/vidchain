import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AdminStats {
  totalUsers: number;
  totalVideos: number;
  verifiedVideos: number;
  pendingVerifications: number;
  failedVerifications: number;
  marketplaceListings: number;
  pendingModeration: number;
  resolvedToday: number;
}

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  wallet_address: string | null;
  created_at: string;
}

export interface AdminUsersOptions {
  search?: string;
  roleFilter?: string;
  statusFilter?: string;
  page?: number;
  perPage?: number;
}

export interface AdminContentItem {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface AdminContentOptions {
  search?: string;
  statusFilter?: string;
  page?: number;
  perPage?: number;
}

export interface AdminModerationReport {
  id: string;
  video_id: string | null;
  reporter_id: string | null;
  report_type: string;
  reason: string;
  description: string | null;
  status: string;
  priority: string | null;
  content_title?: string;
  content_type?: string;
  content_owner?: string;
  reported_by?: string;
  report_count?: number;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminModerationOptions {
  typeFilter?: string;
  priorityFilter?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export type ModerationAction = 'approve' | 'dismiss' | 'remove' | 'warn';

export interface ActivityItem {
  id: string;
  type: 'video' | 'verification' | 'moderation';
  message: string;
  timestamp: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetches platform-wide statistics for the admin overview page.
 * All queries run in parallel; individual failures return 0.
 */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const safeCount = async (
        queryFn: () => Promise<{ count: number | null; error: unknown }>
      ): Promise<number> => {
        try {
          const { count, error } = await queryFn();
          if (error) return 0;
          return count || 0;
        } catch {
          return 0;
        }
      };

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        totalVideos,
        verifiedVideos,
        pendingVideos,
        failedVideos,
        marketplaceListings,
        pendingModeration,
        resolvedModerationToday,
      ] = await Promise.all([
        safeCount(async () =>
          db.from('users').select('*', { count: 'exact', head: true })
        ),
        safeCount(async () =>
          db.from('videos').select('*', { count: 'exact', head: true })
        ),
        safeCount(async () =>
          db
            .from('verifications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'verified')
        ),
        safeCount(async () =>
          db
            .from('verifications')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'processing'])
        ),
        safeCount(async () =>
          db
            .from('verifications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'failed')
        ),
        safeCount(async () =>
          db
            .from('marketplace_listings')
            .select('*', { count: 'exact', head: true })
        ),
        safeCount(async () =>
          db
            .from('content_moderation')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
        ),
        safeCount(async () =>
          db
            .from('content_moderation')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'resolved')
            .gte('created_at', todayStart.toISOString())
        ),
      ]);

      return {
        totalUsers,
        totalVideos,
        verifiedVideos,
        pendingVerifications: pendingVideos,
        failedVerifications: failedVideos,
        marketplaceListings,
        pendingModeration,
        resolvedToday: resolvedModerationToday,
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Fetches users for the admin users page with search, filtering, and pagination.
 */
export function useAdminUsers(options: AdminUsersOptions = {}) {
  const {
    search = '',
    roleFilter = '',
    statusFilter = '',
    page = 1,
    perPage = DEFAULT_PAGE_SIZE,
  } = options;

  return useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter, page, perPage],
    queryFn: async (): Promise<{ users: AdminUser[]; total: number }> => {
      try {
        let query = db
          .from('users')
          .select('id, full_name, email, role, wallet_address, created_at', {
            count: 'exact',
          })
          .order('created_at', { ascending: false })
          .range((page - 1) * perPage, page * perPage - 1);

        if (search) {
          query = query.or(
            `full_name.ilike.%${search}%,email.ilike.%${search}%`
          );
        }

        if (roleFilter) {
          query = query.eq('role', roleFilter);
        }

        if (statusFilter) {
          query = query.eq('status', statusFilter);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const users: AdminUser[] = (data || []).map((u: any) => ({
          id: u.id,
          full_name: u.full_name ?? null,
          email: u.email,
          role: u.role ?? 'user',
          wallet_address: u.wallet_address ?? null,
          created_at: u.created_at,
        }));

        return { users, total: count || 0 };
      } catch {
        return { users: [], total: 0 };
      }
    },
  });
}

/**
 * Fetches video content for the admin content page with search, filtering, and pagination.
 */
export function useAdminContent(options: AdminContentOptions = {}) {
  const {
    search = '',
    statusFilter = '',
    page = 1,
    perPage = DEFAULT_PAGE_SIZE,
  } = options;

  return useQuery({
    queryKey: ['admin-content', search, statusFilter, page, perPage],
    queryFn: async (): Promise<{ content: AdminContentItem[]; total: number }> => {
      try {
        let query = db
          .from('videos')
          .select(
            'id, title, filename, file_size, mime_type, status, created_at, updated_at, user_id',
            { count: 'exact' }
          )
          .order('created_at', { ascending: false })
          .range((page - 1) * perPage, page * perPage - 1);

        if (search) {
          query = query.or(
            `title.ilike.%${search}%,filename.ilike.%${search}%`
          );
        }

        if (statusFilter) {
          query = query.eq('status', statusFilter);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content: AdminContentItem[] = (data || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          filename: v.filename,
          file_size: v.file_size,
          mime_type: v.mime_type,
          status: v.status,
          created_at: v.created_at,
          updated_at: v.updated_at,
          user_id: v.user_id,
        }));

        return { content, total: count || 0 };
      } catch {
        return { content: [], total: 0 };
      }
    },
  });
}

/**
 * Fetches moderation reports for the admin moderation page with filtering and pagination.
 */
export function useAdminModeration(options: AdminModerationOptions = {}) {
  const {
    typeFilter = '',
    priorityFilter = '',
    search = '',
    page = 1,
    perPage = DEFAULT_PAGE_SIZE,
  } = options;

  return useQuery({
    queryKey: ['admin-moderation', typeFilter, priorityFilter, search, page, perPage],
    queryFn: async (): Promise<{ reports: AdminModerationReport[]; total: number }> => {
      try {
        let query = db
          .from('content_moderation')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range((page - 1) * perPage, page * perPage - 1);

        if (typeFilter) {
          query = query.eq('report_type', typeFilter);
        }

        if (priorityFilter) {
          query = query.eq('priority', priorityFilter);
        }

        if (search) {
          query = query.or(
            `reason.ilike.%${search}%,description.ilike.%${search}%`
          );
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return {
          reports: (data || []) as AdminModerationReport[],
          total: count || 0,
        };
      } catch {
        return { reports: [], total: 0 };
      }
    },
  });
}

/**
 * Mutation hook to update a moderation report's status.
 * Invalidates moderation queries on success.
 */
export function useUpdateModerationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      action,
      notes,
    }: {
      reportId: string;
      action: ModerationAction;
      notes?: string;
    }) => {
      const statusMap: Record<ModerationAction, string> = {
        approve: 'approved',
        dismiss: 'dismissed',
        remove: 'removed',
        warn: 'warned',
      };

      const { data, error } = await db
        .from('content_moderation')
        .update({
          status: statusMap[action],
          resolution_notes: notes || null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

/**
 * Fetches recent platform activity by combining latest videos and verifications.
 */
export function useAdminRecentActivity() {
  return useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const activities: ActivityItem[] = [];

      // Fetch recent videos
      try {
        const { data: videos } = await db
          .from('videos')
          .select('id, title, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (videos) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const v of videos as any[]) {
            activities.push({
              id: `video-${v.id}`,
              type: 'video',
              message: `Video "${v.title}" uploaded (${v.status})`,
              timestamp: v.created_at,
            });
          }
        }
      } catch {
        // Table may not exist; skip
      }

      // Fetch recent verifications
      try {
        const { data: verifications } = await db
          .from('verifications')
          .select('id, video_id, status, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (verifications) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const v of verifications as any[]) {
            activities.push({
              id: `verification-${v.id}`,
              type: 'verification',
              message: `Verification ${v.status} for video ${v.video_id}`,
              timestamp: v.created_at,
            });
          }
        }
      } catch {
        // Table may not exist; skip
      }

      // Sort combined activities by timestamp descending and take the latest 10
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return activities.slice(0, 10);
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}
