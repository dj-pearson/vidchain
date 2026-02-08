import { Link } from 'react-router-dom';
import { useVideos, useVerifications, useDashboardStats, useRealtimeVerifications } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { SkeletonDashboard, MainContent } from '@/components/ui';
import { ROUTES } from '@/config/constants';
import { formatRelativeTime, formatFileSize, truncate, getStatusBadgeVariant } from '@/lib/utils';
import {
  Video,
  CheckCircle,
  Clock,
  Upload,
  TrendingUp,
  Shield,
  AlertCircle,
  Activity,
  ArrowRight,
  Search,
  Zap,
} from 'lucide-react';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: videosData, isLoading: videosLoading } = useVideos({ per_page: 5 });
  const { data: verificationsData, isLoading: verificationsLoading } = useVerifications({
    per_page: 5,
  });

  // Subscribe to real-time verification updates
  useRealtimeVerifications();

  const isLoading = statsLoading || videosLoading || verificationsLoading;

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const totalVideos = stats?.total_videos ?? videosData?.total ?? 0;
  const verifiedCount = stats?.verified_videos ?? 0;
  const pendingCount = stats?.pending_verifications ?? 0;
  const monthlyCount = stats?.verifications_this_month ?? 0;

  // Calculate verification success rate
  const totalVerifications = verifiedCount + pendingCount;
  const successRate = totalVerifications > 0
    ? Math.round((verifiedCount / totalVerifications) * 100)
    : 0;

  return (
    <MainContent className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your video verifications.
          </p>
        </div>
        <Link to={ROUTES.upload}>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideos}</div>
            <p className="text-xs text-muted-foreground">Uploaded to platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">Blockchain verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyCount}</div>
            <p className="text-xs text-muted-foreground">New verifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Verification Success Rate + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" />
              Verification Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{successRate}%</span>
              <span className="mb-1 text-xs text-muted-foreground">
                {verifiedCount} of {totalVerifications} verified
              </span>
            </div>
            <Progress value={successRate} className="h-2" />
            {pendingCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {pendingCount} verification{pendingCount !== 1 ? 's' : ''} in progress
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link to={ROUTES.upload}>
                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Upload & Verify</p>
                    <p className="text-xs text-muted-foreground">Add a new video</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
              <Link to={ROUTES.verify}>
                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Verify Content</p>
                    <p className="text-xs text-muted-foreground">Check authenticity</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
              <Link to={ROUTES.videos}>
                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">My Videos</p>
                    <p className="text-xs text-muted-foreground">Manage library</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Videos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Recent Videos
            </CardTitle>
            <CardDescription>Your latest uploaded videos</CardDescription>
          </CardHeader>
          <CardContent>
            {videosData?.data.length === 0 ? (
              <div className="py-8 text-center">
                <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No videos uploaded yet</p>
                <Link to={ROUTES.upload} className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Upload your first video
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {videosData?.data.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={ROUTES.video(video.id)}
                        className="font-medium hover:underline"
                      >
                        {truncate(video.title, 30)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(video.file_size)} &middot;{' '}
                        {formatRelativeTime(video.created_at)}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(video.status)}>
                      {video.status}
                    </Badge>
                  </div>
                ))}
                <Link to={ROUTES.videos} className="block">
                  <Button variant="outline" className="w-full">
                    View All Videos
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Verifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recent Verifications
              {pendingCount > 0 && (
                <span className="ml-auto flex items-center gap-1 text-xs font-normal text-warning">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
                  </span>
                  {pendingCount} in progress
                </span>
              )}
            </CardTitle>
            <CardDescription>Latest verification activity (updates in real-time)</CardDescription>
          </CardHeader>
          <CardContent>
            {verificationsData?.data.length === 0 ? (
              <div className="py-8 text-center">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No verifications yet</p>
                <p className="text-xs text-muted-foreground">
                  Upload a video to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {verificationsData?.data.map((verification) => (
                  <div
                    key={verification.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {verification.status === 'verified' ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : verification.status === 'failed' ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Clock className="h-4 w-4 text-warning" />
                        )}
                        <span className="font-medium">
                          {verification.token_id
                            ? `Token #${verification.token_id}`
                            : 'Processing...'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(verification.created_at)}
                        {verification.transaction_hash && (
                          <> &middot; <span className="font-mono">{verification.transaction_hash.slice(0, 10)}...</span></>
                        )}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(verification.status)}>
                      {verification.status}
                    </Badge>
                  </div>
                ))}
                <Link to={ROUTES.verify} className="block">
                  <Button variant="outline" className="w-full">
                    View All Verifications
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainContent>
  );
}
