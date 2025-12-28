-- VidChain Marketplace Database Schema
-- Migration for NFT marketplace, crypto payments, and tokenomics

-- ============ ENUMS ============

-- Listing types
CREATE TYPE listing_type AS ENUM ('fixed_price', 'auction');

-- Listing status
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled', 'expired');

-- Offer status
CREATE TYPE offer_status AS ENUM ('active', 'accepted', 'rejected', 'cancelled', 'expired');

-- Transaction type
CREATE TYPE transaction_type AS ENUM (
    'upload_fee',
    'listing_created',
    'listing_sold',
    'offer_made',
    'offer_accepted',
    'bid_placed',
    'bid_refunded',
    'royalty_paid',
    'platform_fee',
    'reward_earned',
    'reward_claimed',
    'staking_deposit',
    'staking_withdraw',
    'staking_reward'
);

-- Payment currency
CREATE TYPE payment_currency AS ENUM ('ETH', 'MATIC', 'VIDC', 'VCT', 'USDC');

-- ============ WALLET BALANCES ============

-- Track user token balances (for display, actual balances on-chain)
CREATE TABLE wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    currency payment_currency NOT NULL,
    balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    pending_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(wallet_address, currency)
);

-- ============ NFT OWNERSHIP ============

-- Track video NFT ownership with creator info
CREATE TABLE video_nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    token_id INTEGER NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 137,

    -- Immutable creator info
    original_creator_id UUID NOT NULL REFERENCES users(id),
    original_creator_address VARCHAR(42) NOT NULL,
    created_at_block BIGINT,

    -- Current owner (updates on transfer)
    current_owner_id UUID REFERENCES users(id),
    current_owner_address VARCHAR(42) NOT NULL,

    -- Metadata
    sha256_hash VARCHAR(64) NOT NULL,
    ipfs_cid VARCHAR(100) NOT NULL,
    metadata_uri TEXT,

    -- Royalty settings
    royalty_bps INTEGER NOT NULL DEFAULT 500,
    royalty_receiver_address VARCHAR(42),

    -- Licensing
    commercial_use BOOLEAN NOT NULL DEFAULT FALSE,
    attribution_required BOOLEAN NOT NULL DEFAULT TRUE,
    modifications_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    media_licensing_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Stats
    total_sales INTEGER NOT NULL DEFAULT 0,
    total_volume DECIMAL(36, 18) NOT NULL DEFAULT 0,
    last_sale_price DECIMAL(36, 18),
    last_sale_currency payment_currency,
    last_sale_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(contract_address, token_id)
);

-- ============ MARKETPLACE LISTINGS ============

CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_id UUID NOT NULL REFERENCES video_nfts(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id),
    seller_address VARCHAR(42) NOT NULL,

    -- Listing details
    listing_type listing_type NOT NULL,
    status listing_status NOT NULL DEFAULT 'active',

    -- Pricing
    payment_currency payment_currency NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    reserve_price DECIMAL(36, 18),
    min_bid_increment_bps INTEGER DEFAULT 500,

    -- Timing
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,

    -- Options
    accepts_offers BOOLEAN NOT NULL DEFAULT TRUE,

    -- On-chain reference
    chain_listing_id INTEGER,
    transaction_hash VARCHAR(66),

    -- Stats
    view_count INTEGER NOT NULL DEFAULT 0,
    offer_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ AUCTION BIDS ============

CREATE TABLE auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES users(id),
    bidder_address VARCHAR(42) NOT NULL,

    -- Bid details
    amount DECIMAL(36, 18) NOT NULL,
    currency payment_currency NOT NULL,

    -- Status
    is_highest BOOLEAN NOT NULL DEFAULT FALSE,
    is_refunded BOOLEAN NOT NULL DEFAULT FALSE,
    refund_tx_hash VARCHAR(66),

    -- On-chain reference
    transaction_hash VARCHAR(66),
    block_number BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ OFFERS ============

CREATE TABLE marketplace_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_id UUID NOT NULL REFERENCES video_nfts(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL,

    -- Offer parties
    buyer_id UUID NOT NULL REFERENCES users(id),
    buyer_address VARCHAR(42) NOT NULL,
    seller_id UUID REFERENCES users(id),
    seller_address VARCHAR(42),

    -- Offer details
    amount DECIMAL(36, 18) NOT NULL,
    currency payment_currency NOT NULL,
    status offer_status NOT NULL DEFAULT 'active',

    -- Timing
    expires_at TIMESTAMPTZ NOT NULL,

    -- On-chain reference
    chain_offer_id INTEGER,
    transaction_hash VARCHAR(66),

    -- Response
    response_tx_hash VARCHAR(66),
    responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ SALES/TRANSACTIONS ============

CREATE TABLE marketplace_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES marketplace_listings(id),
    offer_id UUID REFERENCES marketplace_offers(id),
    nft_id UUID NOT NULL REFERENCES video_nfts(id),

    -- Parties
    seller_id UUID NOT NULL REFERENCES users(id),
    seller_address VARCHAR(42) NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id),
    buyer_address VARCHAR(42) NOT NULL,

    -- Sale details
    sale_price DECIMAL(36, 18) NOT NULL,
    currency payment_currency NOT NULL,

    -- Fee breakdown
    platform_fee DECIMAL(36, 18) NOT NULL,
    royalty_fee DECIMAL(36, 18) NOT NULL,
    royalty_receiver_address VARCHAR(42),
    seller_proceeds DECIMAL(36, 18) NOT NULL,

    -- On-chain reference
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ TRANSACTION HISTORY ============

CREATE TABLE crypto_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_address VARCHAR(42) NOT NULL,

    -- Transaction details
    transaction_type transaction_type NOT NULL,
    currency payment_currency NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,

    -- Related entities
    video_id UUID REFERENCES videos(id),
    nft_id UUID REFERENCES video_nfts(id),
    listing_id UUID REFERENCES marketplace_listings(id),
    sale_id UUID REFERENCES marketplace_sales(id),

    -- On-chain reference
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    chain_id INTEGER DEFAULT 137,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ UPLOAD PAYMENTS ============

CREATE TABLE upload_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    video_id UUID NOT NULL REFERENCES videos(id),

    -- Payment details
    file_size_mb INTEGER NOT NULL,
    fee_amount DECIMAL(36, 18) NOT NULL,
    currency payment_currency NOT NULL,

    -- Burn tracking (50% of VIDC fees burned)
    burn_amount DECIMAL(36, 18) DEFAULT 0,
    treasury_amount DECIMAL(36, 18) DEFAULT 0,

    -- On-chain reference
    transaction_hash VARCHAR(66),
    block_number BIGINT,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ REWARDS ============

CREATE TABLE ownership_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    nft_id UUID NOT NULL REFERENCES video_nfts(id),

    -- Reward details
    reward_date DATE NOT NULL,
    base_reward DECIMAL(36, 18) NOT NULL,
    view_bonus DECIMAL(36, 18) DEFAULT 0,
    engagement_bonus DECIMAL(36, 18) DEFAULT 0,
    total_reward DECIMAL(36, 18) NOT NULL,

    -- Status
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    claimed_at TIMESTAMPTZ,
    claim_tx_hash VARCHAR(66),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, nft_id, reward_date)
);

-- ============ STAKING ============

CREATE TABLE staking_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_address VARCHAR(42) NOT NULL,

    -- Staking details
    amount DECIMAL(36, 18) NOT NULL,
    currency payment_currency NOT NULL DEFAULT 'VCT',

    -- APY tier
    apy_bps INTEGER NOT NULL DEFAULT 500,

    -- Timing
    staked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unlock_at TIMESTAMPTZ,
    last_reward_at TIMESTAMPTZ,

    -- Rewards
    total_rewards_earned DECIMAL(36, 18) NOT NULL DEFAULT 0,
    pending_rewards DECIMAL(36, 18) NOT NULL DEFAULT 0,

    -- On-chain reference
    stake_tx_hash VARCHAR(66),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    unstaked_at TIMESTAMPTZ,
    unstake_tx_hash VARCHAR(66),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ MEDIA LICENSING ============

CREATE TABLE media_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    nft_id UUID NOT NULL REFERENCES video_nfts(id),

    -- License details
    license_type VARCHAR(50) NOT NULL DEFAULT 'standard',
    granted_by_user_id UUID NOT NULL REFERENCES users(id),

    -- Usage tracking
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Revenue share
    revenue_share_bps INTEGER NOT NULL DEFAULT 7000, -- 70% to creator
    total_payments DECIMAL(36, 18) NOT NULL DEFAULT 0,

    -- Validity
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(organization_id, nft_id)
);

-- ============ INDEXES ============

-- Wallet balances
CREATE INDEX idx_wallet_balances_user ON wallet_balances(user_id);
CREATE INDEX idx_wallet_balances_address ON wallet_balances(wallet_address);

-- Video NFTs
CREATE INDEX idx_video_nfts_video ON video_nfts(video_id);
CREATE INDEX idx_video_nfts_creator ON video_nfts(original_creator_id);
CREATE INDEX idx_video_nfts_owner ON video_nfts(current_owner_id);
CREATE INDEX idx_video_nfts_token ON video_nfts(contract_address, token_id);
CREATE INDEX idx_video_nfts_licensing ON video_nfts(media_licensing_enabled) WHERE media_licensing_enabled = TRUE;

-- Listings
CREATE INDEX idx_listings_nft ON marketplace_listings(nft_id);
CREATE INDEX idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_active ON marketplace_listings(status, end_time) WHERE status = 'active';
CREATE INDEX idx_listings_type ON marketplace_listings(listing_type);

-- Bids
CREATE INDEX idx_bids_listing ON auction_bids(listing_id);
CREATE INDEX idx_bids_bidder ON auction_bids(bidder_id);
CREATE INDEX idx_bids_highest ON auction_bids(listing_id, is_highest) WHERE is_highest = TRUE;

-- Offers
CREATE INDEX idx_offers_nft ON marketplace_offers(nft_id);
CREATE INDEX idx_offers_buyer ON marketplace_offers(buyer_id);
CREATE INDEX idx_offers_status ON marketplace_offers(status);
CREATE INDEX idx_offers_active ON marketplace_offers(status, expires_at) WHERE status = 'active';

-- Sales
CREATE INDEX idx_sales_nft ON marketplace_sales(nft_id);
CREATE INDEX idx_sales_seller ON marketplace_sales(seller_id);
CREATE INDEX idx_sales_buyer ON marketplace_sales(buyer_id);
CREATE INDEX idx_sales_created ON marketplace_sales(created_at DESC);

-- Transactions
CREATE INDEX idx_crypto_tx_user ON crypto_transactions(user_id);
CREATE INDEX idx_crypto_tx_type ON crypto_transactions(transaction_type);
CREATE INDEX idx_crypto_tx_created ON crypto_transactions(created_at DESC);
CREATE INDEX idx_crypto_tx_hash ON crypto_transactions(transaction_hash);

-- Upload payments
CREATE INDEX idx_upload_payments_user ON upload_payments(user_id);
CREATE INDEX idx_upload_payments_video ON upload_payments(video_id);

-- Rewards
CREATE INDEX idx_rewards_user ON ownership_rewards(user_id);
CREATE INDEX idx_rewards_nft ON ownership_rewards(nft_id);
CREATE INDEX idx_rewards_unclaimed ON ownership_rewards(user_id, is_claimed) WHERE is_claimed = FALSE;

-- Staking
CREATE INDEX idx_staking_user ON staking_positions(user_id);
CREATE INDEX idx_staking_active ON staking_positions(is_active) WHERE is_active = TRUE;

-- Media licenses
CREATE INDEX idx_licenses_org ON media_licenses(organization_id);
CREATE INDEX idx_licenses_nft ON media_licenses(nft_id);
CREATE INDEX idx_licenses_active ON media_licenses(is_active) WHERE is_active = TRUE;

-- ============ TRIGGERS ============

-- Apply updated_at triggers
CREATE TRIGGER update_wallet_balances_updated_at
    BEFORE UPDATE ON wallet_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_nfts_updated_at
    BEFORE UPDATE ON video_nfts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_listings_updated_at
    BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_offers_updated_at
    BEFORE UPDATE ON marketplace_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staking_positions_updated_at
    BEFORE UPDATE ON staking_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_licenses_updated_at
    BEFORE UPDATE ON media_licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============ RLS POLICIES ============

-- Enable RLS
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_licenses ENABLE ROW LEVEL SECURITY;

-- Wallet balances policies
CREATE POLICY "Users can view own balances"
    ON wallet_balances FOR SELECT
    USING (user_id = auth.uid());

-- Video NFTs policies (public read for marketplace)
CREATE POLICY "Anyone can view NFTs"
    ON video_nfts FOR SELECT
    USING (TRUE);

CREATE POLICY "Owners can update NFT settings"
    ON video_nfts FOR UPDATE
    USING (current_owner_id = auth.uid());

-- Listings policies (public read)
CREATE POLICY "Anyone can view active listings"
    ON marketplace_listings FOR SELECT
    USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers can manage own listings"
    ON marketplace_listings FOR ALL
    USING (seller_id = auth.uid());

-- Bids policies
CREATE POLICY "Anyone can view bids on active auctions"
    ON auction_bids FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can create bids"
    ON auction_bids FOR INSERT
    WITH CHECK (bidder_id = auth.uid());

-- Offers policies
CREATE POLICY "Users can view offers they made or received"
    ON marketplace_offers FOR SELECT
    USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create offers"
    ON marketplace_offers FOR INSERT
    WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update own offers"
    ON marketplace_offers FOR UPDATE
    USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Sales policies (public read for transparency)
CREATE POLICY "Anyone can view sales"
    ON marketplace_sales FOR SELECT
    USING (TRUE);

-- Transaction policies
CREATE POLICY "Users can view own transactions"
    ON crypto_transactions FOR SELECT
    USING (user_id = auth.uid());

-- Upload payment policies
CREATE POLICY "Users can view own upload payments"
    ON upload_payments FOR SELECT
    USING (user_id = auth.uid());

-- Rewards policies
CREATE POLICY "Users can view own rewards"
    ON ownership_rewards FOR SELECT
    USING (user_id = auth.uid());

-- Staking policies
CREATE POLICY "Users can view own staking positions"
    ON staking_positions FOR SELECT
    USING (user_id = auth.uid());

-- Media license policies
CREATE POLICY "Org members can view licenses"
    ON media_licenses FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        OR granted_by_user_id = auth.uid()
    );

-- ============ FUNCTIONS ============

-- Function to calculate upload fee
CREATE OR REPLACE FUNCTION calculate_upload_fee(file_size_mb INTEGER)
RETURNS DECIMAL(36, 18) AS $$
BEGIN
    -- 1 VIDC per 10 MB (rounded up)
    RETURN CEIL(file_size_mb::DECIMAL / 10);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get user's claimable rewards
CREATE OR REPLACE FUNCTION get_claimable_rewards(p_user_id UUID)
RETURNS DECIMAL(36, 18) AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(total_reward)
         FROM ownership_rewards
         WHERE user_id = p_user_id AND is_claimed = FALSE),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get marketplace stats
CREATE OR REPLACE FUNCTION get_marketplace_stats()
RETURNS TABLE (
    total_nfts BIGINT,
    total_listings BIGINT,
    active_listings BIGINT,
    total_volume DECIMAL(36, 18),
    total_sales BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM video_nfts),
        (SELECT COUNT(*) FROM marketplace_listings),
        (SELECT COUNT(*) FROM marketplace_listings WHERE status = 'active'),
        (SELECT COALESCE(SUM(sale_price), 0) FROM marketplace_sales),
        (SELECT COUNT(*) FROM marketplace_sales);
END;
$$ LANGUAGE plpgsql STABLE;
