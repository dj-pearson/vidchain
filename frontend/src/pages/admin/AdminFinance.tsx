import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Coins,
  PiggyBank,
  ArrowDownRight,
  Wallet,
  BarChart3,
  Download,
  RefreshCw,
  ExternalLink,
  CircleDollarSign,
  Flame,
  Lock,
} from 'lucide-react';

// Mock financial data
const MOCK_TREASURY = {
  balances: {
    ETH: { amount: '456.78', usdValue: 1119111.00 },
    MATIC: { amount: '125000', usdValue: 106250.00 },
    VCT: { amount: '50000000', usdValue: 500000.00 },
    VIDC: { amount: '5000000', usdValue: 500000.00 },
    USDC: { amount: '250000', usdValue: 250000.00 },
  },
  totalUsdValue: 2475361.00,
};

const MOCK_REVENUE = {
  today: { amount: '12.45', currency: 'ETH', usdValue: 30502.50 },
  week: { amount: '89.23', currency: 'ETH', usdValue: 218613.50 },
  month: { amount: '345.67', currency: 'ETH', usdValue: 846891.50 },
  allTime: { amount: '2456.78', currency: 'ETH', usdValue: 6019111.00 },
};

const MOCK_TOKEN_STATS = {
  vct: {
    totalSupply: '1,000,000,000',
    circulating: '450,000,000',
    staked: '125,000,000',
    burned: '0',
    price: '0.01',
    marketCap: '4,500,000',
  },
  vidc: {
    totalMinted: '10,000,000',
    circulating: '8,500,000',
    burned: '1,500,000',
    dailyEmission: '25,000',
    uploadFees: '750,000',
  },
};

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'platform_fee',
    description: 'Marketplace sale fee',
    amount: '+0.0125',
    currency: 'ETH',
    from: '0x1234...5678',
    date: new Date(Date.now() - 3600000).toISOString(),
    txHash: '0xabc...',
  },
  {
    id: '2',
    type: 'upload_fee',
    description: 'Video upload fee (50MB)',
    amount: '+5',
    currency: 'VIDC',
    from: '0x2345...6789',
    date: new Date(Date.now() - 7200000).toISOString(),
    txHash: '0xdef...',
  },
  {
    id: '3',
    type: 'royalty',
    description: 'Platform royalty (secondary sale)',
    amount: '+0.02',
    currency: 'ETH',
    from: '0x3456...7890',
    date: new Date(Date.now() - 10800000).toISOString(),
    txHash: '0xghi...',
  },
  {
    id: '4',
    type: 'burn',
    description: 'VIDC burned (upload fees)',
    amount: '-2500',
    currency: 'VIDC',
    from: 'Treasury',
    date: new Date(Date.now() - 86400000).toISOString(),
    txHash: '0xjkl...',
  },
];

const MOCK_FEE_BREAKDOWN = {
  marketplace: { amount: '234.56', percentage: 68 },
  uploads: { amount: '78.90', percentage: 23 },
  licensing: { amount: '32.21', percentage: 9 },
};

type TimeRange = '24h' | '7d' | '30d' | 'all';

export function AdminFinance() {
  const [_timeRange, _setTimeRange] = useState<TimeRange>('30d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Dashboard</h1>
          <p className="text-slate-400">
            Treasury balances, revenue, and token statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Treasury Balance */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <PiggyBank className="h-6 w-6 text-green-500" />
            Treasury Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-sm text-slate-400">Total Value (USD)</p>
            <p className="text-4xl font-bold text-white">
              ${MOCK_TREASURY.totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(MOCK_TREASURY.balances).map(([token, data]) => (
              <div key={token} className="rounded-lg bg-slate-800/50 p-4">
                <div className="flex items-center gap-2">
                  <Coins className={`h-5 w-5 ${
                    token === 'ETH' ? 'text-blue-500' :
                    token === 'MATIC' ? 'text-purple-500' :
                    token === 'VCT' ? 'text-green-500' :
                    token === 'VIDC' ? 'text-orange-500' :
                    'text-green-400'
                  }`} />
                  <span className="font-medium text-white">{token}</span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">{data.amount}</p>
                <p className="text-sm text-slate-400">
                  ${data.usdValue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-green-500" />
              <Badge className="bg-green-500/10 text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                +12%
              </Badge>
            </div>
            <p className="mt-4 text-sm text-slate-400">Today's Revenue</p>
            <p className="text-2xl font-bold text-white">
              {MOCK_REVENUE.today.amount} ETH
            </p>
            <p className="text-sm text-slate-500">
              ${MOCK_REVENUE.today.usdValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <Badge className="bg-green-500/10 text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                +8%
              </Badge>
            </div>
            <p className="mt-4 text-sm text-slate-400">Weekly Revenue</p>
            <p className="text-2xl font-bold text-white">
              {MOCK_REVENUE.week.amount} ETH
            </p>
            <p className="text-sm text-slate-500">
              ${MOCK_REVENUE.week.usdValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <CircleDollarSign className="h-8 w-8 text-purple-500" />
              <Badge className="bg-green-500/10 text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                +15%
              </Badge>
            </div>
            <p className="mt-4 text-sm text-slate-400">Monthly Revenue</p>
            <p className="text-2xl font-bold text-white">
              {MOCK_REVENUE.month.amount} ETH
            </p>
            <p className="text-sm text-slate-500">
              ${MOCK_REVENUE.month.usdValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Wallet className="h-8 w-8 text-orange-500" />
            </div>
            <p className="mt-4 text-sm text-slate-400">All-Time Revenue</p>
            <p className="text-2xl font-bold text-white">
              {MOCK_REVENUE.allTime.amount} ETH
            </p>
            <p className="text-sm text-slate-500">
              ${MOCK_REVENUE.allTime.usdValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Statistics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* VCT Stats */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coins className="h-5 w-5 text-green-500" />
              VCT Token Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Total Supply</p>
                <p className="text-xl font-bold text-white">{MOCK_TOKEN_STATS.vct.totalSupply}</p>
              </div>
              <div className="rounded-lg bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Circulating</p>
                <p className="text-xl font-bold text-white">{MOCK_TOKEN_STATS.vct.circulating}</p>
              </div>
              <div className="rounded-lg bg-slate-900 p-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-slate-400">Staked</p>
                </div>
                <p className="text-xl font-bold text-white">{MOCK_TOKEN_STATS.vct.staked}</p>
              </div>
              <div className="rounded-lg bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Price</p>
                <p className="text-xl font-bold text-green-400">${MOCK_TOKEN_STATS.vct.price}</p>
              </div>
            </div>
            <div className="rounded-lg bg-green-500/10 p-4">
              <p className="text-sm text-slate-400">Market Cap</p>
              <p className="text-2xl font-bold text-green-400">
                ${MOCK_TOKEN_STATS.vct.marketCap}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VIDC Stats */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coins className="h-5 w-5 text-orange-500" />
              VIDC Token Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Total Minted</p>
                <p className="text-xl font-bold text-white">{MOCK_TOKEN_STATS.vidc.totalMinted}</p>
              </div>
              <div className="rounded-lg bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Circulating</p>
                <p className="text-xl font-bold text-white">{MOCK_TOKEN_STATS.vidc.circulating}</p>
              </div>
              <div className="rounded-lg bg-slate-900 p-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-slate-400">Burned</p>
                </div>
                <p className="text-xl font-bold text-red-400">{MOCK_TOKEN_STATS.vidc.burned}</p>
              </div>
              <div className="rounded-lg bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Daily Emission</p>
                <p className="text-xl font-bold text-orange-400">{MOCK_TOKEN_STATS.vidc.dailyEmission}</p>
              </div>
            </div>
            <div className="rounded-lg bg-orange-500/10 p-4">
              <p className="text-sm text-slate-400">Upload Fees Collected</p>
              <p className="text-2xl font-bold text-orange-400">
                {MOCK_TOKEN_STATS.vidc.uploadFees} VIDC
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Breakdown */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Revenue Breakdown (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Marketplace Fees</span>
                <Badge className="bg-blue-500/10 text-blue-400">
                  {MOCK_FEE_BREAKDOWN.marketplace.percentage}%
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {MOCK_FEE_BREAKDOWN.marketplace.amount} ETH
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${MOCK_FEE_BREAKDOWN.marketplace.percentage}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Upload Fees</span>
                <Badge className="bg-orange-500/10 text-orange-400">
                  {MOCK_FEE_BREAKDOWN.uploads.percentage}%
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {MOCK_FEE_BREAKDOWN.uploads.amount} ETH
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${MOCK_FEE_BREAKDOWN.uploads.percentage}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Licensing Fees</span>
                <Badge className="bg-purple-500/10 text-purple-400">
                  {MOCK_FEE_BREAKDOWN.licensing.percentage}%
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {MOCK_FEE_BREAKDOWN.licensing.amount} ETH
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${MOCK_FEE_BREAKDOWN.licensing.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Treasury Transactions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Treasury Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_TRANSACTIONS.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg bg-slate-900 p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-full p-2 ${
                      tx.type === 'burn'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-green-500/10 text-green-500'
                    }`}
                  >
                    {tx.type === 'burn' ? (
                      <Flame className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{tx.description}</p>
                    <p className="text-sm text-slate-500">
                      From: {tx.from} • {formatRelativeTime(tx.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {tx.amount} {tx.currency}
                    </p>
                  </div>
                  <a
                    href={`https://polygonscan.com/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-2 text-slate-400 hover:bg-slate-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminFinance;
