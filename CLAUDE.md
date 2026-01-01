# CLAUDE.md - VidChain Development Guide

## Project Overview

VidChain is a **video authenticity verification platform** that uses blockchain technology (Polygon), IPFS storage (Pinata), and C2PA standards to provide tamper-proof verification for video content. The platform targets news organizations, content creators, and businesses who need to prove their videos haven't been manipulated.

## Quick Start

```bash
# Frontend development
cd frontend
npm install
npm run dev      # Start dev server at localhost:5173
npm run build    # Build for production
npm run test     # Run tests
npm run lint     # Run ESLint

# Backend (Supabase Edge Functions)
cd supabase/functions
supabase functions serve  # Local development
supabase functions deploy # Deploy to production
```

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + TypeScript)                 │
│   Video upload, Mux player, verification display, marketplace  │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                     BACKEND (Supabase)                          │
│   PostgreSQL database, Auth, Edge Functions, Storage            │
└────────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  VIDEO PROCESS   │  │   IPFS STORAGE   │  │    BLOCKCHAIN    │
│  Mux API         │  │  Pinata          │  │  Polygon PoS     │
│  FFmpeg          │  │  CID hashing     │  │  ERC-721 NFT     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite 7 |
| State Management | Zustand, TanStack Query |
| Web3 | wagmi, viem, RainbowKit |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Video Processing | Mux, FFmpeg |
| Storage | Supabase Storage, Pinata IPFS |
| Blockchain | Polygon PoS (ERC-721 NFTs) |

## Project Structure

```
vidchain/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Base UI components (Button, Card, Input, etc.)
│   │   │   ├── layout/      # Layout components (Header, Sidebar, Footer)
│   │   │   ├── video/       # Video player, thumbnail, overlay
│   │   │   ├── verification/ # Verification badge, certificate
│   │   │   ├── wallet/      # Wallet connection components
│   │   │   └── embed/       # Embeddable widget generator
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin panel pages
│   │   │   ├── marketplace/ # NFT marketplace pages
│   │   │   ├── dmca/        # DMCA submission pages
│   │   │   └── auth/        # Login, Signup pages
│   │   ├── hooks/           # Custom React hooks (useAuth, useVideos, useVerifications)
│   │   ├── stores/          # Zustand stores (authStore)
│   │   ├── types/           # TypeScript types
│   │   ├── lib/             # Utility functions and Supabase client
│   │   │   └── web3/        # Web3 configuration and hooks
│   │   └── config/          # App constants and configuration
│   └── package.json
├── supabase/
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge functions (22+ functions)
│   │   ├── ai-detection/    # AI/deepfake detection
│   │   ├── mint-nft/        # NFT minting
│   │   ├── verify/          # Video verification
│   │   ├── process-video/   # Video processing pipeline
│   │   └── ...
│   └── config.toml
├── services/
│   └── video-processor/     # FFmpeg-based video processing service
├── contracts/               # Solidity smart contracts (VidChainNFT)
├── mobile-sdk/              # Mobile SDK (planned)
├── docs/                    # Documentation
│   ├── BUSINESS_MODEL.md
│   ├── CONTENT_MODERATION.md
│   └── DMCA_POLICY.md
├── PRD.md                   # Product Requirements Document
├── ROADMAP.md               # Feature roadmap
└── docker-compose.yml       # Docker configuration
```

## Key Features (Implemented)

### Core Platform
- **Video Upload**: Multi-format support (MP4, MOV, WebM), progress tracking
- **SHA-256 Hashing**: Cryptographic fingerprint of video content
- **Blockchain Verification**: NFT minting on Polygon with ERC-721
- **IPFS Storage**: Decentralized storage via Pinata
- **User Authentication**: Supabase Auth with email/password
- **User Dashboard**: Video management, verification status

### Public Features
- **Verification Page**: Public lookup by token ID, hash, or transaction
- **Embeddable Badges**: HTML/SVG badges for websites
- **Pricing Page**: Tiered pricing display

### Admin Features
- **Admin Dashboard**: Overview, user management, content moderation
- **DMCA System**: Takedown request handling
- **Marketplace Management**: NFT listing oversight

### Marketplace
- **NFT Listings**: Browse and purchase verified videos
- **Wallet Integration**: RainbowKit with multiple wallet support
- **User Listings**: Manage personal NFT listings

## Current Implementation Status

### Fully Implemented
- [x] User authentication (login, signup, password reset)
- [x] Video upload with validation
- [x] SHA-256 hash computation
- [x] IPFS storage via Pinata
- [x] NFT minting flow
- [x] Basic verification page
- [x] User dashboard
- [x] Admin panel structure
- [x] DMCA submission flow
- [x] Mobile-responsive design
- [x] Security improvements (CORS, input validation)

### Partially Implemented
- [ ] AI Detection APIs (schema exists, mocked responses)
- [ ] Perceptual Hashing (schema exists, algorithm not implemented)
- [ ] Email Notifications (templates exist, no service integrated)
- [ ] Embeddable Badges (basic implementation only)

### Not Yet Implemented
- [ ] C2PA Integration (manifest reading/signing)
- [ ] Mobile SDK
- [ ] Frame-level Merkle Tree hashing
- [ ] Legal Evidence Package
- [ ] SSO/Enterprise features
- [ ] Photo verification support

## Database Schema (Key Tables)

```sql
-- Core tables
users, profiles, organizations, organization_members

-- Video/Verification
videos, verifications, video_metadata, video_hashes

-- Moderation
content_moderation, dmca_claims, dmca_counter_claims

-- Marketplace
marketplace_listings, marketplace_transactions

-- Analytics
verification_logs, api_keys, usage_metrics
```

## API Routes (Edge Functions)

| Endpoint | Purpose |
|----------|---------|
| `/functions/v1/process-video` | Video processing pipeline |
| `/functions/v1/mint-nft` | NFT minting on Polygon |
| `/functions/v1/verify` | Public verification lookup |
| `/functions/v1/ai-detection` | AI/deepfake detection (mocked) |
| `/functions/v1/generate-badge` | Badge SVG generation |

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Blockchain
VITE_POLYGON_RPC_URL=
VITE_CONTRACT_ADDRESS=
VITE_WALLETCONNECT_PROJECT_ID=

# Video Processing
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=

# Storage
PINATA_JWT=
PINATA_GATEWAY_URL=
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Use explicit types, avoid `any`
- Interface names: PascalCase
- Function/variable names: camelCase

### React
- Functional components with hooks
- Custom hooks in `/hooks` directory
- Co-locate component tests with components

### Styling
- Tailwind CSS utility classes
- `cn()` utility for conditional classes
- Mobile-first responsive design

### File Organization
- One component per file
- Index files for barrel exports
- Tests alongside source files (`.test.tsx`)

## Common Commands

```bash
# Development
npm run dev                  # Start dev server
npm run build               # Production build
npm run preview             # Preview production build

# Testing
npm run test                # Run tests in watch mode
npm run test:run            # Run tests once
npm run test:coverage       # Generate coverage report

# Code Quality
npm run lint                # ESLint check
```

## Performance Considerations

- Use `React.lazy()` for route-based code splitting
- TanStack Query for server state caching
- Optimistic updates for better UX
- Image optimization via Mux thumbnails

## Security Notes

- Row Level Security (RLS) on all Supabase tables
- Input validation on all forms
- CORS properly configured
- API keys stored in environment variables
- Wallet signatures verified on blockchain operations

## Recent Changes

- **Mobile Optimization**: Comprehensive responsive design across platform
- **Security Improvements**: CORS validation, secret management
- **Admin Panel**: Full admin dashboard with moderation tools
- **Marketplace**: NFT listing and purchasing functionality

## Priority Improvements (from ROADMAP)

1. **C2PA Integration** (CRITICAL) - Industry standard compliance
2. **AI Detection APIs** (CRITICAL) - Deepfake detection
3. **Perceptual Hashing** (HIGH) - Duplicate detection
4. **Email Notifications** (HIGH) - User engagement
5. **Enhanced Badges** (HIGH) - Viral distribution

## Resources

- [PRD.md](./PRD.md) - Full product requirements
- [ROADMAP.md](./ROADMAP.md) - Feature roadmap with technical specs
- [docs/](./docs/) - Business model, DMCA policy, moderation docs
