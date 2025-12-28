import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Flag,
  MessageSquare,
  User,
  Video,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Filter,
  Search,
  Ban,
  AlertOctagon,
  Scale,
} from 'lucide-react';

// Mock moderation data
const MOCK_MODERATION_STATS = {
  pendingReports: 23,
  resolvedToday: 15,
  resolvedThisWeek: 89,
  avgResolutionTime: '2.5h',
  falsePositiveRate: '12%',
  appealsPending: 5,
};

const REPORT_TYPES = {
  copyright: { label: 'Copyright', color: 'red' },
  inappropriate: { label: 'Inappropriate', color: 'orange' },
  misinformation: { label: 'Misinformation', color: 'yellow' },
  spam: { label: 'Spam', color: 'gray' },
  harassment: { label: 'Harassment', color: 'purple' },
  other: { label: 'Other', color: 'blue' },
};

const MOCK_REPORTS = [
  {
    id: '1',
    contentId: 'video-123',
    contentTitle: 'News Clip - Unverified Source',
    contentType: 'video',
    reportType: 'misinformation',
    reportCount: 5,
    reportedBy: '0x1234...5678',
    description: 'This video contains false claims about medical treatments.',
    status: 'pending',
    priority: 'high',
    createdAt: '2024-01-15T10:30:00Z',
    contentOwner: 'user_456',
  },
  {
    id: '2',
    contentId: 'video-456',
    contentTitle: 'Movie Clip - Warner Bros',
    contentType: 'video',
    reportType: 'copyright',
    reportCount: 2,
    reportedBy: 'DMCA Bot',
    description: 'Unauthorized use of copyrighted material from Warner Bros.',
    status: 'pending',
    priority: 'high',
    createdAt: '2024-01-15T09:15:00Z',
    contentOwner: 'user_789',
  },
  {
    id: '3',
    contentId: 'video-789',
    contentTitle: 'Spam Promotional Video',
    contentType: 'video',
    reportType: 'spam',
    reportCount: 8,
    reportedBy: 'Multiple Users',
    description: 'Repetitive spam content promoting cryptocurrency scam.',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-01-15T08:45:00Z',
    contentOwner: 'user_spam123',
  },
  {
    id: '4',
    contentId: 'listing-321',
    contentTitle: 'NFT Listing - Stolen Art',
    contentType: 'listing',
    reportType: 'copyright',
    reportCount: 3,
    reportedBy: 'Original Creator',
    description: 'This NFT uses artwork stolen from my portfolio.',
    status: 'under_review',
    priority: 'high',
    createdAt: '2024-01-14T16:20:00Z',
    contentOwner: 'user_thief',
    assignedTo: 'admin_1',
  },
  {
    id: '5',
    contentId: 'video-999',
    contentTitle: 'Harassment Video',
    contentType: 'video',
    reportType: 'harassment',
    reportCount: 1,
    reportedBy: '0x9876...5432',
    description: 'Video contains targeted harassment of an individual.',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-01-14T14:00:00Z',
    contentOwner: 'user_harasser',
  },
];

const MOCK_APPEALS = [
  {
    id: '1',
    originalReportId: 'report-100',
    contentTitle: 'Educational Documentary',
    appealReason: 'Content is educational and falls under fair use.',
    status: 'pending',
    submittedAt: '2024-01-14T12:00:00Z',
    submittedBy: 'user_educator',
  },
  {
    id: '2',
    originalReportId: 'report-101',
    contentTitle: 'Political Commentary',
    appealReason: 'Factual news commentary, not misinformation.',
    status: 'pending',
    submittedAt: '2024-01-13T18:30:00Z',
    submittedBy: 'user_journalist',
  },
];

export function AdminModeration() {
  const [activeTab, setActiveTab] = useState<'reports' | 'appeals'>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const filteredReports = MOCK_REPORTS.filter((report) => {
    const matchesSearch =
      report.contentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || report.reportType === typeFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    return matchesSearch && matchesType && matchesPriority;
  });

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
    const typeConfig = REPORT_TYPES[type as keyof typeof REPORT_TYPES] || REPORT_TYPES.other;
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Pending</p>
                <p className="text-xl font-bold text-white">
                  {MOCK_MODERATION_STATS.pendingReports}
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
                  {MOCK_MODERATION_STATS.resolvedToday}
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
                <p className="text-xs text-slate-400">Avg Resolution</p>
                <p className="text-xl font-bold text-white">
                  {MOCK_MODERATION_STATS.avgResolutionTime}
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
                <p className="text-xs text-slate-400">Appeals Pending</p>
                <p className="text-xl font-bold text-white">
                  {MOCK_MODERATION_STATS.appealsPending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-500/10 p-2">
                <ThumbsDown className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">False Positive</p>
                <p className="text-xl font-bold text-white">
                  {MOCK_MODERATION_STATS.falsePositiveRate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-500/10 p-2">
                <Shield className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">This Week</p>
                <p className="text-xl font-bold text-white">
                  {MOCK_MODERATION_STATS.resolvedThisWeek}
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
          Reports ({MOCK_REPORTS.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('appeals')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'appeals'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Appeals ({MOCK_APPEALS.length})
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
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
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
                    onChange={(e) => setPriorityFilter(e.target.value)}
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
                <div className="space-y-3">
                  {filteredReports.map((report) => (
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
                              report.contentType === 'video'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}
                          >
                            {report.contentType === 'video' ? (
                              <Video className="h-4 w-4" />
                            ) : (
                              <Flag className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-medium text-white">
                                {report.contentTitle}
                              </h4>
                              {getReportTypeBadge(report.reportType)}
                              {getPriorityBadge(report.priority)}
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                              {report.description}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                              <span>
                                <Flag className="mr-1 inline h-3 w-3" />
                                {report.reportCount} reports
                              </span>
                              <span>
                                <User className="mr-1 inline h-3 w-3" />
                                {report.reportedBy}
                              </span>
                              <span>
                                <Clock className="mr-1 inline h-3 w-3" />
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    const report = MOCK_REPORTS.find((r) => r.id === selectedReport);
                    if (!report) return null;
                    return (
                      <>
                        <div className="aspect-video rounded-lg bg-slate-700" />
                        <div>
                          <h3 className="font-semibold text-white">{report.contentTitle}</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getReportTypeBadge(report.reportType)}
                            {getPriorityBadge(report.priority)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-700/50 p-3">
                          <p className="text-sm text-slate-300">{report.description}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Content Owner</span>
                            <span className="text-white">{report.contentOwner}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Reported By</span>
                            <span className="text-white">{report.reportedBy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Report Count</span>
                            <span className="text-white">{report.reportCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Created</span>
                            <span className="text-white">
                              {new Date(report.createdAt).toLocaleString()}
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
                            <Button className="bg-red-600 hover:bg-red-700">
                              <Ban className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Dismiss
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            className="mt-2 w-full border-yellow-600 text-yellow-400"
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
            <div className="space-y-4">
              {MOCK_APPEALS.map((appeal) => (
                <div
                  key={appeal.id}
                  className="rounded-lg border border-slate-700 bg-slate-700/30 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">{appeal.contentTitle}</h4>
                      <p className="mt-1 text-sm text-slate-400">{appeal.appealReason}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span>Submitted by: {appeal.submittedBy}</span>
                        <span>
                          {new Date(appeal.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-400">Pending</Badge>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <ThumbsDown className="mr-1 h-4 w-4" />
                      Deny
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600">
                      View Original Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminModeration;
