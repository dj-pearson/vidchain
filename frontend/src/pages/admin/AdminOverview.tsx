import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Video,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Coins,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

// Mock data - would be fetched from API
const MOCK_STATS = {
  users: {
    total: 12453,
    new24h: 156,
    newWeek: 892,
    growth: 12.5,
  },
  videos: {
    total: 45678,
    pending: 23,
    verified: 44890,
    failed: 12,
  },
  marketplace: {
    activeListings: 1234,
    totalVolume: '156,789.45',
    volumeCurrency: 'ETH',
    sales24h: 89,
    salesVolume24h: '234.56',
  },
  tokens: {
    vctCirculating: '450,000,000',
    vidcCirculating: '8,500,000',
    vidcBurned: '1,250,000',
    stakingTVL: '125,000,000',
  },
  fees: {
    collected24h: '12.45',
    collectedWeek: '89.23',
    collectedMonth: '345.67',
    currency: 'ETH',
  },
  moderation: {
    pendingReports: 15,
    resolvedToday: 8,
    avgResolutionTime: '2.5h',
  },
};

const RECENT_ACTIVITY = [
  {
    type: 'user_signup',
    message: 'New user registered: john.doe@example.com',
    time: '2 mins ago',
    icon: Users,
  },
  {
    type: 'sale',
    message: 'NFT sold for 0.5 ETH: "Historic Footage"',
    time: '5 mins ago',
    icon: ShoppingBag,
  },
  {
    type: 'verification',
    message: 'Video verified: "Breaking News 2024"',
    time: '12 mins ago',
    icon: Shield,
  },
  {
    type: 'report',
    message: 'New content report submitted',
    time: '18 mins ago',
    icon: AlertTriangle,
  },
  {
    type: 'listing',
    message: 'New listing created: "Documentary Clip"',
    time: '25 mins ago',
    icon: Video,
  },
];

const TOP_SELLERS = [
  { name: 'NASA Archives', volume: '45.6 ETH', sales: 156, verified: true },
  { name: 'CNN Digital', volume: '32.4 ETH', sales: 89, verified: true },
  { name: 'NatGeo', volume: '28.9 ETH', sales: 67, verified: true },
  { name: 'Independent Creator', volume: '15.2 ETH', sales: 45, verified: false },
  { name: 'Reuters', volume: '12.8 ETH', sales: 34, verified: true },
];

export function AdminOverview() {
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
              <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                +{MOCK_STATS.users.growth}%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-white">
                {MOCK_STATS.users.total.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                +{MOCK_STATS.users.new24h} today
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
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400">
                {MOCK_STATS.videos.pending} pending
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Total Videos</p>
              <p className="text-3xl font-bold text-white">
                {MOCK_STATS.videos.total.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-green-400">
                {MOCK_STATS.videos.verified.toLocaleString()} verified
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Volume */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-green-500/10 p-3">
                <ShoppingBag className="h-6 w-6 text-green-500" />
              </div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                +8.2%
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Total Volume</p>
              <p className="text-3xl font-bold text-white">
                {MOCK_STATS.marketplace.totalVolume} {MOCK_STATS.marketplace.volumeCurrency}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {MOCK_STATS.marketplace.sales24h} sales today
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform Fees */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-orange-500/10 p-3">
                <DollarSign className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-400">Fees (30d)</p>
              <p className="text-3xl font-bold text-white">
                {MOCK_STATS.fees.collectedMonth} {MOCK_STATS.fees.currency}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {MOCK_STATS.fees.collected24h} ETH today
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-slate-400">VCT Circulating</p>
                <p className="font-semibold text-white">{MOCK_STATS.tokens.vctCirculating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-slate-400">VIDC Circulating</p>
                <p className="font-semibold text-white">{MOCK_STATS.tokens.vidcCirculating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-400">VIDC Burned</p>
                <p className="font-semibold text-white">{MOCK_STATS.tokens.vidcBurned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-400">Staking TVL</p>
                <p className="font-semibold text-white">{MOCK_STATS.tokens.stakingTVL} VCT</p>
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
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      activity.type === 'sale'
                        ? 'bg-green-500/10 text-green-500'
                        : activity.type === 'report'
                        ? 'bg-red-500/10 text-red-500'
                        : activity.type === 'verification'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{activity.message}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Sellers */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Sellers (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TOP_SELLERS.map((seller, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {seller.name}
                        </span>
                        {seller.verified && (
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {seller.sales} sales
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-green-400">
                    {seller.volume}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Alerts */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Moderation Queue</CardTitle>
            <Badge variant="destructive">{MOCK_STATS.moderation.pendingReports} pending</Badge>
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
                {MOCK_STATS.moderation.pendingReports}
              </p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-400">Resolved Today</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {MOCK_STATS.moderation.resolvedToday}
              </p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-blue-400">Avg Resolution Time</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {MOCK_STATS.moderation.avgResolutionTime}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminOverview;
