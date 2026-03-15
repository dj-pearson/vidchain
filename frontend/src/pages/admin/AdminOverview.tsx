import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Video,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAdminStats, useAdminRecentActivity } from '@/hooks/useAdminData';
import { formatRelativeTime } from '@/lib/utils';

export function AdminOverview() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentActivity, isLoading: activityLoading } = useAdminRecentActivity();

  const StatValue = ({ value, loading }: { value: string | number; loading: boolean }) => {
    if (loading) return <Loader2 className="h-6 w-6 animate-spin text-slate-400" />;
    return <>{typeof value === 'number' ? value.toLocaleString() : value}</>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-slate-400">
            Platform metrics and activity at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500 text-green-400">
            <span className="mr-1 h-2 w-2 rounded-full bg-green-400 inline-block"></span>
            All Systems Operational
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-white">
                <StatValue value={stats?.totalUsers ?? 0} loading={statsLoading} />
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Videos */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Video className="h-6 w-6 text-purple-500" />
              </div>
              {!statsLoading && (stats?.pendingVerifications ?? 0) > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400">
                  {stats?.pendingVerifications} pending
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Total Videos</p>
              <p className="text-3xl font-bold text-white">
                <StatValue value={stats?.totalVideos ?? 0} loading={statsLoading} />
              </p>
              {!statsLoading && (
                <p className="mt-1 text-sm text-green-400">
                  {(stats?.verifiedVideos ?? 0).toLocaleString()} verified
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Listings */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-green-500/10 p-3">
                <ShoppingBag className="h-6 w-6 text-green-500" />
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                Active
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Marketplace Listings</p>
              <p className="text-3xl font-bold text-white">
                <StatValue value={stats?.marketplaceListings ?? 0} loading={statsLoading} />
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verifications */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-orange-500/10 p-3">
                <DollarSign className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Total Verifications</p>
              <p className="text-3xl font-bold text-white">
                <StatValue
                  value={(stats?.verifiedVideos ?? 0) + (stats?.pendingVerifications ?? 0) + (stats?.failedVerifications ?? 0)}
                  loading={statsLoading}
                />
              </p>
              {!statsLoading && (
                <p className="mt-1 text-sm text-slate-500">
                  {stats?.failedVerifications ?? 0} failed
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-slate-400">Verified</p>
                <p className="font-semibold text-white">
                  <StatValue value={stats?.verifiedVideos ?? 0} loading={statsLoading} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-slate-400">Pending</p>
                <p className="font-semibold text-white">
                  <StatValue value={stats?.pendingVerifications ?? 0} loading={statsLoading} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-400">Failed</p>
                <p className="font-semibold text-white">
                  <StatValue value={stats?.failedVerifications ?? 0} loading={statsLoading} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-400">Success Rate</p>
                <p className="font-semibold text-white">
                  {statsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : (
                    (() => {
                      const total = (stats?.verifiedVideos ?? 0) + (stats?.failedVerifications ?? 0);
                      if (total === 0) return 'N/A';
                      return `${Math.round(((stats?.verifiedVideos ?? 0) / total) * 100)}%`;
                    })()
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (recentActivity?.length ?? 0) === 0 ? (
              <p className="text-center text-slate-400 py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        activity.type === 'verification'
                          ? 'bg-blue-500/10 text-blue-500'
                          : activity.type === 'video'
                          ? 'bg-purple-500/10 text-purple-500'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {activity.type === 'verification' ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{activity.message}</p>
                      <p className="text-xs text-slate-500">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Summary */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Platform Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Users</span>
                <span className="font-semibold text-white">
                  <StatValue value={stats?.totalUsers ?? 0} loading={statsLoading} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Videos</span>
                <span className="font-semibold text-white">
                  <StatValue value={stats?.totalVideos ?? 0} loading={statsLoading} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Verified Videos</span>
                <span className="font-semibold text-green-400">
                  <StatValue value={stats?.verifiedVideos ?? 0} loading={statsLoading} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Marketplace Listings</span>
                <span className="font-semibold text-white">
                  <StatValue value={stats?.marketplaceListings ?? 0} loading={statsLoading} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Pending Moderation</span>
                <span className="font-semibold text-yellow-400">
                  <StatValue value={stats?.pendingModeration ?? 0} loading={statsLoading} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Alerts */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Moderation Queue</CardTitle>
            {!statsLoading && (
              <Badge variant="destructive">{stats?.pendingModeration ?? 0} pending</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-red-500/10 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-red-400">Pending Reports</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                <StatValue value={stats?.pendingModeration ?? 0} loading={statsLoading} />
              </p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-400">Resolved Today</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                <StatValue value={stats?.resolvedToday ?? 0} loading={statsLoading} />
              </p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-blue-400">Total Verifications</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                <StatValue
                  value={(stats?.verifiedVideos ?? 0) + (stats?.pendingVerifications ?? 0) + (stats?.failedVerifications ?? 0)}
                  loading={statsLoading}
                />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminOverview;
