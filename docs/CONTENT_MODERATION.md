# VidChain Content Moderation System

## Overview

VidChain implements a multi-layered content moderation system to ensure platform integrity and user safety. This document outlines our approach to:

1. **AI-Generated Video Detection** - Identifying synthetic/deepfake content
2. **Prohibited Content Detection** - Illegal acts, hate speech, violence

---

## 1. AI-Generated Video Detection

### Detection Layers

#### Layer 1: Automated Upload Screening
- **AI Detection Models**: Integration with detection APIs (Hive Moderation, Sensity, Microsoft Video Authenticator)
- **Frame Analysis**: Sample frames analyzed for synthetic artifacts
- **Audio Analysis**: Voice cloning detection, lip-sync analysis
- **Metadata Examination**: EXIF data, creation tool signatures, compression patterns

#### Layer 2: Community Verification
- **Voting System**: Verified users can vote on content authenticity
- **Weighted Votes**: Higher weight for:
  - Verified creators (1.5x)
  - Long-standing accounts (1.2x)
  - Users with high accuracy history (up to 2x)
- **Threshold Triggers**:
  - 5+ votes → Content flagged for review
  - 70%+ "AI-generated" votes → Automatic labeling
  - 90%+ votes → Escalation to human review

#### Layer 3: Expert Review
- Trained moderators for edge cases
- Third-party forensic analysis for high-stakes content
- Creator appeals process

### AI Content Classification

| Classification | Label | NFT Eligibility | Marketplace |
|---------------|-------|-----------------|-------------|
| **Verified Authentic** | ✓ Verified | Full eligibility | Standard listing |
| **Likely Authentic** | No label | Full eligibility | Standard listing |
| **Uncertain** | "Unverified" | Requires disclosure | Warning shown |
| **AI-Detected** | "AI-Generated" | Allowed with label | Must disclose |
| **Deepfake/Misleading** | "Synthetic - May Mislead" | Restricted | Requires approval |

### AI Content Policy

```
ALLOWED (with disclosure):
- AI-generated art and creative content
- Clearly labeled synthetic media
- Educational demonstrations
- Satire (when obvious)

PROHIBITED:
- Deepfakes of real people without consent
- AI content presented as authentic
- Synthetic media for fraud/deception
- AI-generated CSAM (zero tolerance)
```

### Detection Confidence Scoring

```
Score Range    | Action
---------------|------------------------------------------
0-20%          | Likely authentic, no action
21-50%         | Flag for review, allow listing
51-75%         | Require disclosure before listing
76-90%         | Mandatory AI label
91-100%        | Block pending human review
```

---

## 2. Illegal Content & Hate/Violence Detection

### Zero-Tolerance Categories (Immediate Removal)

1. **Child Sexual Abuse Material (CSAM)**
   - PhotoDNA/hash matching integration
   - Mandatory NCMEC reporting
   - Immediate account termination
   - Law enforcement notification

2. **Terrorism & Violent Extremism**
   - GIFCT hash database integration
   - Immediate removal
   - Account suspension pending review
   - Potential law enforcement referral

3. **Non-Consensual Intimate Images (NCII)**
   - Hash matching for known NCII
   - Victim reporting priority queue
   - Swift removal (target: <1 hour)

### High-Priority Categories (Rapid Review)

1. **Graphic Violence**
   - Automated gore/violence detection
   - Context evaluation (news vs. gratuitous)
   - Age-gating for legitimate content
   - Removal for glorification of violence

2. **Hate Speech**
   - ML-based hate speech detection
   - Slur and symbol recognition
   - Context analysis (reporting vs. promoting)
   - Graduated response based on severity

3. **Illegal Activities**
   - Drug trafficking content
   - Weapons sales
   - Human trafficking
   - Fraud/scam promotion

### Detection Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    UPLOAD PIPELINE                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Hash    │──▶│  Frame   │──▶│  Audio   │──▶│  AI/ML   │ │
│  │ Matching │   │ Analysis │   │ Analysis │   │ Classify │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│       │              │              │              │        │
│       ▼              ▼              ▼              ▼        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              CONTENT SCORING ENGINE                      ││
│  │  • Violence Score (0-100)                                ││
│  │  • Hate Speech Score (0-100)                             ││
│  │  • NSFW Score (0-100)                                    ││
│  │  • AI Generation Score (0-100)                           ││
│  │  • Illegal Content Flags                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              ROUTING DECISION                            ││
│  │  • Auto-approve (low scores)                             ││
│  │  • Human review queue                                    ││
│  │  • Auto-reject (critical violations)                     ││
│  │  • Law enforcement escalation                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Severity Levels & Response

| Level | Description | Response Time | Action |
|-------|-------------|---------------|--------|
| **CRITICAL** | CSAM, terrorism | Immediate | Auto-remove, report authorities, terminate account |
| **HIGH** | NCII, credible threats | <1 hour | Remove, suspend account, review |
| **MEDIUM** | Hate speech, graphic violence | <4 hours | Review, potential removal, warning |
| **LOW** | Borderline content | <24 hours | Review, label, or approve |

### Community Reporting System

#### Report Categories
1. Illegal content
2. Violence/Gore
3. Hate speech/Discrimination
4. Harassment/Bullying
5. Misinformation
6. Copyright violation
7. AI-generated/Deepfake
8. Spam/Scam
9. Other

#### Report Prioritization
- Multiple reports = higher priority
- Verified user reports = priority boost
- Category-based urgency (illegal > hate > spam)
- Reporter accuracy history weighting

### User Penalties (Strike System)

```
Strike 1: Warning + content removal
Strike 2: 24-hour posting restriction + content removal
Strike 3: 7-day suspension + content removal
Strike 4: 30-day suspension + marketplace ban
Strike 5: Permanent ban + NFT sale freeze

INSTANT BAN (no strikes):
- CSAM
- Terrorism content
- Credible death threats
- Repeated ban evasion
```

### Appeals Process

1. **User submits appeal** with explanation
2. **Different moderator reviews** (not original decision-maker)
3. **Decision within 48 hours** (72h for complex cases)
4. **Final appeal** to senior moderation team
5. **External review** available for verified creators

---

## 3. Technical Implementation

### Database Schema Additions

```sql
-- Content moderation scores
CREATE TABLE content_moderation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,

  -- AI Detection
  ai_detection_score DECIMAL(5,2),
  ai_detection_model VARCHAR(50),
  ai_detection_confidence DECIMAL(5,2),

  -- Content Scores
  violence_score DECIMAL(5,2),
  hate_speech_score DECIMAL(5,2),
  nsfw_score DECIMAL(5,2),
  illegal_content_flags JSONB DEFAULT '[]',

  -- Review Status
  auto_decision VARCHAR(20), -- 'approved', 'flagged', 'rejected'
  human_review_required BOOLEAN DEFAULT false,
  human_review_completed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_decision VARCHAR(20),
  review_notes TEXT,

  -- Metadata
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  models_version VARCHAR(20),

  UNIQUE(video_id)
);

-- Community votes on authenticity
CREATE TABLE authenticity_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote VARCHAR(20) NOT NULL, -- 'authentic', 'ai_generated', 'uncertain'
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  reasoning TEXT,
  vote_weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(video_id, user_id)
);

-- User moderation strikes
CREATE TABLE user_strikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strike_number INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL,
  content_id UUID,
  issued_by UUID REFERENCES users(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  appealed BOOLEAN DEFAULT false,
  appeal_result VARCHAR(20), -- 'upheld', 'reversed', 'reduced'
  notes TEXT
);

-- Content labels
CREATE TABLE content_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  label_type VARCHAR(50) NOT NULL, -- 'ai_generated', 'graphic', 'sensitive', etc.
  label_source VARCHAR(20) NOT NULL, -- 'auto', 'moderator', 'creator', 'community'
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES users(id),

  UNIQUE(video_id, label_type)
);

-- Indexes
CREATE INDEX idx_moderation_review_required ON content_moderation(human_review_required) WHERE human_review_required = true;
CREATE INDEX idx_moderation_ai_score ON content_moderation(ai_detection_score);
CREATE INDEX idx_user_strikes ON user_strikes(user_id, issued_at);
CREATE INDEX idx_content_labels ON content_labels(video_id);
```

### Moderation API Endpoints

```
POST /api/moderation/scan
  - Trigger content scan for video
  - Returns initial scores

POST /api/moderation/vote
  - Submit authenticity vote
  - Body: { videoId, vote, confidence, reasoning }

POST /api/moderation/report
  - Submit content report
  - Body: { contentId, contentType, category, description }

GET /api/moderation/queue
  - Get moderation queue (admin only)
  - Filters: priority, category, status

POST /api/moderation/review
  - Submit moderation decision (admin only)
  - Body: { contentId, decision, notes, labels }

POST /api/moderation/appeal
  - Submit appeal for removed content
  - Body: { contentId, explanation }
```

---

## 4. External Service Integrations

### AI Detection Services
- **Hive Moderation**: General content moderation
- **Sensity AI**: Deepfake detection specialty
- **Reality Defender**: Real-time deepfake detection
- **Microsoft Video Authenticator**: Authenticity verification

### Hash Databases
- **PhotoDNA**: CSAM detection (Microsoft)
- **GIFCT Hash Sharing**: Terrorism content
- **StopNCII.org**: Non-consensual intimate images

### Reporting Obligations
- **NCMEC CyberTipline**: CSAM reporting (US legal requirement)
- **Internet Watch Foundation**: UK reporting
- **Local law enforcement**: As required by jurisdiction

---

## 5. Transparency & User Communication

### Public Transparency Report (Quarterly)
- Total content reviewed
- Content removed by category
- Appeals and outcomes
- AI detection statistics
- Average review times

### User Notifications
- Content removal: Explain reason, appeal options
- Strike issued: Clear explanation, consequences
- Appeal result: Detailed reasoning
- Label applied: Why and what it means

### Creator Resources
- Content policy guidelines
- AI disclosure best practices
- Appeal process documentation
- Avoiding false positives

---

## 6. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- Database schema implementation
- Basic reporting system
- Manual review queue
- Strike system

### Phase 2: Automated Detection (Weeks 3-4)
- Integrate AI detection APIs
- Implement scoring pipeline
- Auto-routing based on scores
- Basic hash matching

### Phase 3: Community Features (Weeks 5-6)
- Authenticity voting system
- Weighted vote calculation
- Community report prioritization
- Voter reputation system

### Phase 4: Advanced Detection (Weeks 7-8)
- CSAM hash database integration
- Terrorism hash database integration
- Real-time deepfake detection
- Multi-modal analysis

### Phase 5: Optimization (Ongoing)
- Model accuracy improvements
- False positive reduction
- Appeal process refinement
- Transparency reporting
