-- Content Moderation Schema for VidChain
-- Handles AI detection, content safety, and community moderation

-- ============================================
-- CONTENT MODERATION SCORES
-- ============================================
-- Stores automated analysis results for each video

CREATE TABLE IF NOT EXISTS content_moderation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

  -- AI Generation Detection
  ai_detection_score DECIMAL(5,2) CHECK (ai_detection_score >= 0 AND ai_detection_score <= 100),
  ai_detection_model VARCHAR(50),
  ai_detection_confidence DECIMAL(5,2),
  ai_detection_details JSONB DEFAULT '{}',

  -- Content Safety Scores (0-100, higher = more problematic)
  violence_score DECIMAL(5,2) CHECK (violence_score >= 0 AND violence_score <= 100),
  hate_speech_score DECIMAL(5,2) CHECK (hate_speech_score >= 0 AND hate_speech_score <= 100),
  nsfw_score DECIMAL(5,2) CHECK (nsfw_score >= 0 AND nsfw_score <= 100),
  harassment_score DECIMAL(5,2) CHECK (harassment_score >= 0 AND harassment_score <= 100),
  misinformation_score DECIMAL(5,2) CHECK (misinformation_score >= 0 AND misinformation_score <= 100),

  -- Critical Content Flags
  illegal_content_flags JSONB DEFAULT '[]',
  csam_hash_match BOOLEAN DEFAULT false,
  terrorism_hash_match BOOLEAN DEFAULT false,
  ncii_hash_match BOOLEAN DEFAULT false,

  -- Automated Decision
  auto_decision VARCHAR(20) CHECK (auto_decision IN ('approved', 'flagged', 'rejected', 'escalated')),
  auto_decision_reason TEXT,

  -- Human Review
  human_review_required BOOLEAN DEFAULT false,
  human_review_priority VARCHAR(20) CHECK (human_review_priority IN ('critical', 'high', 'medium', 'low')),
  human_review_completed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_decision VARCHAR(20) CHECK (review_decision IN ('approved', 'removed', 'labeled', 'suspended')),
  review_notes TEXT,

  -- Metadata
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  scan_duration_ms INTEGER,
  models_version VARCHAR(20),
  raw_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(video_id)
);

-- ============================================
-- COMMUNITY AUTHENTICITY VOTES
-- ============================================
-- Users can vote on whether content is AI-generated

CREATE TABLE IF NOT EXISTS authenticity_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  vote VARCHAR(20) NOT NULL CHECK (vote IN ('authentic', 'ai_generated', 'uncertain', 'deepfake')),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 5),
  reasoning TEXT,

  -- Vote weighting based on user reputation
  vote_weight DECIMAL(4,2) DEFAULT 1.00,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(video_id, user_id)
);

-- ============================================
-- CONTENT REPORTS
-- ============================================
-- User-submitted reports for content violations

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL, -- Can reference videos, listings, etc.
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'listing', 'comment', 'user')),

  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_accuracy DECIMAL(5,2) DEFAULT 50.00, -- Historical accuracy %

  category VARCHAR(30) NOT NULL CHECK (category IN (
    'csam', 'terrorism', 'ncii', 'violence', 'hate_speech',
    'harassment', 'misinformation', 'copyright', 'ai_deepfake',
    'spam', 'scam', 'illegal', 'other'
  )),
  subcategory VARCHAR(50),
  description TEXT,
  evidence_urls JSONB DEFAULT '[]',

  -- Priority calculation
  priority VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  report_count INTEGER DEFAULT 1, -- Aggregated count of same-content reports

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,

  -- Resolution
  resolution VARCHAR(30) CHECK (resolution IN (
    'content_removed', 'user_warned', 'user_suspended', 'user_banned',
    'labeled', 'dismissed_valid', 'dismissed_abuse', 'escalated'
  )),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER STRIKES
-- ============================================
-- Track policy violations and penalties

CREATE TABLE IF NOT EXISTS user_strikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  strike_number INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'csam', 'terrorism', 'ncii', 'violence', 'hate_speech',
    'harassment', 'misinformation', 'copyright', 'ai_misuse',
    'spam', 'scam', 'illegal', 'tos_violation'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),

  content_id UUID,
  content_type VARCHAR(20),
  report_id UUID REFERENCES content_reports(id),

  -- Penalty applied
  penalty VARCHAR(30) CHECK (penalty IN (
    'warning', 'content_removed', 'posting_restricted',
    'suspended_24h', 'suspended_7d', 'suspended_30d',
    'marketplace_ban', 'permanent_ban'
  )),
  penalty_expires_at TIMESTAMPTZ,

  -- Administration
  issued_by UUID REFERENCES users(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  -- Appeals
  appealed BOOLEAN DEFAULT false,
  appeal_submitted_at TIMESTAMPTZ,
  appeal_reason TEXT,
  appeal_reviewed_by UUID REFERENCES users(id),
  appeal_reviewed_at TIMESTAMPTZ,
  appeal_result VARCHAR(20) CHECK (appeal_result IN ('pending', 'upheld', 'reversed', 'reduced')),
  appeal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT LABELS
-- ============================================
-- Labels applied to content (AI-generated, sensitive, etc.)

CREATE TABLE IF NOT EXISTS content_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

  label_type VARCHAR(50) NOT NULL CHECK (label_type IN (
    'ai_generated', 'likely_ai', 'deepfake', 'synthetic_voice',
    'graphic_violence', 'sensitive_content', 'mature_content',
    'educational', 'news', 'satire', 'unverified',
    'disputed', 'manipulated', 'out_of_context'
  )),
  label_source VARCHAR(20) NOT NULL CHECK (label_source IN ('auto', 'moderator', 'creator', 'community')),
  confidence DECIMAL(5,2),

  display_warning BOOLEAN DEFAULT true,
  blocks_marketplace BOOLEAN DEFAULT false,
  requires_age_gate BOOLEAN DEFAULT false,

  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES users(id),
  notes TEXT,

  UNIQUE(video_id, label_type)
);

-- ============================================
-- HASH DATABASES (for matching known bad content)
-- ============================================
-- Store hashes of known prohibited content

CREATE TABLE IF NOT EXISTS content_hashes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hash_type VARCHAR(20) NOT NULL CHECK (hash_type IN ('photodna', 'pdq', 'md5', 'sha256', 'perceptual')),
  hash_value TEXT NOT NULL,

  category VARCHAR(30) NOT NULL CHECK (category IN ('csam', 'terrorism', 'ncii', 'copyright', 'other')),
  source VARCHAR(50) NOT NULL, -- 'ncmec', 'gifct', 'internal', 'stopncii'

  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by VARCHAR(50),
  notes TEXT,

  UNIQUE(hash_type, hash_value)
);

-- ============================================
-- MODERATION ACTIONS LOG
-- ============================================
-- Audit trail of all moderation actions

CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  action_type VARCHAR(30) NOT NULL CHECK (action_type IN (
    'content_scanned', 'content_approved', 'content_flagged', 'content_removed',
    'label_applied', 'label_removed', 'user_warned', 'strike_issued',
    'user_suspended', 'user_banned', 'appeal_submitted', 'appeal_reviewed',
    'report_assigned', 'report_resolved', 'hash_added', 'escalated'
  )),

  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('video', 'listing', 'user', 'report', 'comment')),
  target_id UUID NOT NULL,

  performed_by UUID REFERENCES users(id), -- NULL for automated actions
  performed_by_system BOOLEAN DEFAULT false,

  details JSONB DEFAULT '{}',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOTER REPUTATION
-- ============================================
-- Track accuracy of community voters for weighting

CREATE TABLE IF NOT EXISTS voter_reputation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  total_votes INTEGER DEFAULT 0,
  accurate_votes INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 50.00,

  -- Calculated weight for future votes (1.0 - 2.0)
  vote_weight DECIMAL(4,2) DEFAULT 1.00,

  -- Trust level
  trust_level VARCHAR(20) DEFAULT 'new' CHECK (trust_level IN ('new', 'learning', 'trusted', 'expert')),

  last_vote_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Content moderation
CREATE INDEX idx_moderation_video ON content_moderation(video_id);
CREATE INDEX idx_moderation_review_pending ON content_moderation(human_review_required, human_review_completed)
  WHERE human_review_required = true AND human_review_completed = false;
CREATE INDEX idx_moderation_ai_score ON content_moderation(ai_detection_score);
CREATE INDEX idx_moderation_critical ON content_moderation(csam_hash_match, terrorism_hash_match)
  WHERE csam_hash_match = true OR terrorism_hash_match = true;

-- Authenticity votes
CREATE INDEX idx_votes_video ON authenticity_votes(video_id);
CREATE INDEX idx_votes_user ON authenticity_votes(user_id);

-- Content reports
CREATE INDEX idx_reports_status ON content_reports(status, priority);
CREATE INDEX idx_reports_content ON content_reports(content_id, content_type);
CREATE INDEX idx_reports_category ON content_reports(category);
CREATE INDEX idx_reports_assigned ON content_reports(assigned_to) WHERE status = 'under_review';

-- User strikes
CREATE INDEX idx_strikes_user ON user_strikes(user_id, issued_at);
CREATE INDEX idx_strikes_active ON user_strikes(user_id, penalty_expires_at)
  WHERE penalty_expires_at > NOW() OR penalty_expires_at IS NULL;

-- Content labels
CREATE INDEX idx_labels_video ON content_labels(video_id);
CREATE INDEX idx_labels_type ON content_labels(label_type);

-- Hashes
CREATE INDEX idx_hashes_lookup ON content_hashes(hash_type, hash_value);
CREATE INDEX idx_hashes_category ON content_hashes(category);

-- Moderation actions
CREATE INDEX idx_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX idx_actions_time ON moderation_actions(created_at);
CREATE INDEX idx_actions_performer ON moderation_actions(performed_by);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Calculate vote weight based on voter reputation
CREATE OR REPLACE FUNCTION calculate_vote_weight(voter_user_id UUID)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  base_weight DECIMAL(4,2) := 1.00;
  reputation_weight DECIMAL(4,2);
  account_age_days INTEGER;
  is_verified BOOLEAN;
BEGIN
  -- Get voter reputation weight
  SELECT COALESCE(vote_weight, 1.00) INTO reputation_weight
  FROM voter_reputation WHERE user_id = voter_user_id;

  -- Get user details
  SELECT
    EXTRACT(DAY FROM NOW() - created_at)::INTEGER,
    verified
  INTO account_age_days, is_verified
  FROM users WHERE id = voter_user_id;

  -- Account age bonus (up to 0.2)
  IF account_age_days > 365 THEN
    base_weight := base_weight + 0.20;
  ELSIF account_age_days > 180 THEN
    base_weight := base_weight + 0.15;
  ELSIF account_age_days > 90 THEN
    base_weight := base_weight + 0.10;
  ELSIF account_age_days > 30 THEN
    base_weight := base_weight + 0.05;
  END IF;

  -- Verified bonus
  IF is_verified THEN
    base_weight := base_weight + 0.30;
  END IF;

  -- Combine with reputation weight (max 2.5)
  RETURN LEAST(base_weight * COALESCE(reputation_weight, 1.00), 2.50);
END;
$$ LANGUAGE plpgsql;

-- Aggregate authenticity votes for a video
CREATE OR REPLACE FUNCTION get_authenticity_consensus(target_video_id UUID)
RETURNS TABLE (
  total_votes INTEGER,
  weighted_authentic DECIMAL,
  weighted_ai DECIMAL,
  weighted_uncertain DECIMAL,
  consensus VARCHAR(20),
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH vote_summary AS (
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN vote = 'authentic' THEN vote_weight ELSE 0 END) as auth_weight,
      SUM(CASE WHEN vote IN ('ai_generated', 'deepfake') THEN vote_weight ELSE 0 END) as ai_weight,
      SUM(CASE WHEN vote = 'uncertain' THEN vote_weight ELSE 0 END) as unc_weight,
      SUM(vote_weight) as total_weight
    FROM authenticity_votes
    WHERE video_id = target_video_id
  )
  SELECT
    vs.total::INTEGER,
    ROUND((vs.auth_weight / NULLIF(vs.total_weight, 0) * 100)::DECIMAL, 2),
    ROUND((vs.ai_weight / NULLIF(vs.total_weight, 0) * 100)::DECIMAL, 2),
    ROUND((vs.unc_weight / NULLIF(vs.total_weight, 0) * 100)::DECIMAL, 2),
    CASE
      WHEN vs.auth_weight / NULLIF(vs.total_weight, 0) >= 0.7 THEN 'authentic'::VARCHAR
      WHEN vs.ai_weight / NULLIF(vs.total_weight, 0) >= 0.7 THEN 'ai_generated'::VARCHAR
      WHEN vs.unc_weight / NULLIF(vs.total_weight, 0) >= 0.5 THEN 'uncertain'::VARCHAR
      ELSE 'disputed'::VARCHAR
    END,
    ROUND(GREATEST(
      vs.auth_weight / NULLIF(vs.total_weight, 0),
      vs.ai_weight / NULLIF(vs.total_weight, 0)
    ) * 100, 2)
  FROM vote_summary vs;
END;
$$ LANGUAGE plpgsql;

-- Calculate report priority
CREATE OR REPLACE FUNCTION calculate_report_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Critical categories are always high priority
  IF NEW.category IN ('csam', 'terrorism', 'ncii') THEN
    NEW.priority := 'critical';
  ELSIF NEW.category IN ('violence', 'hate_speech', 'illegal') THEN
    NEW.priority := 'high';
  ELSIF NEW.category IN ('harassment', 'copyright', 'ai_deepfake') THEN
    NEW.priority := 'medium';
  ELSE
    NEW.priority := 'low';
  END IF;

  -- Boost priority based on reporter accuracy
  IF NEW.reporter_accuracy > 80 THEN
    NEW.priority := CASE NEW.priority
      WHEN 'low' THEN 'medium'
      WHEN 'medium' THEN 'high'
      ELSE NEW.priority
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_report_priority
  BEFORE INSERT ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION calculate_report_priority();

-- Count user strikes
CREATE OR REPLACE FUNCTION get_active_strike_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_strikes
    WHERE user_id = target_user_id
      AND (penalty_expires_at IS NULL OR penalty_expires_at > NOW())
      AND (appeal_result IS NULL OR appeal_result = 'upheld')
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE authenticity_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_reputation ENABLE ROW LEVEL SECURITY;

-- Content moderation - admins only
CREATE POLICY moderation_admin_all ON content_moderation
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can see moderation status for their own videos
CREATE POLICY moderation_owner_read ON content_moderation
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM videos WHERE id = video_id AND user_id = auth.uid())
  );

-- Authenticity votes - users can manage their own votes
CREATE POLICY votes_user_own ON authenticity_votes
  FOR ALL USING (user_id = auth.uid());

-- Anyone can read vote aggregates (handled via function)
CREATE POLICY votes_read_all ON authenticity_votes
  FOR SELECT USING (true);

-- Content reports - users can create reports
CREATE POLICY reports_create ON content_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Users can see their own reports
CREATE POLICY reports_own_read ON content_reports
  FOR SELECT USING (reporter_id = auth.uid());

-- Admins can manage all reports
CREATE POLICY reports_admin_all ON content_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- User strikes - users can see their own
CREATE POLICY strikes_own_read ON user_strikes
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage strikes
CREATE POLICY strikes_admin_all ON user_strikes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Content labels - public read
CREATE POLICY labels_read_all ON content_labels
  FOR SELECT USING (true);

-- Admins and moderators can manage labels
CREATE POLICY labels_admin_manage ON content_labels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Moderation actions - admins only
CREATE POLICY actions_admin_all ON moderation_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Voter reputation - users can see their own
CREATE POLICY reputation_own_read ON voter_reputation
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- ADD MODERATION FIELDS TO VIDEOS TABLE
-- ============================================

ALTER TABLE videos ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20)
  DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'removed', 'under_review'));

ALTER TABLE videos ADD COLUMN IF NOT EXISTS ai_generated_disclosure BOOLEAN DEFAULT false;

ALTER TABLE videos ADD COLUMN IF NOT EXISTS content_warning TEXT;

ALTER TABLE videos ADD COLUMN IF NOT EXISTS age_restricted BOOLEAN DEFAULT false;

-- ============================================
-- ADD MODERATION ROLE TO USERS
-- ============================================

-- Ensure role column can include moderator
DO $$
BEGIN
  -- Check if constraint exists and update it
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'creator', 'enterprise', 'moderator', 'admin'));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if constraint doesn't exist or other errors
END $$;
