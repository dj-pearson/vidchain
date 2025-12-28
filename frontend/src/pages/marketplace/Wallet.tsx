import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/config/constants';
import { formatRelativeTime } from '@/lib/utils';
import {
  Wallet as WalletIcon,
  Coins,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Copy,
  ExternalLink,
  Gift,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// Mock wallet data
const MOCK_WALLET = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  balances: {
    ETH: { amount: '2.5', usdValue: 6125.00 },
    MATIC: { amount: '1500', usdValue: 1275.00 },
    VCT: { amount: '25000', usdValue: 250.00 },
    VIDC: { amount: '1200', usdValue: 0 }, // Platform utility token
  },
  pendingRewards: {
    VIDC: '45.5',
    lastCalculated: new Date().toISOString(),
  },
  staking: {
    stakedVCT: '10000',
    apy: 8,
    pendingRewards: '125.5',
    unlockDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days
  },
};

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'sale',
    description: 'Sold "Historic Footage"',
    amount: '+0.5',
    currency: 'ETH',
    status: 'confirmed',
    date: new Date(Date.now() - 3600000).toISOString(),
    txHash: '0xabc...',
  },
  {
    id: '2',
    type: 'upload_fee',
    description: 'Upload fee for "New Video"',
    amount: '-5',
    currency: 'VIDC',
    status: 'confirmed',
    date: new Date(Date.now() - 86400000).toISOString(),
    txHash: '0xdef...',
  },
  {
    id: '3',
    type: 'reward',
    description: 'Daily ownership reward',
    amount: '+12.5',
    currency: 'VIDC',
    status: 'confirmed',
    date: new Date(Date.now() - 86400000).toISOString(),
    txHash: '0xghi...',
  },
  {
    id: '4',
    type: 'staking_reward',
    description: 'Staking reward claimed',
    amount: '+50',
    currency: 'VCT',
    status: 'confirmed',
    date: new Date(Date.now() - 172800000).toISOString(),
    txHash: '0xjkl...',
  },
  {
    id: '5',
    type: 'purchase',
    description: 'Purchased "Rare Documentary"',
    amount: '-1.2',
    currency: 'ETH',
    status: 'pending',
    date: new Date(Date.now() - 300000).toISOString(),
    txHash: '0xmno...',
  },
];

type Tab = 'overview' | 'transactions' | 'staking';

export function Wallet() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(MOCK_WALLET.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalUsdValue = Object.values(MOCK_WALLET.balances).reduce(
    (sum, b) => sum + b.usdValue,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {MOCK_WALLET.address.slice(0, 10)}...{MOCK_WALLET.address.slice(-8)}
            </code>
            <button
              onClick={copyAddress}
              className="rounded p-1 hover:bg-accent"
              title="Copy address"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <a
              href={`https://polygonscan.com/address/${MOCK_WALLET.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 hover:bg-accent"
              title="View on PolygonScan"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ArrowDownLeft className="mr-2 h-4 w-4" />
            Receive
          </Button>
          <Button>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Total Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="mt-2 text-4xl font-bold">
            ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              +5.2% today
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          className={`pb-2 font-medium ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`pb-2 font-medium ${
            activeTab === 'transactions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`pb-2 font-medium ${
            activeTab === 'staking'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('staking')}
        >
          Staking
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Token Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Token Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(MOCK_WALLET.balances).map(([token, data]) => (
                <div
                  key={token}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        token === 'ETH'
                          ? 'bg-blue-500/10 text-blue-500'
                          : token === 'MATIC'
                          ? 'bg-purple-500/10 text-purple-500'
                          : token === 'VCT'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-orange-500/10 text-orange-500'
                      }`}
                    >
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{token}</p>
                      <p className="text-sm text-muted-foreground">
                        {token === 'VCT'
                          ? 'Trading Token'
                          : token === 'VIDC'
                          ? 'Platform Token'
                          : token}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{data.amount}</p>
                    {data.usdValue > 0 && (
                      <p className="text-sm text-muted-foreground">
                        ${data.usdValue.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Pending Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ownership Rewards */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Ownership Rewards</p>
                    <p className="text-sm text-muted-foreground">
                      Earned from maintaining video NFTs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">
                      {MOCK_WALLET.pendingRewards.VIDC} VIDC
                    </p>
                  </div>
                </div>
                <Button className="mt-4 w-full" size="sm">
                  Claim Rewards
                </Button>
              </div>

              {/* Staking Rewards */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Staking Rewards</p>
                    <p className="text-sm text-muted-foreground">
                      {MOCK_WALLET.staking.apy}% APY on staked VCT
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-500">
                      {MOCK_WALLET.staking.pendingRewards} VCT
                    </p>
                  </div>
                </div>
                <Button className="mt-4 w-full" size="sm" variant="outline">
                  Claim Staking Rewards
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link to={ROUTES.staking}>
                  <Button variant="outline" className="w-full">
                    <Lock className="mr-2 h-4 w-4" />
                    Stake VCT
                  </Button>
                </Link>
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Swap Tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_TRANSACTIONS.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        tx.type === 'sale' || tx.type === 'reward' || tx.type === 'staking_reward'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {tx.type === 'sale' || tx.type === 'reward' || tx.type === 'staking_reward' ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          tx.amount.startsWith('+')
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {tx.amount} {tx.currency}
                      </p>
                      <Badge
                        variant={tx.status === 'confirmed' ? 'outline' : 'secondary'}
                      >
                        {tx.status === 'confirmed' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {tx.status}
                      </Badge>
                    </div>
                    <a
                      href={`https://polygonscan.com/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 hover:bg-accent"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'staking' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Stake */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Your Stake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">Staked VCT</p>
                <p className="mt-2 text-4xl font-bold">{MOCK_WALLET.staking.stakedVCT}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Badge variant="secondary">
                    {MOCK_WALLET.staking.apy}% APY
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    Unlocks {formatRelativeTime(MOCK_WALLET.staking.unlockDate)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Rewards</span>
                  <span className="font-semibold text-green-500">
                    {MOCK_WALLET.staking.pendingRewards} VCT
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Monthly</span>
                  <span>~67 VCT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Yearly</span>
                  <span>~800 VCT</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">
                  <Gift className="mr-2 h-4 w-4" />
                  Claim Rewards
                </Button>
                <Button variant="outline" className="flex-1">
                  <Unlock className="mr-2 h-4 w-4" />
                  Unstake
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stake More */}
          <Card>
            <CardHeader>
              <CardTitle>Stake More VCT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Amount to Stake</label>
                <div className="mt-1 flex gap-2">
                  <Input type="number" placeholder="0" />
                  <Button variant="outline" size="sm">
                    Max
                  </Button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Available: {MOCK_WALLET.balances.VCT.amount} VCT
                </p>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <h4 className="font-semibold">APY Tiers</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>1,000+ VCT</span>
                    <span className="text-green-500">5% APY</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10,000+ VCT</span>
                    <span className="text-green-500">8% APY</span>
                  </div>
                  <div className="flex justify-between">
                    <span>100,000+ VCT</span>
                    <span className="text-green-500">12% APY</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1,000,000+ VCT</span>
                    <span className="text-green-500">15% APY</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-500" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-600">Lock Period</p>
                    <p className="text-muted-foreground">
                      Staked tokens are locked for 30 days. Early unstaking incurs a 10% penalty.
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <Lock className="mr-2 h-4 w-4" />
                Stake VCT
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Wallet;
