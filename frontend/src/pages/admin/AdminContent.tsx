import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Video,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Trash2,
  Shield,
  AlertTriangle,
  Link,
  Hash,
  Calendar,
  User,
  HardDrive,
  Play,
} from 'lucide-react';

// Mock content data
const MOCK_CONTENT_STATS = {
  totalVideos: 45678,
  totalStorage: '12.5 TB',
  pendingVerification: 23,
  verified: 44890,
  failed: 12,
  processingQueue: 8,
};

const MOCK_CONTENT = [
  {
    id: '1',
    title: 'Historic Moon Landing - Apollo 11',
    type: 'video',
    owner: 'NASA Archives',
    ownerAddress: '0x1234...5678',
    ownerVerified: true,
    status: 'verified',
    hash: 'QmXyz123...',
    ipfsCid: 'bafybeib...xyz',
    size: '256 MB',
    duration: '12:45',
    views: 125000,
    createdAt: '2024-01-10',
    verifiedAt: '2024-01-10',
    thumbnail: '/api/placeholder/160/90',
    isNFT: true,
    nftTokenId: '1234',
  },
  {
    id: '2',
    title: 'Breaking News Coverage 2024',
    type: 'video',
    owner: 'CNN Digital',
    ownerAddress: '0x2345...6789',
    ownerVerified: true,
    status: 'pending',
    hash: 'QmAbc456...',
    ipfsCid: null,
    size: '512 MB',
    duration: '25:30',
    views: 0,
    createdAt: '2024-01-15',
    verifiedAt: null,
    thumbnail: '/api/placeholder/160/90',
    isNFT: false,
    nftTokenId: null,
  },
  {
    id: '3',
    title: 'Wildlife Documentary Clip',
    type: 'video',
    owner: 'NatGeo',
    ownerAddress: '0x3456...7890',
    ownerVerified: true,
    status: 'processing',
    hash: null,
    ipfsCid: null,
    size: '1.2 GB',
    duration: '45:00',
    views: 0,
    createdAt: '2024-01-15',
    verifiedAt: null,
    thumbnail: '/api/placeholder/160/90',
    isNFT: false,
    nftTokenId: null,
  },
  {
    id: '4',
    title: 'Sports Highlights 2024',
    type: 'video',
    owner: 'ESPN Digital',
    ownerAddress: '0x4567...8901',
    ownerVerified: true,
    status: 'verified',
    hash: 'QmDef789...',
    ipfsCid: 'bafybeic...abc',
    size: '128 MB',
    duration: '8:20',
    views: 89000,
    createdAt: '2024-01-08',
    verifiedAt: '2024-01-08',
    thumbnail: '/api/placeholder/160/90',
    isNFT: true,
    nftTokenId: '1567',
  },
  {
    id: '5',
    title: 'Suspicious Upload',
    type: 'video',
    owner: 'anonymous_user',
    ownerAddress: '0x5678...9012',
    ownerVerified: false,
    status: 'failed',
    hash: null,
    ipfsCid: null,
    size: '50 MB',
    duration: '2:15',
    views: 0,
    createdAt: '2024-01-14',
    verifiedAt: null,
    thumbnail: '/api/placeholder/160/90',
    isNFT: false,
    nftTokenId: null,
    failReason: 'Hash verification failed - possible duplicate',
  },
];

export function AdminContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [nftFilter, setNftFilter] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<string[]>([]);

  const filteredContent = MOCK_CONTENT.filter((content) => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    const matchesNft =
      nftFilter === 'all' ||
      (nftFilter === 'nft' && content.isNFT) ||
      (nftFilter === 'non-nft' && !content.isNFT);
    return matchesSearch && matchesStatus && matchesNft;
  });

  const toggleContentSelection = (id: string) => {
    setSelectedContent((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500/10 text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Verified
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
                  {MOCK_CONTENT_STATS.totalVideos.toLocaleString()}
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
                <p className="text-xs text-slate-400">Total Storage</p>
                <p className="text-xl font-bold text-white">
                  {MOCK_CONTENT_STATS.totalStorage}
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
                  {MOCK_CONTENT_STATS.verified.toLocaleString()}
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
                  {MOCK_CONTENT_STATS.pendingVerification}
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
                  {MOCK_CONTENT_STATS.processingQueue}
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
                  {MOCK_CONTENT_STATS.failed}
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
                placeholder="Search content by title or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={nftFilter}
              onChange={(e) => setNftFilter(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Content</option>
              <option value="nft">NFT Only</option>
              <option value="non-nft">Non-NFT</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredContent.map((content) => (
              <div
                key={content.id}
                className={`rounded-lg border p-4 ${
                  content.status === 'failed'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-slate-700 bg-slate-700/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedContent.includes(content.id)}
                    onChange={() => toggleContentSelection(content.id)}
                    className="mt-4 h-4 w-4 rounded border-slate-500 bg-slate-600"
                  />
                  <div className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded bg-slate-700">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="h-8 w-8 text-slate-500" />
                    </div>
                    {content.duration && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                        {content.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-white truncate">{content.title}</h4>
                      {getStatusBadge(content.status)}
                      {content.isNFT && (
                        <Badge className="bg-purple-500/10 text-purple-400">
                          NFT #{content.nftTokenId}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm">
                      <span className="text-slate-400">
                        <User className="mr-1 inline h-3 w-3" />
                        <span
                          className={content.ownerVerified ? 'text-blue-400' : 'text-slate-300'}
                        >
                          {content.owner}
                        </span>
                        {content.ownerVerified && (
                          <CheckCircle className="ml-1 inline h-3 w-3 text-blue-400" />
                        )}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>
                        <HardDrive className="mr-1 inline h-3 w-3" />
                        {content.size}
                      </span>
                      <span>
                        <Eye className="mr-1 inline h-3 w-3" />
                        {content.views.toLocaleString()} views
                      </span>
                      <span>
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {content.createdAt}
                      </span>
                      {content.hash && (
                        <span className="font-mono">
                          <Hash className="mr-1 inline h-3 w-3" />
                          {content.hash}
                        </span>
                      )}
                      {content.ipfsCid && (
                        <span className="font-mono">
                          <Link className="mr-1 inline h-3 w-3" />
                          {content.ipfsCid}
                        </span>
                      )}
                    </div>
                    {content.status === 'failed' && content.failReason && (
                      <p className="mt-2 text-sm text-red-400">
                        <AlertTriangle className="mr-1 inline h-3 w-3" />
                        {content.failReason}
                      </p>
                    )}
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

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {filteredContent.length} of {MOCK_CONTENT.length} items
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-slate-600" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600 bg-blue-600">
                1
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600">
                2
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600">
                3
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminContent;
