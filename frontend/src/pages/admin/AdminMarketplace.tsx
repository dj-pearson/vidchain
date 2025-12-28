import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Clock,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  Gavel,
  Tag,
  Users,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

// Mock marketplace data
const MOCK_MARKETPLACE_STATS = {
  activeListings: 1234,
  totalVolume: '156,789.45',
  volumeChange: 12.5,
  salesLast24h: 89,
  salesVolume24h: '234.56',
  avgListingPrice: '0.85',
  pendingListings: 15,
  flaggedListings: 3,
  activeAuctions: 45,
  pendingOffers: 128,
};

const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Historic Moon Landing Footage',
    seller: 'NASA Archives',
    sellerAddress: '0x1234...5678',
    sellerVerified: true,
    price: '2.5',
    currency: 'ETH',
    listingType: 'fixed',
    status: 'active',
    views: 1250,
    offers: 12,
    createdAt: '2024-01-15',
    thumbnail: '/api/placeholder/120/80',
  },
  {
    id: '2',
    title: 'Breaking News Coverage 2024',
    seller: 'CNN Digital',
    sellerAddress: '0x2345...6789',
    sellerVerified: true,
    price: '1.2',
    currency: 'ETH',
    listingType: 'auction',
    status: 'active',
    views: 890,
    offers: 8,
    createdAt: '2024-01-14',
    thumbnail: '/api/placeholder/120/80',
    auctionEnds: '2024-01-20',
  },
  {
    id: '3',
    title: 'Exclusive Wildlife Documentary',
    seller: 'NatGeo',
    sellerAddress: '0x3456...7890',
    sellerVerified: true,
    price: '0.8',
    currency: 'ETH',
    listingType: 'fixed',
    status: 'pending',
    views: 456,
    offers: 3,
    createdAt: '2024-01-13',
    thumbnail: '/api/placeholder/120/80',
  },
  {
    id: '4',
    title: 'Suspicious Content Video',
    seller: 'anonymous_user',
    sellerAddress: '0x4567...8901',
    sellerVerified: false,
    price: '0.05',
    currency: 'ETH',
    listingType: 'fixed',
    status: 'flagged',
    views: 123,
    offers: 0,
    createdAt: '2024-01-12',
    thumbnail: '/api/placeholder/120/80',
    flagReason: 'Potential copyright violation',
  },
  {
    id: '5',
    title: 'Sports Highlights Compilation',
    seller: 'ESPN Digital',
    sellerAddress: '0x5678...9012',
    sellerVerified: true,
    price: '0.45',
    currency: 'ETH',
    listingType: 'fixed',
    status: 'active',
    views: 2340,
    offers: 25,
    createdAt: '2024-01-11',
    thumbnail: '/api/placeholder/120/80',
  },
];

const MOCK_RECENT_SALES = [
  {
    id: '1',
    title: 'Rare Concert Footage',
    buyer: '0xabc...def',
    seller: '0x123...456',
    price: '1.5',
    currency: 'ETH',
    timestamp: '2 hours ago',
    platformFee: '0.0375',
    royalty: '0.075',
  },
  {
    id: '2',
    title: 'Vintage Car Show',
    buyer: '0xbcd...efg',
    seller: '0x234...567',
    price: '0.8',
    currency: 'ETH',
    timestamp: '4 hours ago',
    platformFee: '0.02',
    royalty: '0.04',
  },
  {
    id: '3',
    title: 'Tech Conference Keynote',
    buyer: '0xcde...fgh',
    seller: '0x345...678',
    price: '0.35',
    currency: 'ETH',
    timestamp: '6 hours ago',
    platformFee: '0.00875',
    royalty: '0.0175',
  },
];

export function AdminMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);

  const filteredListings = MOCK_LISTINGS.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesType = typeFilter === 'all' || listing.listingType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const toggleListingSelection = (id: string) => {
    setSelectedListings((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-400">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400">Pending</Badge>;
      case 'flagged':
        return <Badge className="bg-red-500/10 text-red-400">Flagged</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500/10 text-blue-400">Sold</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketplace Management</h1>
          <p className="text-slate-400">Monitor listings, sales, and marketplace activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600">
            Export Report
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Configure Fees
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-green-500/10 p-3">
                <ShoppingBag className="h-6 w-6 text-green-500" />
              </div>
              <Badge className="bg-green-500/10 text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                +{MOCK_MARKETPLACE_STATS.volumeChange}%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Total Volume</p>
              <p className="text-2xl font-bold text-white">
                {MOCK_MARKETPLACE_STATS.totalVolume} ETH
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {MOCK_MARKETPLACE_STATS.salesLast24h} sales (24h)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Tag className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Active Listings</p>
              <p className="text-2xl font-bold text-white">
                {MOCK_MARKETPLACE_STATS.activeListings.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-yellow-400">
                {MOCK_MARKETPLACE_STATS.pendingListings} pending review
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Gavel className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Active Auctions</p>
              <p className="text-2xl font-bold text-white">
                {MOCK_MARKETPLACE_STATS.activeAuctions}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {MOCK_MARKETPLACE_STATS.pendingOffers} pending offers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Flagged Listings</p>
              <p className="text-2xl font-bold text-white">
                {MOCK_MARKETPLACE_STATS.flaggedListings}
              </p>
              <p className="mt-1 text-sm text-red-400">Requires review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Listings Table */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Listings</CardTitle>
                <div className="flex items-center gap-2">
                  {selectedListings.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        {selectedListings.length} selected
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-400"
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400"
                      >
                        <Ban className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search listings..."
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
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="flagged">Flagged</option>
                  <option value="sold">Sold</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="fixed">Fixed Price</option>
                  <option value="auction">Auction</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className={`flex items-center gap-4 rounded-lg border p-4 ${
                      listing.status === 'flagged'
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-slate-700 bg-slate-700/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedListings.includes(listing.id)}
                      onChange={() => toggleListingSelection(listing.id)}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-600"
                    />
                    <div className="h-16 w-24 flex-shrink-0 rounded bg-slate-700" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white truncate">
                          {listing.title}
                        </h4>
                        {getStatusBadge(listing.status)}
                        {listing.listingType === 'auction' && (
                          <Badge className="bg-purple-500/10 text-purple-400">
                            <Gavel className="mr-1 h-3 w-3" />
                            Auction
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-400">
                          by{' '}
                          <span
                            className={
                              listing.sellerVerified ? 'text-blue-400' : 'text-slate-300'
                            }
                          >
                            {listing.seller}
                          </span>
                          {listing.sellerVerified && (
                            <CheckCircle className="ml-1 inline h-3 w-3 text-blue-400" />
                          )}
                        </span>
                        <span className="text-sm text-slate-500">
                          <Eye className="mr-1 inline h-3 w-3" />
                          {listing.views}
                        </span>
                        <span className="text-sm text-slate-500">
                          <Users className="mr-1 inline h-3 w-3" />
                          {listing.offers} offers
                        </span>
                      </div>
                      {listing.status === 'flagged' && listing.flagReason && (
                        <p className="mt-1 text-sm text-red-400">
                          <AlertTriangle className="mr-1 inline h-3 w-3" />
                          {listing.flagReason}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {listing.price} {listing.currency}
                      </p>
                      {listing.auctionEnds && (
                        <p className="text-xs text-slate-400">
                          <Clock className="mr-1 inline h-3 w-3" />
                          Ends {listing.auctionEnds}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_RECENT_SALES.map((sale) => (
                  <div
                    key={sale.id}
                    className="rounded-lg border border-slate-700 bg-slate-700/30 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{sale.title}</h4>
                        <p className="text-xs text-slate-400">{sale.timestamp}</p>
                      </div>
                      <span className="text-lg font-semibold text-green-400">
                        {sale.price} {sale.currency}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="text-slate-500">
                        <span>{sale.seller}</span>
                        <ArrowUpRight className="mx-1 inline h-3 w-3" />
                        <span>{sale.buyer}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-slate-700 px-2 py-1">
                        <span className="text-slate-400">Platform Fee:</span>{' '}
                        <span className="text-white">{sale.platformFee} ETH</span>
                      </div>
                      <div className="rounded bg-slate-700 px-2 py-1">
                        <span className="text-slate-400">Royalty:</span>{' '}
                        <span className="text-white">{sale.royalty} ETH</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fee Configuration */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Fee Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Platform Fee</span>
                  <span className="font-semibold text-white">2.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Min Listing Price</span>
                  <span className="font-semibold text-white">0.001 ETH</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Max Royalty</span>
                  <span className="font-semibold text-white">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Auction Extension</span>
                  <span className="font-semibold text-white">5 minutes</span>
                </div>
                <Button variant="outline" className="w-full border-slate-600 mt-2">
                  Edit Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminMarketplace;
