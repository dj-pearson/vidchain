import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdminContent, useAdminStats } from '@/hooks/useAdminData';
import { formatFileSize, formatRelativeTime } from '@/lib/utils';
import {
  Video,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Trash2,
  Shield,
  Calendar,
  HardDrive,
  Play,
  Loader2,
  MoreVertical,
} from 'lucide-react';

export function AdminContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: contentData, isLoading: contentLoading } = useAdminContent({
    search: searchQuery,
    statusFilter: statusFilter === 'all' ? undefined : statusFilter,
    page,
    perPage: 20,
  });

  const content = contentData?.content ?? [];
  const totalContent = contentData?.total ?? 0;

  const toggleContentSelection = (id: string) => {
    setSelectedContent((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
      case 'verified':
        return (
          <Badge className="bg-green-500/10 text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            {status === 'ready' ? 'Ready' : 'Verified'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-400">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'processing':
      case 'uploading':
        return (
          <Badge className="bg-blue-500/10 text-blue-400">
            <Clock className="mr-1 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/10 text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="text-slate-400">Manage all videos and NFT content on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Shield className="mr-2 h-4 w-4" />
            Run Verification
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-slate-400">Total Videos</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.totalVideos ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-400">Total Content</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : totalContent.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-slate-400">Verified</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.verifiedVideos ?? 0).toLocaleString()}
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
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.pendingVerifications ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-slate-400">Processing</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-400">Failed</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.failedVerifications ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">All Content</CardTitle>
            <div className="flex items-center gap-2">
              {selectedContent.length > 0 && (
                <>
                  <span className="text-sm text-slate-400">
                    {selectedContent.length} selected
                  </span>
                  <Button size="sm" variant="outline" className="border-red-600 text-red-400">
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" className="border-green-600 text-green-400">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search content by title..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="uploading">Uploading</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {contentLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : content.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="h-12 w-12 text-slate-500 mb-4" />
              <p className="text-slate-400">No content found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {content.map((item: any) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 ${
                    item.status === 'failed'
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-slate-700 bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedContent.includes(item.id)}
                      onChange={() => toggleContentSelection(item.id)}
                      className="mt-4 h-4 w-4 rounded border-slate-500 bg-slate-600"
                    />
                    <div className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded bg-slate-700">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="h-8 w-8 text-slate-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-white truncate">{item.title}</h4>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {item.file_size && (
                          <span>
                            <HardDrive className="mr-1 inline h-3 w-3" />
                            {formatFileSize(item.file_size)}
                          </span>
                        )}
                        <span>
                          <Calendar className="mr-1 inline h-3 w-3" />
                          {formatRelativeTime(item.created_at)}
                        </span>
                        {item.mime_type && (
                          <span className="font-mono">
                            {item.mime_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!contentLoading && totalContent > 20 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {content.length} of {totalContent} items
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-400">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600"
                  disabled={page * 20 >= totalContent}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminContent;
