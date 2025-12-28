import { Link } from 'react-router-dom';
import { useVideos, useVerifications } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/Spinner';
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
} from 'lucide-react';

export function Dashboard() {
  const { data: videosData, isLoading: videosLoading } = useVideos({ per_page: 5 });
  const { data: verificationsData, isLoading: verificationsLoading } = useVerifications({
    per_page: 5,
  });

  const isLoading = videosLoading || verificationsLoading;

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  const totalVideos = videosData?.total || 0;
  const verifiedCount = verificationsData?.data.filter((v) => v.status === 'verified').length || 0;
  const pendingCount = verificationsData?.data.filter((v) => v.status === 'pending').length || 0;

  return (
    <div className="space-y-8">
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
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">New verifications</p>
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
            </CardTitle>
            <CardDescription>Latest verification activity</CardDescription>
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
    </div>
  );
}
