# VidChain - Video Authenticity Verification Platform

VidChain is a video authenticity verification platform that uses blockchain technology (Polygon), IPFS storage (Pinata), and C2PA standards to provide tamper-proof verification for video content.

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)              │
│   Video upload, Mux player integration, verification display   │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                     BACKEND (Supabase)                         │
│   PostgreSQL database, Auth, Edge Functions, Storage           │
└────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  VIDEO PROCESS   │  │   IPFS STORAGE   │  │    BLOCKCHAIN    │
│  Mux API         │  │  Pinata          │  │  Polygon PoS     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Self-hosted Supabase on Coolify
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage + Pinata IPFS
- **Blockchain**: Polygon PoS (Mumbai testnet / Mainnet)
- **Video Processing**: Mux
- **Edge Functions**: Deno (Supabase Edge Functions)

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Coolify instance (for self-hosted Supabase)

### Environment Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables in `.env`

### Development

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Start the backend services:
   ```bash
   docker-compose up -d
   ```

### Production Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy with Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

## Project Structure

```
vidchain/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Base UI components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── video/       # Video-specific components
│   │   │   └── verification/ # Verification components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   ├── lib/             # Utility functions
│   │   └── config/          # Configuration
│   ├── Dockerfile
│   └── nginx.conf
├── supabase/
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge functions
│   │   ├── process-verification/
│   │   ├── mint-nft/
│   │   └── verify/
│   └── config.toml
├── docker-compose.yml
├── .env.example
└── PRD.md
```

## Features

### MVP Features
- Video upload with validation (MP4, MOV, WebM)
- SHA-256 hash computation
- IPFS storage via Pinata
- NFT minting on Polygon blockchain
- Public verification page
- User authentication
- Dashboard with video management

### Planned Features
- C2PA manifest signing
- Perceptual hashing for similarity detection
- Batch upload
- Organization accounts
- API for third-party integrations
- Embed widget for news sites

## API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Sign in
- `POST /auth/logout` - Sign out

### Videos
- `GET /videos` - List user's videos
- `POST /videos/upload` - Upload a video
- `GET /videos/:id` - Get video details
- `DELETE /videos/:id` - Delete a video

### Verifications
- `GET /verifications` - List verifications
- `POST /verifications` - Create verification
- `GET /verify` - Public verification lookup

### Edge Functions
- `POST /functions/v1/process-verification` - Process video for verification
- `POST /functions/v1/mint-nft` - Mint verification NFT
- `POST /functions/v1/verify` - Public verification endpoint

## Smart Contract

The VidChainNFT contract is deployed on Polygon and implements:
- ERC-721 for NFT standard
- EIP-2981 for royalties
- Custom `VideoRecord` struct for storing video hashes
- `mintAuthenticated()` for minting verification NFTs
- `verify()` and `verifyByHash()` for on-chain verification

## License

Proprietary - All rights reserved
