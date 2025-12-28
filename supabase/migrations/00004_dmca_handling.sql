-- DMCA Handling Schema for VidChain
-- Implements proper DMCA takedown and counter-notification workflow

-- ============================================
-- DMCA CLAIMS (Takedown Notices)
-- ============================================

CREATE TABLE IF NOT EXISTS dmca_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Claim identification
  claim_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., DMCA-2024-000001
  claim_type VARCHAR(20) NOT NULL DEFAULT 'takedown' CHECK (claim_type IN ('takedown', 'counter')),

  -- Target content
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'listing', 'nft')),
  content_url TEXT,
  content_title TEXT,
  content_owner_id UUID REFERENCES users(id),

  -- Claimant information
  claimant_name VARCHAR(255) NOT NULL,
  claimant_email VARCHAR(255) NOT NULL,
  claimant_phone VARCHAR(50),
  claimant_address TEXT NOT NULL,
  claimant_company VARCHAR(255),
  is_authorized_agent BOOLEAN DEFAULT false,
  rights_owner_name VARCHAR(255), -- If claimant is agent

  -- Copyrighted work description
  copyrighted_work_description TEXT NOT NULL,
  copyrighted_work_url TEXT, -- URL to original work if available
  copyright_registration_number VARCHAR(50), -- Optional but helpful

  -- Infringement details
  infringement_description TEXT NOT NULL,

  -- Required statements (checkboxes in form)
  good_faith_statement BOOLEAN NOT NULL DEFAULT false,
  accuracy_statement BOOLEAN NOT NULL DEFAULT false,
  authorization_statement BOOLEAN NOT NULL DEFAULT false,

  -- Signature
  signature_name VARCHAR(255) NOT NULL,
  signature_date DATE NOT NULL,
  electronic_signature BOOLEAN DEFAULT true,
  signature_ip_address INET,

  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Received, not yet reviewed
    'under_review',      -- Being reviewed by staff
    'valid',             -- Valid notice, processing
    'invalid',           -- Does not meet requirements
    'actioned',          -- Content removed/disabled
    'counter_received',  -- Counter-notification received
    'counter_pending',   -- Waiting for court action
    'restored',          -- Content restored after counter
    'court_action',      -- Court action filed
    'resolved',          -- Final resolution
    'withdrawn'          -- Claimant withdrew claim
  )),
  status_reason TEXT,

  -- Processing
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Related claims
  original_claim_id UUID REFERENCES dmca_claims(id), -- For counter-notifications
  counter_claim_id UUID REFERENCES dmca_claims(id),  -- Link to counter if filed

  -- Deadlines
  counter_deadline TIMESTAMPTZ, -- 10-14 days after counter received
  restoration_date TIMESTAMPTZ, -- When content can be restored

  -- Communication log
  communications JSONB DEFAULT '[]',

  -- Metadata
  submission_source VARCHAR(20) DEFAULT 'web' CHECK (submission_source IN ('web', 'email', 'mail', 'api')),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DMCA COUNTER-NOTIFICATIONS
-- ============================================
-- Stored as dmca_claims with claim_type = 'counter', but separate table for clarity

CREATE TABLE IF NOT EXISTS dmca_counter_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to original claim
  original_claim_id UUID NOT NULL REFERENCES dmca_claims(id),

  -- Counter-notifier information
  respondent_name VARCHAR(255) NOT NULL,
  respondent_email VARCHAR(255) NOT NULL,
  respondent_phone VARCHAR(50),
  respondent_address TEXT NOT NULL,

  -- Content identification
  removed_content_description TEXT NOT NULL,
  original_content_url TEXT,

  -- Counter-notification statements
  mistake_statement TEXT NOT NULL, -- Why removal was in error
  good_faith_statement BOOLEAN NOT NULL DEFAULT false,
  jurisdiction_consent BOOLEAN NOT NULL DEFAULT false,
  jurisdiction_district VARCHAR(100),
  service_consent BOOLEAN NOT NULL DEFAULT false,

  -- Signature
  signature_name VARCHAR(255) NOT NULL,
  signature_date DATE NOT NULL,
  electronic_signature BOOLEAN DEFAULT true,
  signature_ip_address INET,

  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Received, not yet reviewed
    'valid',             -- Valid counter-notification
    'invalid',           -- Does not meet requirements
    'forwarded',         -- Sent to original claimant
    'waiting',           -- Waiting period (10-14 days)
    'court_filed',       -- Claimant filed court action
    'restored',          -- Content restored
    'expired'            -- Waiting period expired, content restored
  )),

  -- Dates
  forwarded_to_claimant_at TIMESTAMPTZ,
  waiting_period_ends TIMESTAMPTZ,
  restored_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPEAT INFRINGER TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS dmca_strikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES dmca_claims(id),

  strike_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true, -- False if counter succeeded or expired

  -- Penalty applied
  penalty VARCHAR(30) CHECK (penalty IN (
    'warning',
    'upload_restriction_30d',
    'account_termination'
  )),
  penalty_applied_at TIMESTAMPTZ,
  penalty_expires_at TIMESTAMPTZ,

  -- Reversal
  reversed BOOLEAN DEFAULT false,
  reversed_reason VARCHAR(50) CHECK (reversed_reason IN (
    'counter_notification',
    'claim_withdrawn',
    'expiration',
    'admin_override'
  )),
  reversed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, claim_id)
);

-- ============================================
-- DMCA COMMUNICATIONS LOG
-- ============================================
-- Track all communications related to claims

CREATE TABLE IF NOT EXISTS dmca_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES dmca_claims(id) ON DELETE CASCADE,

  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  communication_type VARCHAR(30) NOT NULL CHECK (communication_type IN (
    'notice_received',
    'acknowledgment_sent',
    'takedown_notification',
    'counter_received',
    'counter_forwarded',
    'restoration_notice',
    'court_notice',
    'general_inquiry',
    'follow_up'
  )),

  recipient_email VARCHAR(255),
  sender_email VARCHAR(255),
  subject TEXT,
  body TEXT,
  attachments JSONB DEFAULT '[]',

  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  sent_by UUID REFERENCES users(id), -- Staff member if outbound
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT TAKEDOWN STATUS
-- ============================================
-- Track DMCA status on content

CREATE TABLE IF NOT EXISTS dmca_content_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'listing', 'nft')),

  current_claim_id UUID REFERENCES dmca_claims(id),
  status VARCHAR(30) NOT NULL DEFAULT 'none' CHECK (status IN (
    'none',              -- No DMCA action
    'taken_down',        -- Currently removed due to DMCA
    'counter_pending',   -- Counter filed, waiting
    'restored',          -- Restored after counter
    'permanently_removed' -- Court order or repeat infringement
  )),

  taken_down_at TIMESTAMPTZ,
  restored_at TIMESTAMPTZ,
  history JSONB DEFAULT '[]', -- Array of past claims

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_id, content_type)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_dmca_claims_status ON dmca_claims(status);
CREATE INDEX idx_dmca_claims_content ON dmca_claims(content_id, content_type);
CREATE INDEX idx_dmca_claims_claimant ON dmca_claims(claimant_email);
CREATE INDEX idx_dmca_claims_number ON dmca_claims(claim_number);
CREATE INDEX idx_dmca_claims_owner ON dmca_claims(content_owner_id);

CREATE INDEX idx_dmca_counter_original ON dmca_counter_notifications(original_claim_id);
CREATE INDEX idx_dmca_counter_status ON dmca_counter_notifications(status);

CREATE INDEX idx_dmca_strikes_user ON dmca_strikes(user_id, is_active);
CREATE INDEX idx_dmca_strikes_claim ON dmca_strikes(claim_id);

CREATE INDEX idx_dmca_comms_claim ON dmca_communications(claim_id);

CREATE INDEX idx_dmca_content_status ON dmca_content_status(content_id, content_type);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate DMCA claim number
CREATE OR REPLACE FUNCTION generate_dmca_claim_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  claim_num TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(claim_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM dmca_claims
  WHERE claim_number LIKE 'DMCA-' || year_part || '-%';

  claim_num := 'DMCA-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');

  RETURN claim_num;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate claim number on insert
CREATE OR REPLACE FUNCTION set_dmca_claim_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.claim_number IS NULL THEN
    NEW.claim_number := generate_dmca_claim_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_dmca_claim_number
  BEFORE INSERT ON dmca_claims
  FOR EACH ROW
  EXECUTE FUNCTION set_dmca_claim_number();

-- Get active strike count for user
CREATE OR REPLACE FUNCTION get_dmca_strike_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM dmca_strikes
    WHERE user_id = target_user_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Apply DMCA penalty based on strike count
CREATE OR REPLACE FUNCTION apply_dmca_penalty(target_user_id UUID, claim_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  strike_count INTEGER;
  new_strike_number INTEGER;
  penalty_type TEXT;
  penalty_expires TIMESTAMPTZ;
BEGIN
  -- Get current active strike count
  strike_count := get_dmca_strike_count(target_user_id);
  new_strike_number := strike_count + 1;

  -- Determine penalty
  CASE new_strike_number
    WHEN 1 THEN
      penalty_type := 'warning';
      penalty_expires := NULL;
    WHEN 2 THEN
      penalty_type := 'upload_restriction_30d';
      penalty_expires := NOW() + INTERVAL '30 days';
    ELSE
      penalty_type := 'account_termination';
      penalty_expires := NULL;
  END CASE;

  -- Insert strike record
  INSERT INTO dmca_strikes (
    user_id, claim_id, strike_number, penalty, penalty_applied_at, penalty_expires_at
  ) VALUES (
    target_user_id, claim_id_param, new_strike_number, penalty_type, NOW(), penalty_expires
  );

  -- Update user status if termination
  IF penalty_type = 'account_termination' THEN
    UPDATE users SET status = 'terminated', terminated_at = NOW(), termination_reason = 'dmca_repeat_infringer'
    WHERE id = target_user_id;
  END IF;

  RETURN penalty_type;
END;
$$ LANGUAGE plpgsql;

-- Reverse DMCA strike
CREATE OR REPLACE FUNCTION reverse_dmca_strike(strike_id_param UUID, reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dmca_strikes
  SET
    is_active = false,
    reversed = true,
    reversed_reason = reason,
    reversed_at = NOW(),
    updated_at = NOW()
  WHERE id = strike_id_param;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Calculate counter-notification deadline
CREATE OR REPLACE FUNCTION calculate_counter_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Counter-notification: 10-14 business days waiting period
  -- We use 14 calendar days to be safe
  NEW.waiting_period_ends := NEW.forwarded_to_claimant_at + INTERVAL '14 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_counter_deadline
  BEFORE UPDATE ON dmca_counter_notifications
  FOR EACH ROW
  WHEN (NEW.forwarded_to_claimant_at IS NOT NULL AND OLD.forwarded_to_claimant_at IS NULL)
  EXECUTE FUNCTION calculate_counter_deadline();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE dmca_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmca_counter_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmca_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmca_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmca_content_status ENABLE ROW LEVEL SECURITY;

-- Public can submit DMCA claims (insert only)
CREATE POLICY dmca_claims_submit ON dmca_claims
  FOR INSERT WITH CHECK (true);

-- Users can view claims against their content
CREATE POLICY dmca_claims_owner_view ON dmca_claims
  FOR SELECT USING (content_owner_id = auth.uid());

-- Admins have full access
CREATE POLICY dmca_claims_admin ON dmca_claims
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Content owners can submit counter-notifications
CREATE POLICY dmca_counter_submit ON dmca_counter_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM dmca_claims
      WHERE id = original_claim_id AND content_owner_id = auth.uid()
    )
  );

-- Users can view their counter-notifications
CREATE POLICY dmca_counter_owner_view ON dmca_counter_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dmca_claims
      WHERE id = original_claim_id AND content_owner_id = auth.uid()
    )
  );

-- Admins have full access to counter-notifications
CREATE POLICY dmca_counter_admin ON dmca_counter_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Users can view their own strikes
CREATE POLICY dmca_strikes_user_view ON dmca_strikes
  FOR SELECT USING (user_id = auth.uid());

-- Admins have full access to strikes
CREATE POLICY dmca_strikes_admin ON dmca_strikes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Communications visible to admins only
CREATE POLICY dmca_comms_admin ON dmca_communications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Content status visible to content owners
CREATE POLICY dmca_content_status_owner ON dmca_content_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM videos WHERE id = content_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM marketplace_listings WHERE id = content_id AND seller_id = auth.uid()
    )
  );

-- Admins have full access to content status
CREATE POLICY dmca_content_status_admin ON dmca_content_status
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- ============================================
-- EMAIL TEMPLATES (stored in database)
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key VARCHAR(50) UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- List of expected variables
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert DMCA email templates
INSERT INTO email_templates (template_key, subject, body_html, body_text, variables) VALUES
(
  'dmca_acknowledgment',
  'DMCA Notice Received - {{claim_number}}',
  '<h2>DMCA Notice Acknowledgment</h2><p>Dear {{claimant_name}},</p><p>We have received your DMCA takedown notice ({{claim_number}}) regarding the following content:</p><p><strong>{{content_title}}</strong></p><p>Your notice is being reviewed and we will take appropriate action in accordance with the DMCA.</p><p>You will receive a follow-up communication regarding the status of your claim.</p><p>Best regards,<br>VidChain Legal Team</p>',
  'DMCA Notice Acknowledgment\n\nDear {{claimant_name}},\n\nWe have received your DMCA takedown notice ({{claim_number}}) regarding the following content:\n\n{{content_title}}\n\nYour notice is being reviewed and we will take appropriate action in accordance with the DMCA.\n\nYou will receive a follow-up communication regarding the status of your claim.\n\nBest regards,\nVidChain Legal Team',
  '["claim_number", "claimant_name", "content_title"]'
),
(
  'dmca_takedown_notification',
  'Content Removed Due to DMCA Claim - {{claim_number}}',
  '<h2>DMCA Takedown Notification</h2><p>Dear {{content_owner_name}},</p><p>We have received a DMCA takedown notice regarding your content:</p><p><strong>{{content_title}}</strong><br>URL: {{content_url}}</p><p>In accordance with the DMCA, we have removed access to this content. This is strike {{strike_number}} on your account.</p><h3>Your Options</h3><p>If you believe this takedown was in error, you may file a counter-notification. Please review our <a href="{{counter_url}}">counter-notification process</a>.</p><p><strong>Warning:</strong> Filing a false counter-notification may result in legal liability.</p><p>Best regards,<br>VidChain Legal Team</p>',
  'DMCA Takedown Notification\n\nDear {{content_owner_name}},\n\nWe have received a DMCA takedown notice regarding your content:\n\n{{content_title}}\nURL: {{content_url}}\n\nIn accordance with the DMCA, we have removed access to this content. This is strike {{strike_number}} on your account.\n\nYour Options:\nIf you believe this takedown was in error, you may file a counter-notification at: {{counter_url}}\n\nWarning: Filing a false counter-notification may result in legal liability.\n\nBest regards,\nVidChain Legal Team',
  '["claim_number", "content_owner_name", "content_title", "content_url", "strike_number", "counter_url"]'
),
(
  'dmca_counter_received',
  'Counter-Notification Received - {{claim_number}}',
  '<h2>Counter-Notification Acknowledgment</h2><p>Dear {{respondent_name}},</p><p>We have received your counter-notification for claim {{claim_number}}.</p><p>We will forward this to the original claimant. They have 10-14 business days to file a court action. If no court action is filed, your content may be restored after {{restoration_date}}.</p><p>Best regards,<br>VidChain Legal Team</p>',
  'Counter-Notification Acknowledgment\n\nDear {{respondent_name}},\n\nWe have received your counter-notification for claim {{claim_number}}.\n\nWe will forward this to the original claimant. They have 10-14 business days to file a court action. If no court action is filed, your content may be restored after {{restoration_date}}.\n\nBest regards,\nVidChain Legal Team',
  '["claim_number", "respondent_name", "restoration_date"]'
),
(
  'dmca_counter_forwarded',
  'Counter-Notification Filed - {{claim_number}}',
  '<h2>Counter-Notification Notice</h2><p>Dear {{claimant_name}},</p><p>The user whose content was removed in response to your DMCA notice ({{claim_number}}) has filed a counter-notification.</p><p>Under the DMCA, you have 10-14 business days to file a court action seeking to restrain the user from engaging in infringing activity. If you do not notify us of such action by {{deadline}}, we may restore access to the removed content.</p><p>Best regards,<br>VidChain Legal Team</p>',
  'Counter-Notification Notice\n\nDear {{claimant_name}},\n\nThe user whose content was removed in response to your DMCA notice ({{claim_number}}) has filed a counter-notification.\n\nUnder the DMCA, you have 10-14 business days to file a court action seeking to restrain the user from engaging in infringing activity. If you do not notify us of such action by {{deadline}}, we may restore access to the removed content.\n\nBest regards,\nVidChain Legal Team',
  '["claim_number", "claimant_name", "deadline"]'
),
(
  'dmca_content_restored',
  'Content Restored - {{claim_number}}',
  '<h2>Content Restoration Notice</h2><p>Dear {{content_owner_name}},</p><p>The waiting period for claim {{claim_number}} has expired without court action from the original claimant. Your content has been restored:</p><p><strong>{{content_title}}</strong></p><p>Your DMCA strike has been reversed.</p><p>Best regards,<br>VidChain Legal Team</p>',
  'Content Restoration Notice\n\nDear {{content_owner_name}},\n\nThe waiting period for claim {{claim_number}} has expired without court action from the original claimant. Your content has been restored:\n\n{{content_title}}\n\nYour DMCA strike has been reversed.\n\nBest regards,\nVidChain Legal Team',
  '["claim_number", "content_owner_name", "content_title"]'
)
ON CONFLICT (template_key) DO NOTHING;

-- ============================================
-- ADD DMCA FIELDS TO USERS TABLE
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS dmca_strikes_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dmca_last_strike_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dmca_restriction_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS termination_reason VARCHAR(50);
