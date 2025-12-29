# VidChain Platform Roadmap

## Vision Statement

**"Reliable and undisputed proof of media authenticity"**

VidChain aims to become the definitive standard for media verification, providing an unbroken chain of provenance from the moment of capture to legal admissibility in court.

---

## The Complete Verification Chain

```
📱 CAPTURE ──→ 🔐 SIGN ──→ ☁️ UPLOAD ──→ 🔍 ANALYZE ──→ ⛓️ IMMUTALIZE ──→ 🏷️ BADGE ──→ ⚖️ LEGAL
     │            │            │             │              │              │           │
   Mobile      C2PA at      Verify       AI Detection    Blockchain     Embeddable   Court-
   SDK with    capture      signature    Perceptual      + IPFS         verification admissible
   device      time         Extract      hash            storage        everywhere   evidence
   attestation              metadata     Duplicates
```

### Current Coverage
- ✅ UPLOAD (partial)
- ✅ ANALYZE (schema only, no AI APIs)
- ✅ IMMUTALIZE (blockchain + IPFS)
- ⚠️ BADGE (basic)
- ❌ CAPTURE (not implemented)
- ❌ SIGN (C2PA not implemented)
- ❌ LEGAL (not implemented)

---

## Phase 1: Foundation of Trust

### 1.1 C2PA Integration (Coalition for Content Provenance and Authenticity)

**Priority:** CRITICAL
**Status:** Not implemented
**Impact:** Industry standard compliance, enterprise adoption

#### What is C2PA?
C2PA is the open standard for content authenticity backed by Adobe, Microsoft, BBC, Sony, Canon, Nikon, and others. It provides cryptographically signed manifests embedded in media files that prove:
- Who created the content
- What device was used
- When it was captured
- What edits were made

#### Implementation Plan

**1.1.1 C2PA Manifest Reading & Validation**
```
Location: /supabase/functions/c2pa-validate/
Purpose: Validate incoming media for existing C2PA manifests
```

Features:
- Extract C2PA manifests from uploaded media
- Validate certificate chains
- Verify signature integrity
- Parse claim generators and assertions
- Store provenance data in database

**1.1.2 C2PA Manifest Signing**
```
Location: /supabase/functions/c2pa-sign/
Purpose: Sign verified content with VidChain's C2PA manifest
```

Features:
- Generate VidChain assertions (verified, blockchain hash, IPFS CID)
- Sign with VidChain certificate
- Embed manifest in output media
- Support for both hard binding (hash) and soft binding (thumbnail)

**1.1.3 Database Schema**
```sql
-- C2PA manifest storage
CREATE TABLE c2pa_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id),
  manifest_store JSONB NOT NULL,
  active_manifest TEXT,
  claim_generator TEXT,
  signature_valid BOOLEAN,
  certificate_chain JSONB,
  assertions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C2PA assertions parsed
CREATE TABLE c2pa_assertions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID REFERENCES c2pa_manifests(id),
  assertion_type TEXT NOT NULL,
  assertion_data JSONB NOT NULL,
  is_redacted BOOLEAN DEFAULT FALSE
);
```

**Dependencies:**
- c2pa-node (npm package) or c2pa-rs (Rust library via WASM)
- X.509 certificate for VidChain signing
- Hardware Security Module (HSM) for production key storage

---

### 1.2 AI Detection API Integration

**Priority:** CRITICAL
**Status:** Schema exists, APIs mocked
**Impact:** Deepfake detection, platform credibility

#### Current State
The `content_moderation` table exists with fields for:
- `ai_generated_score`
- `deepfake_detected`
- `manipulation_detected`

But the edge function returns mock data.

#### API Integrations

**1.2.1 Primary: Hive AI**
```
Endpoint: https://api.thehive.ai/api/v2/task/sync
Capabilities:
- AI-generated image/video detection
- Deepfake detection
- Visual moderation (NSFW, violence)
```

**1.2.2 Secondary: Sensity AI**
```
Endpoint: https://api.sensity.ai/v1/detect
Capabilities:
- Face-swap detection
- Lip-sync deepfake detection
- Synthetic voice detection
```

**1.2.3 Tertiary: Reality Defender**
```
Endpoint: https://api.realitydefender.com/v1/analyze
Capabilities:
- Real-time deepfake analysis
- GAN detection
- Diffusion model detection
```

#### Implementation
```typescript
// /supabase/functions/ai-detection/index.ts
interface AIDetectionResult {
  provider: string;
  ai_generated_score: number;      // 0-100
  deepfake_probability: number;    // 0-1
  manipulation_detected: boolean;
  synthetic_voice: boolean;
  face_swap_detected: boolean;
  confidence: number;
  model_signatures: string[];      // Detected AI models
  analysis_timestamp: string;
}

// Aggregate scores from multiple providers
interface AggregatedDetection {
  overall_authenticity_score: number;
  consensus: 'authentic' | 'suspicious' | 'synthetic';
  provider_results: AIDetectionResult[];
  recommendation: 'approve' | 'flag' | 'reject';
}
```

---

### 1.3 Perceptual Hashing Implementation

**Priority:** HIGH
**Status:** Database schema exists, algorithm not implemented
**Impact:** Duplicate detection, similarity search

#### Current State
- `perceptual_hash_index` table exists
- `find_similar_videos()` function exists
- No code computing the actual hashes

#### Hash Types to Implement

| Hash Type | Purpose | Algorithm |
|-----------|---------|-----------|
| pHash | Perceptual similarity | DCT-based frequency analysis |
| dHash | Difference hash | Gradient direction |
| aHash | Average hash | Mean luminance comparison |
| colorHash | Color distribution | Histogram comparison |

#### Implementation
```typescript
// /services/video-processor/src/hashing/perceptual.ts
import sharp from 'sharp';

interface PerceptualHashes {
  phash: string;      // 64-bit hex
  dhash: string;      // 64-bit hex
  ahash: string;      // 64-bit hex
  colorhash: string;  // 128-bit hex
}

async function computePerceptualHash(framePath: string): Promise<PerceptualHashes> {
  // 1. Resize to 32x32 for pHash, 9x8 for dHash
  // 2. Convert to grayscale
  // 3. Compute DCT for pHash
  // 4. Compare adjacent pixels for dHash
  // 5. Compare to mean for aHash
  // 6. Build histogram for colorHash
}

// Hamming distance for similarity
function hammingDistance(hash1: string, hash2: string): number {
  // XOR and count 1 bits
}
```

#### Frame Sampling Strategy
```
Video Duration | Sample Rate | Max Frames
< 30 seconds   | Every 1s    | 30
30s - 5 min    | Every 2s    | 150
5 - 30 min     | Every 5s    | 360
> 30 min       | Every 10s   | 500
```

---

### 1.4 Frame-Level Merkle Tree Hashing

**Priority:** HIGH
**Status:** Not implemented
**Impact:** Forensic-grade verification, tamper detection

#### Concept
Instead of one hash for the entire video, create a Merkle tree of frame hashes. This allows:
- Proving specific frames haven't been tampered with
- Identifying exactly which frames were modified
- Partial verification of large videos

#### Data Structure
```
                    Root Hash (stored on-chain)
                   /                            \
          Hash(0-499)                      Hash(500-999)
         /          \                      /           \
    Hash(0-249)  Hash(250-499)     Hash(500-749)  Hash(750-999)
       ...          ...               ...            ...
      /   \
   Frame0  Frame1
```

#### Database Schema
```sql
CREATE TABLE video_merkle_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) UNIQUE,
  root_hash TEXT NOT NULL,
  total_frames INTEGER NOT NULL,
  tree_depth INTEGER NOT NULL,
  frame_interval_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE merkle_tree_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES video_merkle_trees(id),
  node_index INTEGER NOT NULL,
  level INTEGER NOT NULL,
  hash TEXT NOT NULL,
  left_child_index INTEGER,
  right_child_index INTEGER,
  frame_number INTEGER, -- Only for leaf nodes
  UNIQUE(tree_id, node_index)
);

-- Efficient proof generation
CREATE INDEX idx_merkle_nodes_tree_level ON merkle_tree_nodes(tree_id, level);
```

#### Verification Proof
```typescript
interface MerkleProof {
  frameNumber: number;
  frameHash: string;
  proof: Array<{
    hash: string;
    position: 'left' | 'right';
  }>;
  rootHash: string;
}

// Verify a specific frame hasn't been tampered with
function verifyFrame(proof: MerkleProof): boolean {
  let currentHash = proof.frameHash;
  for (const sibling of proof.proof) {
    if (sibling.position === 'left') {
      currentHash = hash(sibling.hash + currentHash);
    } else {
      currentHash = hash(currentHash + sibling.hash);
    }
  }
  return currentHash === proof.rootHash;
}
```

---

## Phase 2: Core Experience

### 2.1 Mobile SDK for Capture-Time Verification

**Priority:** HIGH
**Status:** Not implemented
**Impact:** Unbroken provenance chain from capture

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VidChain Mobile SDK                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Capture    │  │   Signing    │  │   Upload     │       │
│  │   Module     │  │   Module     │  │   Module     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         ▼                 ▼                 ▼                │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Secure Enclave / TEE                 │       │
│  │  • Private key storage                            │       │
│  │  • Frame signing                                  │       │
│  │  • Device attestation                             │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### SDK Features

**iOS (Swift)**
```swift
import VidChainSDK

class VerifiedCaptureViewController: UIViewController {
  let vidchain = VidChainCapture(apiKey: "...")

  func startVerifiedRecording() {
    vidchain.startCapture(
      attestation: .deviceAttestation,  // Use Secure Enclave
      signing: .perFrame,                // Sign each frame
      metadata: [
        .timestamp,
        .location,
        .deviceInfo,
        .sensorData
      ]
    ) { result in
      switch result {
      case .success(let verifiedVideo):
        // Video with embedded C2PA manifest
        self.uploadToVidChain(verifiedVideo)
      case .failure(let error):
        print(error)
      }
    }
  }
}
```

**Android (Kotlin)**
```kotlin
import com.vidchain.sdk.VidChainCapture

class VerifiedCaptureActivity : AppCompatActivity() {
  private val vidchain = VidChainCapture(apiKey = "...")

  fun startVerifiedRecording() {
    vidchain.startCapture(
      attestation = DeviceAttestation.KEYSTORE,  // Android Keystore
      signing = SigningMode.PER_FRAME,
      metadata = setOf(
        CaptureMetadata.TIMESTAMP,
        CaptureMetadata.LOCATION,
        CaptureMetadata.DEVICE_INFO,
        CaptureMetadata.SENSOR_DATA
      )
    ).collect { result ->
      when (result) {
        is CaptureResult.Success -> uploadToVidChain(result.video)
        is CaptureResult.Error -> handleError(result.error)
      }
    }
  }
}
```

#### Device Attestation
- **iOS:** DeviceCheck + App Attest API
- **Android:** SafetyNet/Play Integrity API + Hardware Keystore

#### Metadata Captured at Recording
```json
{
  "device": {
    "manufacturer": "Apple",
    "model": "iPhone 15 Pro",
    "os_version": "iOS 17.2",
    "secure_enclave": true,
    "jailbreak_detected": false
  },
  "capture": {
    "start_time": "2024-01-15T10:30:00.000Z",
    "end_time": "2024-01-15T10:32:45.000Z",
    "timezone": "America/New_York",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy_meters": 5,
      "altitude_meters": 10
    }
  },
  "sensors": {
    "accelerometer": [...],
    "gyroscope": [...],
    "magnetometer": [...]
  },
  "attestation": {
    "type": "apple_app_attest",
    "assertion": "base64...",
    "key_id": "..."
  }
}
```

---

### 2.2 Email Notification System

**Priority:** HIGH
**Status:** Templates exist, no service integrated
**Impact:** User engagement, DMCA compliance

#### Email Templates (Already Exist)
- DMCA acknowledgment
- Takedown notice
- Counter-notification forwarded
- Content restoration

#### Additional Templates Needed
- Verification complete
- NFT minted successfully
- Duplicate content detected
- Account security alerts
- Weekly verification report

#### Implementation
```typescript
// /supabase/functions/send-email/index.ts
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface EmailPayload {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

type EmailTemplate =
  | 'verification_complete'
  | 'nft_minted'
  | 'dmca_notice'
  | 'dmca_counter'
  | 'duplicate_detected'
  | 'security_alert';

async function sendEmail(payload: EmailPayload) {
  const template = await loadTemplate(payload.template);
  const html = renderTemplate(template, payload.data);

  return resend.emails.send({
    from: 'VidChain <notifications@vidchain.io>',
    to: payload.to,
    subject: template.subject,
    html,
  });
}
```

#### Database Trigger
```sql
-- Trigger email on verification completion
CREATE OR REPLACE FUNCTION notify_verification_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM net.http_post(
      url := 'https://api.vidchain.io/functions/v1/send-email',
      body := jsonb_build_object(
        'to', (SELECT email FROM auth.users WHERE id = NEW.user_id),
        'template', 'verification_complete',
        'data', jsonb_build_object(
          'video_title', NEW.title,
          'verification_url', 'https://vidchain.io/verify/' || NEW.id
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 2.3 Invisible Watermarking System

**Priority:** MEDIUM
**Status:** Not implemented
**Impact:** Content tracking, unauthorized copy detection

#### Watermarking Techniques

| Technique | Robustness | Invisibility | Capacity |
|-----------|------------|--------------|----------|
| DCT Domain | High | High | Low |
| DWT Domain | Very High | High | Medium |
| SVD | High | Medium | Low |
| Spread Spectrum | Very High | High | Very Low |

#### Implementation Approach
```typescript
// /services/video-processor/src/watermarking/index.ts

interface WatermarkPayload {
  videoId: string;
  userId: string;
  timestamp: number;
  blockchainTxHash: string;
}

async function embedWatermark(
  inputPath: string,
  outputPath: string,
  payload: WatermarkPayload
): Promise<void> {
  // 1. Encode payload as binary
  const binaryPayload = encodePayload(payload);

  // 2. Extract frames
  const frames = await extractFrames(inputPath);

  // 3. Apply DWT watermarking to each I-frame
  for (const frame of frames) {
    if (frame.type === 'I') {
      await applyDWTWatermark(frame, binaryPayload);
    }
  }

  // 4. Reconstruct video
  await reconstructVideo(frames, outputPath);
}

async function extractWatermark(videoPath: string): Promise<WatermarkPayload | null> {
  // Reverse process to extract and decode payload
}
```

---

## Phase 3: Market Expansion

### 3.1 Photo Verification Support

**Priority:** HIGH
**Status:** Not implemented
**Impact:** Larger market, simpler onboarding

#### Why Photos Matter
- More prevalent than video
- Faster to verify
- Lower barrier to entry for new users
- Critical for journalism, insurance, real estate

#### Implementation

**Database Schema**
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  sha256_hash TEXT,
  status photo_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photo_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id),
  sha256_hash TEXT NOT NULL UNIQUE,
  ipfs_cid TEXT,
  token_id TEXT,
  transaction_hash TEXT,
  block_number BIGINT,
  blockchain_timestamp TIMESTAMPTZ,
  status verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) UNIQUE,
  -- EXIF data
  camera_make TEXT,
  camera_model TEXT,
  lens_model TEXT,
  focal_length TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso INTEGER,
  flash_used BOOLEAN,
  -- Capture data
  capture_timestamp TIMESTAMPTZ,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_altitude DECIMAL(10, 2),
  -- Software
  software TEXT,
  -- Raw EXIF
  raw_exif JSONB
);

CREATE TABLE photo_perceptual_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES photos(id) UNIQUE,
  phash TEXT,
  dhash TEXT,
  ahash TEXT,
  colorhash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Image Analysis**
```typescript
// /supabase/functions/analyze-photo/index.ts
interface PhotoAnalysis {
  // Authenticity
  manipulation_probability: number;
  ela_score: number;              // Error Level Analysis
  clone_detection: CloneRegion[];
  splicing_detection: SpliceRegion[];

  // AI Detection
  ai_generated_score: number;
  gan_signature: string | null;
  diffusion_signature: string | null;

  // Metadata
  exif: ExifData;
  c2pa_manifest: C2PAManifest | null;

  // Hashes
  sha256: string;
  perceptual_hashes: PerceptualHashes;
}
```

---

### 3.2 Embeddable Verification Badge System

**Priority:** HIGH
**Status:** Basic verification display exists
**Impact:** Viral distribution, brand awareness

#### Badge Types

**1. Dynamic HTML Badge**
```html
<!-- Embed code for websites -->
<div class="vidchain-badge" data-video-id="abc123">
  <script src="https://cdn.vidchain.io/badge.js"></script>
</div>
```

**2. Real-Time SVG Badge**
```
https://api.vidchain.io/badge/abc123.svg
https://api.vidchain.io/badge/abc123.svg?style=minimal
https://api.vidchain.io/badge/abc123.svg?style=detailed
```

**3. QR Code**
```
https://api.vidchain.io/qr/abc123.png?size=200
```

**4. JSON-LD for SEO**
```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Video Title",
  "contentUrl": "https://...",
  "vidchain:verification": {
    "@type": "vidchain:VerificationRecord",
    "verificationStatus": "verified",
    "blockchainHash": "0x...",
    "verificationDate": "2024-01-15",
    "verifyUrl": "https://vidchain.io/verify/abc123"
  }
}
```

#### Badge Implementation
```typescript
// /supabase/functions/badge/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const url = new URL(req.url);
  const videoId = url.pathname.split('/')[2].replace('.svg', '');
  const style = url.searchParams.get('style') || 'standard';

  // Fetch verification status
  const verification = await getVerification(videoId);

  // Generate SVG based on status
  const svg = generateBadgeSVG(verification, style);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',  // 1 minute cache
    },
  });
});

function generateBadgeSVG(verification: Verification, style: string): string {
  const colors = {
    verified: '#22c55e',
    pending: '#f59e0b',
    failed: '#ef4444',
  };

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="30">
      <rect width="150" height="30" rx="5" fill="${colors[verification.status]}"/>
      <text x="75" y="20" text-anchor="middle" fill="white" font-family="sans-serif" font-size="12">
        ✓ VidChain Verified
      </text>
    </svg>
  `;
}
```

#### Browser Extension
```typescript
// Extension that shows VidChain verification status on social media
// Detects verified content and shows badge overlay

interface ContentDetector {
  platform: 'twitter' | 'youtube' | 'instagram' | 'tiktok';
  detect(): Promise<DetectedContent[]>;
  showBadge(content: DetectedContent, verification: Verification): void;
}
```

---

### 3.3 Real-Time Verification API

**Priority:** HIGH
**Status:** Basic verify endpoint exists
**Impact:** Enterprise adoption, integrations

#### API Design
```yaml
openapi: 3.0.0
info:
  title: VidChain Verification API
  version: 2.0.0

paths:
  /v2/verify:
    post:
      summary: Verify media authenticity
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                url:
                  type: string
                  description: URL of media to verify
                file:
                  type: string
                  format: binary
                options:
                  type: object
                  properties:
                    check_c2pa:
                      type: boolean
                      default: true
                    check_ai:
                      type: boolean
                      default: true
                    check_duplicates:
                      type: boolean
                      default: true
                    check_manipulation:
                      type: boolean
                      default: true
      responses:
        200:
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VerificationResult'

components:
  schemas:
    VerificationResult:
      type: object
      properties:
        authenticity_score:
          type: integer
          minimum: 0
          maximum: 100
        verdict:
          type: string
          enum: [authentic, suspicious, synthetic, manipulated, unknown]
        confidence:
          type: number
        c2pa:
          $ref: '#/components/schemas/C2PAResult'
        ai_detection:
          $ref: '#/components/schemas/AIDetectionResult'
        duplicates:
          type: array
          items:
            $ref: '#/components/schemas/DuplicateMatch'
        provenance:
          $ref: '#/components/schemas/ProvenanceChain'
        blockchain:
          $ref: '#/components/schemas/BlockchainRecord'
```

#### Rate Limits by Tier
| Tier | Requests/min | Requests/day | Max File Size |
|------|--------------|--------------|---------------|
| Free | 5 | 50 | 100MB |
| Starter | 30 | 1,000 | 500MB |
| Professional | 100 | 10,000 | 2GB |
| Enterprise | 1,000 | Unlimited | 10GB |

---

## Phase 4: Revenue & Enterprise

### 4.1 Legal Evidence Package

**Priority:** MEDIUM
**Status:** Not implemented
**Impact:** Legal market, premium pricing

#### Components

**1. Court-Admissible Certificate**
```typescript
interface LegalCertificate {
  certificateId: string;
  generatedAt: Date;

  // Media identification
  mediaHash: string;
  mediaType: 'video' | 'photo';
  duration?: number;
  dimensions: { width: number; height: number };

  // Verification details
  verificationTimestamp: Date;
  blockchainNetwork: string;
  transactionHash: string;
  blockNumber: number;
  ipfsCid: string;

  // Provenance
  originalCreator: string;
  captureDevice?: string;
  captureLocation?: GeoLocation;
  captureTimestamp?: Date;

  // Chain of custody
  custodyChain: CustodyEvent[];

  // Attestations
  notarization?: NotarizationRecord;
  rfc3161Timestamp: RFC3161Timestamp;

  // Digital signature
  signature: string;
  signedBy: string;
  certificateAuthority: string;
}
```

**2. RFC 3161 Timestamping Authority**
```typescript
// Integration with trusted timestamping authorities
interface RFC3161Timestamp {
  timestamp: Date;
  tsa: string;  // Timestamp Authority
  serialNumber: string;
  hashAlgorithm: string;
  hashedMessage: string;
  signature: string;
  certificate: string;
}

async function getTimestamp(hash: string): Promise<RFC3161Timestamp> {
  // DigiCert, GlobalSign, or other TSA
  const response = await fetch('https://timestamp.digicert.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/timestamp-query',
    },
    body: createTimestampRequest(hash),
  });

  return parseTimestampResponse(await response.arrayBuffer());
}
```

**3. Expert Witness Network**
```sql
CREATE TABLE expert_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credentials TEXT[],
  specializations TEXT[],
  jurisdictions TEXT[],
  hourly_rate DECIMAL(10, 2),
  availability_status TEXT,
  contact_email TEXT,
  verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE expert_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verifications(id),
  expert_id UUID REFERENCES expert_witnesses(id),
  case_reference TEXT,
  engagement_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 4.2 Enterprise Features

**Priority:** MEDIUM
**Status:** Partially implemented
**Impact:** Revenue, large customers

#### Multi-Tenant Architecture
```sql
-- Already exists, enhance with:
ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN custom_branding JSONB;
ALTER TABLE organizations ADD COLUMN allowed_domains TEXT[];
ALTER TABLE organizations ADD COLUMN sso_config JSONB;
```

#### SSO Integration
```typescript
// SAML 2.0 / OIDC support for enterprise
interface SSOConfig {
  provider: 'saml' | 'oidc';
  entityId?: string;
  ssoUrl?: string;
  certificate?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcIssuer?: string;
}
```

#### Audit Logging
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
```

#### On-Premise Deployment
```yaml
# Enterprise self-hosted deployment
services:
  vidchain-api:
    image: vidchain/api:enterprise
    environment:
      - DATABASE_URL=postgres://...
      - IPFS_NODE=http://ipfs:5001
      - BLOCKCHAIN_RPC=http://ethereum:8545

  vidchain-worker:
    image: vidchain/worker:enterprise

  ipfs:
    image: ipfs/kubo:latest
    volumes:
      - ipfs_data:/data/ipfs
```

---

### 4.3 Insurance Integration

**Priority:** LOW
**Status:** Not implemented
**Impact:** New market vertical

#### Use Cases
- Property damage documentation
- Auto accident evidence
- Construction progress verification
- Art/collectibles authentication

#### API for Insurance Partners
```typescript
// /supabase/functions/insurance-api/index.ts
interface InsuranceVerification {
  claimId: string;
  policyNumber: string;

  media: {
    type: 'photo' | 'video';
    verificationId: string;
    captureTimestamp: Date;
    location: GeoLocation;
  }[];

  verification: {
    allMediaVerified: boolean;
    authenticity_score: number;
    tampering_detected: boolean;
    location_verified: boolean;
    timestamp_verified: boolean;
  };

  certificate: LegalCertificate;
}
```

---

## Technical Debt & Improvements

### Security Hardening
- [ ] Implement rate limiting on all edge functions
- [ ] Add API key rotation and expiration
- [ ] Encrypt PII at rest (beyond Supabase defaults)
- [ ] Add DDoS protection (Cloudflare)
- [ ] Implement GDPR data export/deletion
- [ ] Security audit of smart contracts

### Performance
- [ ] Implement Redis caching for verification lookups
- [ ] Add CDN for badge and certificate assets
- [ ] Optimize video processing pipeline
- [ ] Database query optimization and indexing
- [ ] Implement job queue monitoring

### Monitoring
- [ ] Integrate Sentry for error tracking
- [ ] Add Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Set up alerting (PagerDuty/Opsgenie)
- [ ] Implement distributed tracing

---

## Success Metrics

### Platform Health
| Metric | Target |
|--------|--------|
| Verification success rate | > 99.5% |
| Average verification time | < 30 seconds |
| API uptime | 99.9% |
| False positive rate (AI detection) | < 1% |

### Business
| Metric | Target |
|--------|--------|
| Monthly active verifications | 100K+ |
| Enterprise customers | 50+ |
| API integrations | 100+ |
| Revenue (ARR) | $1M+ |

### Trust
| Metric | Target |
|--------|--------|
| Media outlets using VidChain | 50+ |
| Legal cases supported | 100+ |
| Deepfakes detected | 1000+ |

---

## Timeline Overview

```
Phase 1 (Foundation)     Phase 2 (Experience)    Phase 3 (Expansion)     Phase 4 (Enterprise)
├── C2PA Integration     ├── Mobile SDK          ├── Photo Support       ├── Legal Evidence
├── AI Detection APIs    ├── Email System        ├── Badges              ├── Enterprise SSO
├── Perceptual Hashing   ├── Watermarking        ├── Real-time API       ├── Insurance API
└── Merkle Trees         └── UX Improvements     └── Browser Extension   └── On-Premise
```

---

## Appendix A: Third-Party Services

| Service | Purpose | Priority |
|---------|---------|----------|
| Hive AI | AI/deepfake detection | Critical |
| Sensity AI | Face-swap detection | High |
| Reality Defender | Real-time analysis | Medium |
| DigiCert TSA | RFC 3161 timestamps | High |
| Resend | Email notifications | High |
| Cloudflare | DDoS protection, CDN | High |
| Sentry | Error tracking | Medium |
| Pinata | IPFS pinning | Already integrated |
| Alchemy | Blockchain RPC | Already integrated |

## Appendix B: Compliance Standards

| Standard | Relevance | Status |
|----------|-----------|--------|
| C2PA | Content authenticity | Not implemented |
| RFC 3161 | Trusted timestamps | Not implemented |
| EIP-2981 | NFT royalties | Implemented |
| DMCA | Copyright compliance | Implemented |
| GDPR | Data privacy | Partial |
| SOC 2 | Enterprise security | Not started |

---

*This roadmap is a living document. Update as priorities shift and features are completed.*
