import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdminModeration, useAdminStats, useUpdateModerationStatus } from '@/hooks/useAdminData';
import { formatRelativeTime } from '@/lib/utils';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  Eye,
  Flag,
  MessageSquare,
  User,
  Video,
  Search,
  Ban,
  AlertOctagon,
  Scale,
  Loader2,
} from 'lucide-react';

const REPORT_TYPES: Record<string, { label: string; color: string }> = {
  copyright: { label: 'Copyright', color: 'red' },
  inappropriate: { label: 'Inappropriate', color: 'orange' },
  misinformation: { label: 'Misinformation', color: 'yellow' },
  spam: { label: 'Spam', color: 'gray' },
  harassment: { label: 'Harassment', color: 'purple' },
  other: { label: 'Other', color: 'blue' },
};

export function AdminModeration() {
  const [activeTab, setActiveTab] = useState<'reports' | 'appeals'>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: moderationData, isLoading: reportsLoading } = useAdminModeration({
    search: searchQuery,
    typeFilter: typeFilter === 'all' ? undefined : typeFilter,
    priorityFilter: priorityFilter === 'all' ? undefined : priorityFilter,
    page,
    perPage: 20,
  });
  const updateStatus = useUpdateModerationStatus();

  const reports = moderationData?.reports ?? [];
  const totalReports = moderationData?.total ?? 0;

  const handleModAction = (reportId: string, action: 'approve' | 'dismiss' | 'remove' | 'warn') => {
    updateStatus.mutate({ reportId, action });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500/10 text-red-400">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-400">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500/10 text-green-400">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400">Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-500/10 text-blue-400">Under Review</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/10 text-green-400">Resolved</Badge>;
      case 'dismissed':
        return <Badge className="bg-slate-500/10 text-slate-400">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReportTypeBadge = (type: string) => {
    const typeConfig = REPORT_TYPES[type] || REPORT_TYPES.other;
    const colorClasses: Record<string, string> = {
      red: 'bg-red-500/10 text-red-400',
      orange: 'bg-orange-500/10 text-orange-400',
      yellow: 'bg-yellow-500/10 text-yellow-400',
      gray: 'bg-slate-500/10 text-slate-400',
      purple: 'bg-purple-500/10 text-purple-400',
      blue: 'bg-blue-500/10 text-blue-400',
    };
    return <Badge className={colorClasses[typeConfig.color]}>{typeConfig.label}</Badge>;
  };

  const pendingCount = reports.filter((r: any) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Moderation</h1>
          <p className="text-slate-400">Review reports and manage content violations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600">
            Moderation Guidelines
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Auto-Moderation Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Pending</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.pendingModeration ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Resolved Today</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.resolvedToday ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Reports</p>
                <p className="text-xl font-bold text-white">
                  {reportsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : totalReports}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-2">
                <Scale className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">In Queue</p>
                <p className="text-xl font-bold text-white">
                  {reportsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : pendingCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'reports'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Reports ({reportsLoading ? '...' : pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('appeals')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'appeals'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Appeals
        </button>
      </div>

      {activeTab === 'reports' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Reports List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="copyright">Copyright</option>
                    <option value="inappropriate">Inappropriate</option>
                    <option value="misinformation">Misinformation</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                    className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="h-12 w-12 text-slate-500 mb-4" />
                    <p className="text-slate-400">No reports found</p>
                    <p className="text-sm text-slate-500 mt-1">The moderation queue is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report: any) => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report.id)}
                        className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                          selectedReport === report.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : report.priority === 'high'
                            ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                            : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`rounded-full p-2 ${
                                report.content_type === 'video'
                                  ? 'bg-purple-500/10 text-purple-500'
                                  : 'bg-blue-500/10 text-blue-500'
                              }`}
                            >
                              {report.content_type === 'video' ? (
                                <Video className="h-4 w-4" />
                              ) : (
                                <Flag className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-medium text-white">
                                  {report.content_title || `Report #${report.id.slice(0, 8)}`}
                                </h4>
                                {report.report_type && getReportTypeBadge(report.report_type)}
                                {report.priority && getPriorityBadge(report.priority)}
                                {getStatusBadge(report.status)}
                              </div>
                              <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                                {report.description || 'No description provided'}
                              </p>
                              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                {report.report_count && (
                                  <span>
                                    <Flag className="mr-1 inline h-3 w-3" />
                                    {report.report_count} reports
                                  </span>
                                )}
                                {report.reported_by && (
                                  <span>
                                    <User className="mr-1 inline h-3 w-3" />
                                    {report.reported_by}
                                  </span>
                                )}
                                <span>
                                  <Clock className="mr-1 inline h-3 w-3" />
                                  {formatRelativeTime(report.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Detail Panel */}
          <div>
            {selectedReport ? (
              <Card className="bg-slate-800/50 border-slate-700 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white">Report Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const report = reports.find((r: any) => r.id === selectedReport);
                    if (!report) return null;
                    return (
                      <>
                        <div className="aspect-video rounded-lg bg-slate-700" />
                        <div>
                          <h3 className="font-semibold text-white">
                            {report.content_title || `Report #${report.id.slice(0, 8)}`}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {report.report_type && getReportTypeBadge(report.report_type)}
                            {report.priority && getPriorityBadge(report.priority)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-700/50 p-3">
                          <p className="text-sm text-slate-300">
                            {report.description || 'No description provided'}
                          </p>
                        </div>
                        <div className="space-y-2 text-sm">
                          {report.content_owner && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Content Owner</span>
                              <span className="text-white">{report.content_owner}</span>
                            </div>
                          )}
                          {report.reported_by && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Reported By</span>
                              <span className="text-white">{report.reported_by}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Status</span>
                            <span className="text-white">{report.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Created</span>
                            <span className="text-white">
                              {formatRelativeTime(report.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-slate-700 pt-4">
                          <h4 className="mb-3 font-medium text-white">Actions</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="border-slate-600">
                              <Eye className="mr-2 h-4 w-4" />
                              View Content
                            </Button>
                            <Button variant="outline" className="border-slate-600">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Contact Owner
                            </Button>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleModAction(report.id, 'remove')}
                              disabled={updateStatus.isPending}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleModAction(report.id, 'dismiss')}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Dismiss
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            className="mt-2 w-full border-yellow-600 text-yellow-400"
                            onClick={() => handleModAction(report.id, 'warn')}
                            disabled={updateStatus.isPending}
                          >
                            <AlertOctagon className="mr-2 h-4 w-4" />
                            Warn User
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-slate-500 mb-4" />
                  <p className="text-slate-400">Select a report to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Appeals Tab */
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Pending Appeals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Scale className="h-12 w-12 text-slate-500 mb-4" />
              <p className="text-slate-400">Appeals are loaded from the database</p>
              <p className="text-sm text-slate-500 mt-1">No pending appeals at this time</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminModeration;
