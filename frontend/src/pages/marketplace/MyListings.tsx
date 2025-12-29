import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/config/constants';
import { formatRelativeTime } from '@/lib/utils';
import {
  Plus,
  Tag,
  Gavel,
  Eye,
  Edit,
  MoreVertical,
  Clock,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Mock data
const MOCK_MY_LISTINGS = [
  {
    id: '1',
    nft: {
      id: 'nft-1',
      title: 'Breaking News Coverage 2024',
      thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
      tokenId: 42,
    },
    listingType: 'fixed_price' as const,
    status: 'active' as const,
    price: '0.5',
    currency: 'ETH',
    views: 234,
    offers: 3,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    nft: {
      id: 'nft-2',
      title: 'Exclusive Interview Footage',
      thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
      tokenId: 43,
    },
    listingType: 'auction' as const,
    status: 'active' as const,
    price: '0.3',
    currency: 'ETH',
    highestBid: '0.45',
    bidCount: 5,
    endTime: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    nft: {
      id: 'nft-3',
      title: 'Documentary Clip - Nature',
      thumbnail: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400',
      tokenId: 44,
    },
    listingType: 'fixed_price' as const,
    status: 'sold' as const,
    price: '1.2',
    currency: 'ETH',
    soldAt: new Date(Date.now() - 432000000).toISOString(),
    soldTo: '0xbuyer...',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
];

const MOCK_RECEIVED_OFFERS = [
  {
    id: 'offer-1',
    nft: {
      id: 'nft-1',
      title: 'Breaking News Coverage 2024',
      thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
    },
    buyer: '0xbuyer1...',
    amount: '0.45',
    currency: 'ETH',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'active' as const,
  },
  {
    id: 'offer-2',
    nft: {
      id: 'nft-1',
      title: 'Breaking News Coverage 2024',
      thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
    },
    buyer: '0xbuyer2...',
    amount: '0.42',
    currency: 'ETH',
    expiresAt: new Date(Date.now() + 172800000).toISOString(),
    status: 'active' as const,
  },
];

type Tab = 'listings' | 'offers';

export function MyListings() {
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const activeListings = MOCK_MY_LISTINGS.filter((l) => l.status === 'active');
  const soldListings = MOCK_MY_LISTINGS.filter((l) => l.status === 'sold');
  const activeOffers = MOCK_RECEIVED_OFFERS.filter((o) => o.status === 'active');

  // Stats
  const totalVolume = soldListings.reduce((sum, l) => sum + parseFloat(l.price), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">
            Manage your NFT listings and offers
          </p>
        </div>
        <Link to={ROUTES.createListing}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-blue-500/10 p-2">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="text-xl font-bold">{activeListings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-500/10 p-2">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-xl font-bold">{soldListings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-purple-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-xl font-bold">{totalVolume.toFixed(2)} ETH</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-orange-500/10 p-2">
              <Gavel className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Offers</p>
              <p className="text-xl font-bold">{activeOffers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          className={`pb-2 font-medium ${
            activeTab === 'listings'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('listings')}
        >
          My Listings ({MOCK_MY_LISTINGS.length})
        </button>
        <button
          className={`pb-2 font-medium ${
            activeTab === 'offers'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('offers')}
        >
          Received Offers ({activeOffers.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'listings' ? (
        <div className="space-y-4">
          {MOCK_MY_LISTINGS.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Tag className="h-16 w-16 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No listings yet</h2>
                <p className="mt-2 text-muted-foreground">
                  Create your first listing to start selling
                </p>
                <Link to={ROUTES.createListing} className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            MOCK_MY_LISTINGS.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    <img
                      src={listing.nft.thumbnail}
                      alt={listing.nft.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={ROUTES.nft(listing.nft.id)}
                          className="font-semibold hover:underline"
                        >
                          {listing.nft.title}
                        </Link>
                        <Badge
                          variant={
                            listing.status === 'active'
                              ? 'default'
                              : listing.status === 'sold'
                              ? 'outline'
                              : 'secondary'
                          }
                        >
                          {listing.status === 'active' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {listing.status}
                        </Badge>
                        <Badge variant="secondary">
                          {listing.listingType === 'auction' ? (
                            <>
                              <Gavel className="mr-1 h-3 w-3" />
                              Auction
                            </>
                          ) : (
                            <>
                              <Tag className="mr-1 h-3 w-3" />
                              Fixed Price
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Token #{listing.nft.tokenId} &middot; Listed {formatRelativeTime(listing.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /> {listing.views} views
                      </span>
                      {listing.listingType === 'fixed_price' && listing.offers && (
                        <span className="flex items-center gap-1">
                          <Gavel className="h-4 w-4" /> {listing.offers} offers
                        </span>
                      )}
                      {listing.listingType === 'auction' && listing.endTime && (
                        <span className="flex items-center gap-1 text-orange-500">
                          <Clock className="h-4 w-4" />
                          Ends {formatRelativeTime(listing.endTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      {listing.listingType === 'auction' && listing.highestBid ? (
                        <>
                          <p className="text-sm text-muted-foreground">Current Bid</p>
                          <p className="text-lg font-bold">
                            {listing.highestBid} {listing.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {listing.bidCount} bids
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="text-lg font-bold">
                            {listing.price} {listing.currency}
                          </p>
                        </>
                      )}
                    </div>

                    {listing.status === 'active' && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === listing.id ? null : listing.id)
                          }
                          className="rounded p-2 hover:bg-accent"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpen === listing.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setMenuOpen(null)}
                            />
                            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border bg-popover p-1 shadow-lg">
                              <button className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent">
                                <Edit className="h-4 w-4" />
                                Edit Price
                              </button>
                              <button className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent">
                                <XCircle className="h-4 w-4" />
                                Cancel Listing
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activeOffers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Gavel className="h-16 w-16 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No offers yet</h2>
                <p className="mt-2 text-muted-foreground">
                  Offers on your listings will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            activeOffers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    <img
                      src={offer.nft.thumbnail}
                      alt={offer.nft.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        to={ROUTES.nft(offer.nft.id)}
                        className="font-semibold hover:underline"
                      >
                        {offer.nft.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        From {offer.buyer}
                      </p>
                    </div>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Expires {formatRelativeTime(offer.expiresAt)}
                    </p>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Offer Amount</p>
                      <p className="text-lg font-bold">
                        {offer.amount} {offer.currency}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Reject
                      </Button>
                      <Button size="sm">Accept</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MyListings;
