# VidChain.io Business Model

## Comprehensive Platform Architecture & Tokenomics

---

## Mission Statement

**"Bringing trust, transparency, and decentralization to video content through blockchain technology."**

---

## Vision

To be the leading decentralized platform for video authenticity, ownership, and monetization - enabling creators to mint, monetize, and transfer ownership of their videos as NFTs while earning ongoing rewards.

---

## Platform Overview

VidChain is a crypto-native NFT video marketplace where:

1. **Creators upload videos** by paying with cryptocurrency (BTC, ETH, or platform tokens)
2. **Videos are minted as NFTs** with immutable creator metadata stored on-chain
3. **Owners can list for sale** at fixed prices or enable offers/bidding
4. **Ownership transfers** to buyers while original creator metadata remains permanent
5. **Platform tokens reward** users for maintaining content on the platform
6. **Media organizations** can license user-enabled shared videos via subscription

---

## Dual-Coin Tokenomics

### 1. VCT - VidChain Trading Coin (ERC-20)

**Purpose:** Investment, staking, liquidity, and governance

| Parameter | Value |
|-----------|-------|
| Total Supply | 1,000,000,000 VCT |
| Initial Price | $0.01 per token |
| Standard | ERC-20 |
| Network | Polygon (L2) |

**Token Allocation:**
- **40% (400M)** - Presale rounds
- **30% (300M)** - Ecosystem rewards & staking
- **15% (150M)** - Team & advisors (4-year vesting)
- **10% (100M)** - Liquidity & reserves
- **5% (50M)** - Marketing & partnerships

**Presale Rounds:**
| Round | Price | Tokens | Raise Target |
|-------|-------|--------|--------------|
| Round 1 | $0.005 | 150M | $750,000 |
| Round 2 | $0.0075 | 150M | $1,125,000 |
| Round 3 | $0.01 | 100M | $1,000,000 |
| **Total** | - | **400M** | **$2.875M** |

**Utility:**
- Staking for rewards and governance weight
- Trading on DEX/CEX
- Liquidity provision
- DAO governance voting
- Premium feature discounts

---

### 2. VIDC - VidChain Platform Coin (ERC-20)

**Purpose:** Platform utility, uploads, fees, and royalty payments

| Parameter | Value |
|-----------|-------|
| Supply Model | Dynamic (mint & burn) |
| Initial Supply | 10,000,000 VIDC |
| Standard | ERC-20 |
| Network | Polygon (L2) |

**Earning VIDC:**
- Maintaining video ownership on platform (daily rewards)
- Staking VCT tokens
- Community contributions (moderation, curation)
- Referral rewards
- Selling videos on marketplace

**Spending VIDC:**
- Video uploads (1 VIDC per 10 MB)
- Premium features (faster verification, HD uploads)
- Marketplace listing fees
- Domain registration (.vid, .vc)

**Burn Mechanics:**
- 50% of upload fees burned
- 25% of marketplace fees burned
- Creates deflationary pressure as platform grows

---

## Revenue Model

### 1. Upload Fees (Crypto Payments)

Users pay to upload videos covering:
- **Storage costs** (IPFS/Arweave)
- **Platform fees**
- **Blockchain gas**

**Pricing Structure:**
| Payment Method | Rate |
|---------------|------|
| VIDC | 1 VIDC per 10 MB |
| ETH | Dynamic (market rate) |
| BTC | Dynamic (via bridge) |
| MATIC | Dynamic (market rate) |

**Initial Limits:**
- Maximum video length: 3-5 minutes (Phase 1)
- Maximum file size: 500 MB
- Scales as platform grows

---

### 2. NFT Marketplace Fees

**Initial Sale (Creator sells first time):**
| Recipient | Percentage |
|-----------|------------|
| Creator | 95-98% |
| VidChain Platform | 2-5% |

**Secondary Sales (Resales):**
| Recipient | Percentage |
|-----------|------------|
| Seller | 88-93% |
| Original Creator (Royalty) | 5-10% |
| VidChain Platform | 1-2% |

---

### 3. Premium Features (VIDC/VCT)

| Feature | Price |
|---------|-------|
| Faster verification | 5 VIDC |
| 4K resolution uploads | 10 VIDC |
| Enhanced metadata tagging | 3 VIDC |
| Featured listing (24h) | 20 VIDC |
| Verified creator badge | 100 VCT stake |

---

### 4. Domain Registration

| Domain | Annual Price |
|--------|-------------|
| .vid | 50 VIDC or 0.01 ETH |
| .vc | 100 VIDC or 0.02 ETH |

**Benefits:**
- Custom video URLs (creator.vid/myvideo)
- Professional branding
- Transferable as NFT

---

### 5. Enterprise/Media Licensing (Subscription)

For news organizations, media companies, and enterprises:

| Tier | Monthly Price | Features |
|------|--------------|----------|
| Basic | $199/mo | 50 licensed videos/mo, API access |
| Professional | $499/mo | 500 licensed videos/mo, priority support |
| Enterprise | $999/mo | Unlimited, dedicated account, custom API |

**Licensing Model:**
- Creators opt-in videos for licensing
- Media orgs pay subscription for access
- Revenue shared: 70% creator, 30% platform

---

## NFT Video Architecture

### On-Chain Metadata (Immutable)

```solidity
struct VideoNFT {
    bytes32 sha256Hash;       // Video content hash
    bytes32 ipfsCidHash;      // IPFS storage hash
    address originalCreator;  // NEVER changes
    uint64 createdAt;         // Original upload timestamp
    uint32 version;           // Schema version
}
```

### Off-Chain Metadata (IPFS)

```json
{
  "name": "Video Title",
  "description": "Video description",
  "image": "ipfs://thumbnail-cid",
  "animation_url": "ipfs://video-cid",
  "attributes": [
    { "trait_type": "Duration", "value": "3:45" },
    { "trait_type": "Resolution", "value": "1080p" },
    { "trait_type": "Original Creator", "value": "0x..." },
    { "trait_type": "Upload Date", "value": "2024-01-15" },
    { "trait_type": "Category", "value": "Documentary" }
  ],
  "licensing": {
    "commercial_use": true,
    "attribution_required": true,
    "modifications_allowed": false
  }
}
```

### Ownership Model

1. **Original Creator** - Stored on-chain, immutable, receives royalties forever
2. **Current Owner** - Can transfer, sell, or license the video
3. **Licensing Rights** - Defined in metadata, enforced by smart contract

---

## Marketplace Features

### 1. Fixed Price Listings

- Owner sets price in VIDC, ETH, or MATIC
- Instant purchase available
- Auto-transfer on payment

### 2. Offers/Bidding System

- Owner enables "Accept Offers" toggle
- Buyers submit offers with escrow
- Owner can accept, reject, or counter
- Offer expires after set duration

### 3. Auctions

- Timed auctions (24h, 48h, 7d)
- Reserve price optional
- Auto-settlement at auction end
- Bid increment requirements

### 4. External Marketplace Compatibility

- OpenSea compatible metadata
- Rarible integration
- LooksRare support
- Standard ERC-721 + ERC-2981 royalties

---

## VIDC Rewards System

### Daily Ownership Rewards

Users earn VIDC for maintaining videos on platform:

| Metric | Daily VIDC Reward |
|--------|-------------------|
| Per video owned (verified) | 0.1 VIDC |
| Per 1,000 views | 0.5 VIDC |
| Per successful verification | 1 VIDC |
| Engagement bonus (likes/shares) | 0.01 VIDC each |

### Staking Rewards (VCT)

| Stake Amount | APY | Additional Benefits |
|--------------|-----|---------------------|
| 1,000 VCT | 5% | Basic voting rights |
| 10,000 VCT | 8% | Premium features discount |
| 100,000 VCT | 12% | Governance proposals |
| 1,000,000 VCT | 15% | DAO council eligibility |

---

## Governance Model

### Weighted Voting

- 1 VCT staked = 1 base vote
- Reputation multiplier (0.5x - 2x)
- Tenure bonus (longer stake = higher weight)

### Governance Scope

- Platform fee adjustments
- Emission rate changes
- Feature prioritization
- Content policy updates
- Treasury allocation

### Decentralized Moderation

1. Community flags content
2. Moderator panel reviews (elected by VCT holders)
3. Community vote on contested decisions
4. Appeal process via DAO proposal

---

## Technical Architecture

### Smart Contracts (Polygon)

| Contract | Purpose |
|----------|---------|
| VCTToken.sol | Trading coin (ERC-20) |
| VIDCToken.sol | Platform coin (ERC-20, mint/burn) |
| VidChainNFT.sol | Video NFTs (ERC-721 + ERC-2981) |
| Marketplace.sol | Listings, sales, auctions, offers |
| Staking.sol | VCT staking and rewards |
| Governance.sol | DAO voting and proposals |
| Rewards.sol | VIDC distribution logic |

### Backend Infrastructure

- **Database:** PostgreSQL (Supabase)
- **Storage:** IPFS (Pinata) + Arweave (permanent)
- **Video Processing:** Mux + FFmpeg
- **API:** Supabase Edge Functions (Deno)
- **Blockchain:** Alchemy RPC (Polygon)

### Frontend Stack

- React 19 + TypeScript
- Vite build system
- RainbowKit + Wagmi (Web3)
- TailwindCSS

---

## Implementation Phases

### Phase 1: Foundation (Current)

- [x] Video upload and verification
- [x] SHA-256 hashing and IPFS storage
- [x] Basic NFT minting (VidChainNFT)
- [x] Wallet integration (RainbowKit)
- [ ] VCT Token contract
- [ ] VIDC Token contract
- [ ] Crypto upload payments

### Phase 2: Marketplace Launch

- [ ] NFT Marketplace contract
- [ ] Fixed price listings
- [ ] Offers/bidding system
- [ ] Secondary sale royalties
- [ ] Marketplace frontend

### Phase 3: Tokenomics

- [ ] VCT presale mechanism
- [ ] Staking rewards system
- [ ] VIDC rewards distribution
- [ ] Token burning mechanics

### Phase 4: Governance & Scale

- [ ] DAO governance contracts
- [ ] Voting system
- [ ] Decentralized moderation
- [ ] Domain registration (.vid, .vc)
- [ ] Enterprise licensing tier

### Phase 5: Ecosystem

- [ ] External marketplace integration
- [ ] Multi-chain expansion (Ethereum L1, Arbitrum)
- [ ] Mobile apps
- [ ] Creator analytics dashboard

---

## Success Metrics

| Metric | Phase 1 Target | Phase 4 Target |
|--------|----------------|----------------|
| Videos uploaded | 1,000 | 100,000 |
| NFTs minted | 500 | 50,000 |
| Monthly active users | 500 | 25,000 |
| Marketplace volume | $10,000 | $1,000,000 |
| VCT holders | 1,000 | 50,000 |
| VIDC circulation | 100,000 | 10,000,000 |

---

## Risk Mitigation

### Technical Risks
- Smart contract audits before mainnet
- Bug bounty program
- Gradual rollout with testnets

### Market Risks
- Diversified revenue streams
- Token vesting schedules
- Treasury reserves

### Regulatory Risks
- Legal consultation on tokenomics
- KYC for large transactions
- Compliance-first approach

---

## Competitive Advantages

1. **Video-First NFT Platform** - Purpose-built for video, not adapted from images
2. **Dual-Token Model** - Separates investment from utility
3. **Immutable Creator Credit** - Original creator always visible
4. **Low Barrier Entry** - Accept BTC/ETH for easy onboarding
5. **Ownership Rewards** - Earn by holding, not just selling
6. **Media Licensing** - B2B revenue stream

---

## Contact & Resources

- **Website:** vidchain.io
- **Documentation:** docs.vidchain.io
- **GitHub:** github.com/vidchain
- **Discord:** discord.gg/vidchain
- **Twitter:** @VidChainIO

---

*Last Updated: December 2024*
*Version: 2.0*
