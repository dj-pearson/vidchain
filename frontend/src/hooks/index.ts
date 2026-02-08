// Auth hooks
export { useAuth, useRequireAuth, useRedirectAuthenticated } from './useAuth';

// Video hooks
export { useVideos, useVideo, useUploadVideo, useDeleteVideo } from './useVideos';

// Verification hooks
export {
  useVerifications,
  useVerification,
  useVerificationByHash,
  useCreateVerification,
  useMintNFT,
  usePublicVerification,
} from './useVerifications';

// Analytics hooks
export { usePageTracking, useTrackEvent } from './useAnalytics';

// Dashboard hooks
export { useDashboardStats, useRealtimeVerifications } from './useDashboard';
