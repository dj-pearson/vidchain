import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ROUTES, MARKETPLACE_CONFIG } from '@/config/constants';
import { formatRelativeTime } from '@/lib/utils';
import {
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Clock,
  DollarSign,
  Gavel,
  Tag,
  Play,
  Heart,
  Eye,
  User,
  Verified,
} from 'lucide-react';

// Mock data for listings - will be replaced with real API
const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Historic Moon Landing Footage',
    thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400',
    price: '0.5',
    currency: 'ETH',
    listingType: 'fixed_price',
    seller: {
      name: 'NASA Archives',
      verified: true,
      address: '0x1234...5678',
    },
    originalCreator: {
      name: 'NASA',
      address: '0x1234...5678',
    },
    stats: {
      views: 1250,
      likes: 89,
      offers: 3,
    },
    duration: '2:34',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Breaking News: Election Results 2024',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
    price: '1.2',
    currency: 'ETH',
    listingType: 'auction',
    endTime: new Date(Date.now() + 3600000).toISOString(),
    highestBid: '1.5',
    bidCount: 12,
    seller: {
      name: 'CNN Digital',
      verified: true,
      address: '0x2345...6789',
    },
    originalCreator: {
      name: 'CNN',
      address: '0x2345...6789',
    },
    stats: {
      views: 3420,
      likes: 234,
      offers: 0,
    },
    duration: '5:12',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    title: 'Exclusive Interview: Tech CEO Reveals Future Plans',
    thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
    price: '0.8',
    currency: 'ETH',
    listingType: 'fixed_price',
    seller: {
      name: 'TechNews',
      verified: false,
      address: '0x3456...7890',
    },
    originalCreator: {
      name: 'Independent Creator',
      address: '0x3456...7890',
    },
    stats: {
      views: 890,
      likes: 45,
      offers: 7,
    },
    duration: '8:45',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '4',
    title: 'Rare Wildlife Documentary Clip',
    thumbnail: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400',
    price: '2.0',
    currency: 'ETH',
    listingType: 'auction',
    endTime: new Date(Date.now() + 86400000).toISOString(),
    highestBid: '2.3',
    bidCount: 8,
    seller: {
      name: 'NatGeo',
      verified: true,
      address: '0x4567...8901',
    },
    originalCreator: {
      name: 'National Geographic',
      address: '0x4567...8901',
    },
    stats: {
      views: 2100,
      likes: 156,
      offers: 0,
    },
    duration: '4:20',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'price_low' | 'price_high' | 'ending_soon' | 'most_viewed';
type FilterType = 'all' | 'fixed_price' | 'auction';

export function Marketplace() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort listings
  const filteredListings = MOCK_LISTINGS.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || listing.listingType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">NFT Marketplace</h1>
          <p className="text-muted-foreground">
            Discover, collect, and trade verified video NFTs
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.myListings}>
            <Button variant="outline">My Listings</Button>
          </Link>
          <Link to={ROUTES.createListing}>
            <Button>
              <Tag className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-xl font-bold">1,234 ETH</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-500/10 p-2">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Floor Price</p>
              <p className="text-xl font-bold">0.05 ETH</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-blue-500/10 p-2">
              <Tag className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="text-xl font-bold">456</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-purple-500/10 p-2">
              <Gavel className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Live Auctions</p>
              <p className="text-xl font-bold">23</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search video NFTs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <div className="flex rounded-md border">
            <button
              className={`px-3 py-2 text-sm ${filterType === 'all' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-2 text-sm ${filterType === 'fixed_price' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setFilterType('fixed_price')}
            >
              Buy Now
            </button>
            <button
              className={`px-3 py-2 text-sm ${filterType === 'auction' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setFilterType('auction')}
            >
              Auctions
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="recent">Recently Listed</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="ending_soon">Ending Soon</option>
            <option value="most_viewed">Most Viewed</option>
          </select>

          {/* View Toggle */}
          <div className="flex rounded-md border">
            <button
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Tag className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No listings found</h2>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'space-y-4'
        }>
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ListingCardProps {
  listing: typeof MOCK_LISTINGS[0];
  viewMode: ViewMode;
}

function ListingCard({ listing, viewMode }: ListingCardProps) {
  const isAuction = listing.listingType === 'auction';

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative aspect-video w-48 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            <img
              src={listing.thumbnail}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white">
              {listing.duration}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
              <Play className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <Link to={ROUTES.nft(listing.id)} className="font-semibold hover:underline">
                {listing.title}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{listing.seller.name}</span>
                {listing.seller.verified && <Verified className="h-3 w-3 text-blue-500" />}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {listing.stats.views}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" /> {listing.stats.likes}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {isAuction ? (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current Bid</p>
                    <p className="font-bold">{listing.highestBid} {listing.currency}</p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-bold">{listing.price} {listing.currency}</p>
                  </div>
                )}
                <Link to={ROUTES.nft(listing.id)}>
                  <Button size="sm">
                    {isAuction ? 'Place Bid' : 'Buy Now'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        <img
          src={listing.thumbnail}
          alt={listing.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs text-white">
          {listing.duration}
        </div>

        {/* Type Badge */}
        <div className="absolute left-2 top-2">
          <Badge variant={isAuction ? 'default' : 'secondary'}>
            {isAuction ? (
              <>
                <Gavel className="mr-1 h-3 w-3" />
                Auction
              </>
            ) : (
              <>
                <Tag className="mr-1 h-3 w-3" />
                Buy Now
              </>
            )}
          </Badge>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Link to={ROUTES.nft(listing.id)}>
            <Button size="sm" variant="secondary">
              <Eye className="mr-1 h-4 w-4" />
              View Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <Link to={ROUTES.nft(listing.id)} className="font-medium hover:underline line-clamp-1">
          {listing.title}
        </Link>

        {/* Seller */}
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{listing.seller.name}</span>
          {listing.seller.verified && <Verified className="h-3 w-3 text-blue-500" />}
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          {isAuction ? (
            <div>
              <p className="text-xs text-muted-foreground">Current Bid</p>
              <p className="font-bold">{listing.highestBid || listing.price} {listing.currency}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {listing.bidCount} bids
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-bold">{listing.price} {listing.currency}</p>
              {listing.stats.offers > 0 && (
                <p className="text-xs text-muted-foreground">
                  {listing.stats.offers} offers
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button className="rounded-full p-2 hover:bg-accent">
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Auction Timer */}
        {isAuction && listing.endTime && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-orange-500/10 px-3 py-2 text-sm text-orange-600">
            <Clock className="h-4 w-4" />
            <span>Ends in {formatRelativeTime(listing.endTime)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Marketplace;
