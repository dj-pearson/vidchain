import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// Badge import removed - unused
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/config/constants';
import { formatRelativeTime } from '@/lib/utils';
import {
  Play,
  Heart,
  Share2,
  Eye,
  Clock,
  User,
  Verified,
  Shield,
  ExternalLink,
  Tag,
  Gavel,
  History,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Coins,
  ArrowLeft,
} from 'lucide-react';

// Mock NFT data
const MOCK_NFT = {
  id: '1',
  title: 'Historic Moon Landing Footage - Original Broadcast',
  description: 'This is the original broadcast footage of the Apollo 11 moon landing from July 20, 1969. This verified video has been authenticated on the VidChain blockchain and represents a piece of human history.',
  thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800',
  videoUrl: 'https://example.com/video.mp4',
  tokenId: 42,
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',

  // Listing info
  listing: {
    type: 'fixed_price' as const,
    price: '0.5',
    currency: 'ETH',
    acceptsOffers: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },

  // Ownership
  seller: {
    name: 'NASA Archives',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=nasa',
  },
  originalCreator: {
    name: 'NASA',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    verified: true,
  },

  // Verification
  verification: {
    sha256Hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    ipfsCid: 'QmYwAPJzv5CZsnAzt8auVZRnF4kxJvL2HRMT9c8YfnJ3Rc',
    verifiedAt: new Date(Date.now() - 604800000).toISOString(),
    transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
  },

  // Licensing
  licensing: {
    commercialUse: true,
    attributionRequired: true,
    modificationsAllowed: false,
    mediaLicensingEnabled: true,
  },

  // Royalties
  royalties: {
    creatorRoyaltyBps: 500, // 5%
    platformRoyaltyBps: 200, // 2%
  },

  // Stats
  stats: {
    views: 12500,
    likes: 890,
    totalSales: 3,
    totalVolume: '2.5',
  },

  // Properties
  properties: [
    { trait: 'Duration', value: '2:34' },
    { trait: 'Resolution', value: '1080p' },
    { trait: 'Category', value: 'Documentary' },
    { trait: 'Year', value: '1969' },
  ],

  // Activity history
  activity: [
    {
      type: 'listing',
      from: 'NASA Archives',
      price: '0.5',
      currency: 'ETH',
      date: new Date(Date.now() - 86400000).toISOString(),
      txHash: '0xabc...',
    },
    {
      type: 'sale',
      from: 'Original Collector',
      to: 'NASA Archives',
      price: '0.3',
      currency: 'ETH',
      date: new Date(Date.now() - 604800000).toISOString(),
      txHash: '0xdef...',
    },
    {
      type: 'mint',
      to: 'Original Collector',
      date: new Date(Date.now() - 2592000000).toISOString(),
      txHash: '0x123...',
    },
  ],

  // Current offers
  offers: [
    {
      id: '1',
      buyer: '0xbuyer1...',
      amount: '0.45',
      currency: 'ETH',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: '2',
      buyer: '0xbuyer2...',
      amount: '0.42',
      currency: 'ETH',
      expiresAt: new Date(Date.now() + 172800000).toISOString(),
    },
  ],
};

export function NFTDetail() {
  const { id: _id } = useParams<{ id: string }>();
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    properties: true,
    activity: true,
    offers: true,
  });

  const nft = MOCK_NFT; // Will be replaced with API call

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        to={ROUTES.marketplace}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Column - Video & Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Video Player */}
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
              <img
                src={nft.thumbnail}
                alt={nft.title}
                className="h-full w-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition-transform hover:scale-110">
                  <Play className="h-12 w-12 text-white" fill="white" />
                </button>
              </div>
              {/* Verification Badge Overlay */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-green-500/90 px-3 py-1 text-sm text-white">
                <Shield className="h-4 w-4" />
                Verified on VidChain
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('description')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
                {expandedSections.description ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.description && (
              <CardContent>
                <p className="text-muted-foreground">{nft.description}</p>

                {/* Licensing Info */}
                <div className="mt-4 rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Licensing Terms</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {nft.licensing.commercialUse ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      Commercial Use
                    </div>
                    <div className="flex items-center gap-2">
                      {nft.licensing.attributionRequired ? (
                        <CheckCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      Attribution Required
                    </div>
                    <div className="flex items-center gap-2">
                      {nft.licensing.modificationsAllowed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      Modifications Allowed
                    </div>
                    <div className="flex items-center gap-2">
                      {nft.licensing.mediaLicensingEnabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      Media Licensing
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Properties */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('properties')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Properties
                </CardTitle>
                {expandedSections.properties ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.properties && (
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {nft.properties.map((prop) => (
                    <div
                      key={prop.trait}
                      className="rounded-lg border bg-accent/50 p-3 text-center"
                    >
                      <p className="text-xs text-muted-foreground uppercase">
                        {prop.trait}
                      </p>
                      <p className="mt-1 font-semibold">{prop.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('activity')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Activity
                </CardTitle>
                {expandedSections.activity ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.activity && (
              <CardContent>
                <div className="space-y-4">
                  {nft.activity.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-2 ${
                            event.type === 'sale'
                              ? 'bg-green-500/10 text-green-500'
                              : event.type === 'listing'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-purple-500/10 text-purple-500'
                          }`}
                        >
                          {event.type === 'sale' ? (
                            <Coins className="h-4 w-4" />
                          ) : event.type === 'listing' ? (
                            <Tag className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{event.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.from && `From ${event.from}`}
                            {event.to && ` to ${event.to}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {event.price && (
                          <p className="font-semibold">
                            {event.price} {event.currency}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatRelativeTime(event.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column - Purchase Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Stats */}
          <div>
            <h1 className="text-2xl font-bold">{nft.title}</h1>
            <div className="mt-2 flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> {nft.stats.views.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" /> {nft.stats.likes}
              </span>
              <button className="flex items-center gap-1 hover:text-foreground">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>

          {/* Owner & Creator Cards */}
          <div className="space-y-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <img
                  src={nft.seller.avatar}
                  alt={nft.seller.name}
                  className="h-12 w-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Current Owner</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{nft.seller.name}</p>
                    {nft.seller.verified && (
                      <Verified className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Original Creator</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{nft.originalCreator.name}</p>
                    {nft.originalCreator.verified && (
                      <Verified className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Receives {nft.royalties.creatorRoyaltyBps / 100}% royalty on sales
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {nft.listing.price} {nft.listing.currency}
                </span>
                <span className="text-muted-foreground">($1,234.56)</span>
              </div>

              <div className="mt-6 space-y-3">
                <Button className="w-full" size="lg">
                  <Coins className="mr-2 h-5 w-5" />
                  Buy Now
                </Button>

                {nft.listing.acceptsOffers && (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => setShowOfferModal(true)}
                  >
                    <Gavel className="mr-2 h-5 w-5" />
                    Make Offer
                  </Button>
                )}
              </div>

              {/* Fee Breakdown */}
              <div className="mt-6 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Creator Royalty ({nft.royalties.creatorRoyaltyBps / 100}%)</span>
                  <span>0.025 ETH</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee ({nft.royalties.platformRoyaltyBps / 100}%)</span>
                  <span>0.01 ETH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offers */}
          {nft.offers.length > 0 && (
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection('offers')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Offers ({nft.offers.length})
                  </CardTitle>
                  {expandedSections.offers ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.offers && (
                <CardContent>
                  <div className="space-y-3">
                    {nft.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {offer.amount} {offer.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            by {offer.buyer}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <Clock className="mr-1 inline h-3 w-3" />
                          Expires {formatRelativeTime(offer.expiresAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Verification Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Verification Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Token ID</p>
                <p className="font-mono">#{nft.tokenId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contract Address</p>
                <a
                  href={`https://polygonscan.com/address/${nft.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-primary hover:underline"
                >
                  {nft.contractAddress.slice(0, 10)}...{nft.contractAddress.slice(-8)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">SHA-256 Hash</p>
                <p className="font-mono text-xs break-all">
                  {nft.verification.sha256Hash}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">IPFS CID</p>
                <a
                  href={`https://ipfs.io/ipfs/${nft.verification.ipfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-primary hover:underline"
                >
                  {nft.verification.ipfsCid.slice(0, 20)}...
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">Verified</p>
                <p>{formatRelativeTime(nft.verification.verifiedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Make an Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Offer Amount (ETH)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowOfferModal(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1">Submit Offer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default NFTDetail;
