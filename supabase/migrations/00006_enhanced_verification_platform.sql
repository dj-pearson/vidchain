-- Migration: Enhanced Verification Platform
-- Adds C2PA integration, photo support, Merkle trees, legal evidence, badges, and more

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Media types
CREATE TYPE media_type AS ENUM ('video', 'photo', 'audio');

-- C2PA claim status
CREATE TYPE c2pa_status AS ENUM (
  'valid',
  'invalid',
  'no_manifest',
  'expired_certificate',
  'untrusted_signer',
  'tampered'
);

-- AI detection verdict
CREATE TYPE ai_verdict AS ENUM (
  'authentic',
  'likely_authentic',
  'uncertain',
  'likely_synthetic',
  'synthetic',
  'deepfake',
  'face_swap',
  'voice_clone'
);

-- Legal certificate status
CREATE TYPE certificate_status AS ENUM (
  'pending',
  'generated',
  'notarized',
  'expired',
  'revoked'
);

-- Badge style
CREATE TYPE badge_style AS ENUM (
  'minimal',
  'standard',
  'detailed',
  'compact',
  'full'
);

-- ============================================================================
-- C2PA INTEGRATION TABLES
-- ============================================================================

-- Store C2PA manifests from uploaded media
CREATE TABLE c2pa_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL,
  media_type media_type NOT NULL DEFAULT 'video',

  -- Manifest data
  manifest_store JSONB NOT NULL DEFAULT '{}',
  active_manifest_label TEXT,
  claim_generator TEXT,                         -- Software that created the manifest
  claim_generator_version TEXT,

  -- Signature validation
  signature_valid BOOLEAN DEFAULT FALSE,
  signature_algorithm TEXT,
  signing_time TIMESTAMPTZ,

  -- Certificate chain
  certificate_chain JSONB DEFAULT '[]',
  certificate_issuer TEXT,
  certificate_subject TEXT,
  certificate_valid_from TIMESTAMPTZ,
  certificate_valid_to TIMESTAMPTZ,
  certificate_trusted BOOLEAN DEFAULT FALSE,

  -- Validation status
  status c2pa_status DEFAULT 'no_manifest',
  validation_errors JSONB DEFAULT '[]',

  -- VidChain signing (when we sign content)
  vidchain_signed BOOLEAN DEFAULT FALSE,
  vidchain_manifest JSONB,
  vidchain_signed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C2PA assertions extracted from manifests
CREATE TABLE c2pa_assertions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES c2pa_manifests(id) ON DELETE CASCADE,

  -- Assertion details
  assertion_label TEXT NOT NULL,
  assertion_type TEXT NOT NULL,                 -- c2pa.actions, stds.exif, etc.
  assertion_data JSONB NOT NULL DEFAULT '{}',

  -- For action assertions
  action_type TEXT,                             -- c2pa.created, c2pa.edited, etc.
  action_when TIMESTAMPTZ,
  action_software TEXT,

  -- Redaction status
  is_redacted BOOLEAN DEFAULT FALSE,
  redaction_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C2PA ingredient references (parent media)
CREATE TABLE c2pa_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES c2pa_manifests(id) ON DELETE CASCADE,

  -- Ingredient reference
  ingredient_hash TEXT,                          -- Hash of ingredient
  ingredient_type TEXT,                          -- MIME type
  ingredient_title TEXT,
  ingredient_format TEXT,

  -- Relationship
  relationship TEXT,                             -- parentOf, inputTo, etc.

  -- Linked manifest if we have it
  linked_manifest_id UUID REFERENCES c2pa_manifests(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI DETECTION TABLES
-- ============================================================================

-- AI detection provider configurations
CREATE TABLE ai_detection_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  api_endpoint TEXT NOT NULL,
  api_key_env_var TEXT NOT NULL,                 -- Environment variable name
  enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,                    -- Higher = preferred

  -- Capabilities
  supports_video BOOLEAN DEFAULT TRUE,
  supports_photo BOOLEAN DEFAULT TRUE,
  supports_audio BOOLEAN DEFAULT FALSE,
  supports_deepfake BOOLEAN DEFAULT FALSE,
  supports_face_swap BOOLEAN DEFAULT FALSE,
  supports_voice_clone BOOLEAN DEFAULT FALSE,
  supports_gan_detection BOOLEAN DEFAULT FALSE,
  supports_diffusion_detection BOOLEAN DEFAULT FALSE,

  -- Rate limits
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Pricing
  cost_per_request DECIMAL(10, 6) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI detection results from each provider
CREATE TABLE ai_detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL,
  media_type media_type NOT NULL DEFAULT 'video',
  provider_id UUID REFERENCES ai_detection_providers(id),
  provider_name TEXT NOT NULL,

  -- Detection scores (0-100)
  ai_generated_score DECIMAL(5, 2),
  deepfake_score DECIMAL(5, 2),
  face_swap_score DECIMAL(5, 2),
  voice_clone_score DECIMAL(5, 2),
  manipulation_score DECIMAL(5, 2),

  -- Model signatures
  gan_signature_detected BOOLEAN DEFAULT FALSE,
  gan_model_name TEXT,
  diffusion_signature_detected BOOLEAN DEFAULT FALSE,
  diffusion_model_name TEXT,

  -- Confidence and verdict
  confidence DECIMAL(5, 2),
  verdict ai_verdict,

  -- Raw response
  raw_response JSONB,

  -- Timing
  request_duration_ms INTEGER,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated AI detection consensus
CREATE TABLE ai_detection_consensus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL UNIQUE,
  media_type media_type NOT NULL DEFAULT 'video',

  -- Aggregated scores
  overall_authenticity_score DECIMAL(5, 2),      -- 0 = fake, 100 = authentic
  ai_generated_probability DECIMAL(5, 4),        -- 0.0000 to 1.0000
  deepfake_probability DECIMAL(5, 4),
  manipulation_probability DECIMAL(5, 4),

  -- Consensus verdict
  verdict ai_verdict,
  verdict_confidence DECIMAL(5, 2),

  -- Provider agreement
  providers_analyzed INTEGER DEFAULT 0,
  providers_agreed INTEGER DEFAULT 0,

  -- Recommendation
  recommendation TEXT,                            -- approve, flag, reject
  requires_human_review BOOLEAN DEFAULT FALSE,

  -- Analysis metadata
  total_analysis_time_ms INTEGER,
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHOTO VERIFICATION TABLES
-- ============================================================================

-- Photos table (parallel to videos)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,

  -- File info
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  original_filename TEXT,

  -- Dimensions
  width INTEGER,
  height INTEGER,
  aspect_ratio DECIMAL(6, 4),

  -- Hashes
  sha256_hash TEXT,
  md5_hash TEXT,

  -- Status
  status TEXT DEFAULT 'pending',
  moderation_status TEXT DEFAULT 'pending',

  -- Visibility
  is_public BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo verifications
CREATE TABLE photo_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Hashes
  sha256_hash TEXT NOT NULL,

  -- IPFS
  ipfs_cid TEXT,
  ipfs_url TEXT,

  -- Blockchain
  token_id TEXT,
  transaction_hash TEXT,
  block_number BIGINT,
  blockchain_timestamp TIMESTAMPTZ,
  contract_address TEXT,

  -- Owner
  owner_address TEXT,
  original_creator_address TEXT,

  -- Status
  status TEXT DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sha256_hash)
);

-- Photo EXIF metadata
CREATE TABLE photo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE UNIQUE,

  -- Camera info
  camera_make TEXT,
  camera_model TEXT,
  lens_make TEXT,
  lens_model TEXT,
  serial_number TEXT,

  -- Capture settings
  focal_length DECIMAL(10, 2),
  aperture DECIMAL(4, 2),
  shutter_speed TEXT,
  iso INTEGER,
  exposure_mode TEXT,
  metering_mode TEXT,
  flash_fired BOOLEAN,
  white_balance TEXT,

  -- Timestamps
  capture_timestamp TIMESTAMPTZ,
  digitized_timestamp TIMESTAMPTZ,

  -- GPS
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_altitude DECIMAL(10, 2),
  gps_timestamp TIMESTAMPTZ,
  location_name TEXT,

  -- Image properties
  color_space TEXT,
  bit_depth INTEGER,
  compression TEXT,
  orientation INTEGER,

  -- Software
  software TEXT,
  software_version TEXT,

  -- Copyright
  copyright TEXT,
  artist TEXT,

  -- Raw EXIF
  raw_exif JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo perceptual hashes
CREATE TABLE photo_perceptual_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE UNIQUE,
  verification_id UUID REFERENCES photo_verifications(id),

  -- Hash types
  phash TEXT,                                    -- Perceptual hash (DCT-based)
  dhash TEXT,                                    -- Difference hash
  ahash TEXT,                                    -- Average hash
  colorhash TEXT,                                -- Color histogram hash
  whash TEXT,                                    -- Wavelet hash

  -- For similarity search
  phash_bits BIT(64),                            -- For fast Hamming distance

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo manipulation analysis
CREATE TABLE photo_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE UNIQUE,

  -- Error Level Analysis
  ela_score DECIMAL(5, 2),                       -- 0-100, higher = more likely edited
  ela_regions JSONB DEFAULT '[]',                -- Suspicious regions

  -- Clone detection
  clone_detected BOOLEAN DEFAULT FALSE,
  clone_regions JSONB DEFAULT '[]',

  -- Splicing detection
  splicing_detected BOOLEAN DEFAULT FALSE,
  splicing_regions JSONB DEFAULT '[]',

  -- Noise analysis
  noise_inconsistency_score DECIMAL(5, 2),

  -- JPEG quality analysis
  jpeg_quality_estimated INTEGER,
  double_jpeg_compression BOOLEAN DEFAULT FALSE,

  -- Metadata consistency
  metadata_stripped BOOLEAN DEFAULT FALSE,
  metadata_modified BOOLEAN DEFAULT FALSE,

  -- Overall score
  manipulation_probability DECIMAL(5, 4),

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MERKLE TREE TABLES
-- ============================================================================

-- Video Merkle trees for frame-level verification
CREATE TABLE video_merkle_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE UNIQUE,
  verification_id UUID REFERENCES verifications(id),

  -- Tree info
  root_hash TEXT NOT NULL,
  tree_depth INTEGER NOT NULL,
  total_leaves INTEGER NOT NULL,                 -- Number of frames

  -- Frame sampling
  frame_interval_ms INTEGER NOT NULL,            -- Milliseconds between frames
  frame_count INTEGER NOT NULL,
  duration_ms INTEGER,

  -- Algorithm
  hash_algorithm TEXT DEFAULT 'sha256',

  -- Storage
  tree_data JSONB,                               -- Full tree for small videos
  tree_storage_path TEXT,                        -- Path to external storage for large trees

  -- Blockchain
  root_hash_on_chain BOOLEAN DEFAULT FALSE,
  transaction_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Merkle tree nodes (for large videos)
CREATE TABLE merkle_tree_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES video_merkle_trees(id) ON DELETE CASCADE,

  -- Position in tree
  level INTEGER NOT NULL,                        -- 0 = leaves (frames)
  node_index INTEGER NOT NULL,

  -- Hash
  hash TEXT NOT NULL,

  -- For leaf nodes (frames)
  frame_number INTEGER,
  frame_timestamp_ms INTEGER,

  -- Children (for internal nodes)
  left_child_index INTEGER,
  right_child_index INTEGER,

  UNIQUE(tree_id, level, node_index)
);

-- ============================================================================
-- LEGAL EVIDENCE TABLES
-- ============================================================================

-- Legal certificates
CREATE TABLE legal_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verifications(id),
  photo_verification_id UUID REFERENCES photo_verifications(id),

  -- Certificate info
  certificate_number TEXT NOT NULL UNIQUE,
  status certificate_status DEFAULT 'pending',

  -- Media identification
  media_type media_type NOT NULL,
  sha256_hash TEXT NOT NULL,
  ipfs_cid TEXT,

  -- Verification data
  verification_timestamp TIMESTAMPTZ NOT NULL,
  blockchain_network TEXT,
  transaction_hash TEXT,
  block_number BIGINT,
  token_id TEXT,

  -- Provenance
  original_creator TEXT,
  capture_device TEXT,
  capture_location JSONB,
  capture_timestamp TIMESTAMPTZ,

  -- Chain of custody
  custody_chain JSONB DEFAULT '[]',

  -- RFC 3161 timestamp
  rfc3161_timestamp JSONB,
  rfc3161_tsa TEXT,
  rfc3161_token BYTEA,

  -- Notarization
  notarized BOOLEAN DEFAULT FALSE,
  notarization_date TIMESTAMPTZ,
  notarization_service TEXT,
  notarization_reference TEXT,

  -- Certificate document
  certificate_pdf_path TEXT,
  certificate_pdf_hash TEXT,

  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Signature
  signed_by TEXT DEFAULT 'VidChain Certification Authority',
  signature TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_media_reference CHECK (
    verification_id IS NOT NULL OR photo_verification_id IS NOT NULL
  )
);

-- RFC 3161 timestamp tokens
CREATE TABLE rfc3161_timestamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL,
  media_type media_type NOT NULL,

  -- Hash being timestamped
  hash_algorithm TEXT NOT NULL DEFAULT 'sha256',
  hashed_message TEXT NOT NULL,

  -- Timestamp Authority
  tsa_url TEXT NOT NULL,
  tsa_name TEXT,

  -- Timestamp token
  timestamp_token BYTEA NOT NULL,
  timestamp_value TIMESTAMPTZ NOT NULL,

  -- Certificate
  tsa_certificate TEXT,
  serial_number TEXT,

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert witness network
CREATE TABLE expert_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Credentials
  credentials TEXT[],
  certifications TEXT[],
  years_experience INTEGER,

  -- Specializations
  specializations TEXT[],
  jurisdictions TEXT[],
  languages TEXT[],

  -- Rates
  hourly_rate DECIMAL(10, 2),
  minimum_engagement DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Availability
  availability_status TEXT DEFAULT 'available',

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  -- Statistics
  cases_supported INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert engagements
CREATE TABLE expert_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES legal_certificates(id),
  expert_id UUID NOT NULL REFERENCES expert_witnesses(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Case info
  case_reference TEXT,
  case_type TEXT,                                -- civil, criminal, arbitration, etc.
  jurisdiction TEXT,

  -- Engagement
  engagement_type TEXT,                          -- consultation, testimony, report
  status TEXT DEFAULT 'requested',

  -- Scheduling
  requested_date TIMESTAMPTZ,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Billing
  estimated_hours DECIMAL(6, 2),
  actual_hours DECIMAL(6, 2),
  amount_billed DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EMBEDDABLE BADGE TABLES
-- ============================================================================

-- Badge configurations per verification
CREATE TABLE verification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES verifications(id) ON DELETE CASCADE,
  photo_verification_id UUID REFERENCES photo_verifications(id) ON DELETE CASCADE,

  -- Badge settings
  style badge_style DEFAULT 'standard',
  enabled BOOLEAN DEFAULT TRUE,

  -- Custom branding
  custom_logo_url TEXT,
  primary_color TEXT DEFAULT '#22c55e',
  secondary_color TEXT DEFAULT '#000000',

  -- Display options
  show_token_id BOOLEAN DEFAULT TRUE,
  show_verification_date BOOLEAN DEFAULT TRUE,
  show_blockchain_info BOOLEAN DEFAULT FALSE,
  show_qr_code BOOLEAN DEFAULT TRUE,

  -- Analytics
  embed_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  -- Access control
  embed_domains TEXT[],                          -- Allowed domains, empty = all
  require_referrer BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_verification_reference CHECK (
    verification_id IS NOT NULL OR photo_verification_id IS NOT NULL
  )
);

-- Badge embed tracking
CREATE TABLE badge_embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID NOT NULL REFERENCES verification_badges(id) ON DELETE CASCADE,

  -- Embed location
  embed_url TEXT,
  embed_domain TEXT,
  referrer TEXT,

  -- Embed type
  embed_type TEXT,                               -- html, svg, iframe, qr

  -- Visitor info
  visitor_ip INET,
  visitor_country TEXT,
  visitor_user_agent TEXT,

  -- Interaction
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EMAIL NOTIFICATION TABLES
-- ============================================================================

-- Email templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,

  -- Variables
  variables JSONB DEFAULT '[]',                  -- Available template variables

  -- Status
  enabled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sent emails log
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id),

  -- Recipient
  to_email TEXT NOT NULL,
  to_name TEXT,
  user_id UUID REFERENCES auth.users(id),

  -- Email details
  subject TEXT NOT NULL,

  -- Context
  context_type TEXT,                             -- verification, dmca, alert, etc.
  context_id UUID,

  -- Status
  status TEXT DEFAULT 'pending',                 -- pending, sent, delivered, bounced, failed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Provider response
  provider TEXT,
  provider_message_id TEXT,
  provider_response JSONB,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WATERMARKING TABLES
-- ============================================================================

-- Watermark configurations
CREATE TABLE watermark_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Watermark type
  watermark_type TEXT NOT NULL,                  -- invisible, visible, both

  -- Invisible watermark settings
  invisible_algorithm TEXT DEFAULT 'dwt',        -- dwt, dct, spread_spectrum
  invisible_strength INTEGER DEFAULT 50,         -- 0-100

  -- Visible watermark settings
  visible_enabled BOOLEAN DEFAULT FALSE,
  visible_text TEXT,
  visible_logo_url TEXT,
  visible_position TEXT DEFAULT 'bottom_right',
  visible_opacity DECIMAL(3, 2) DEFAULT 0.5,

  -- Default for new uploads
  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applied watermarks
CREATE TABLE applied_watermarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL,
  media_type media_type NOT NULL,
  config_id UUID REFERENCES watermark_configs(id),

  -- Watermark data
  watermark_type TEXT NOT NULL,

  -- Invisible watermark payload
  payload_video_id TEXT,
  payload_user_id TEXT,
  payload_timestamp BIGINT,
  payload_blockchain_hash TEXT,
  payload_encoded TEXT,

  -- Detection
  extractable BOOLEAN DEFAULT TRUE,
  last_extracted_at TIMESTAMPTZ,
  extraction_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- C2PA
CREATE INDEX idx_c2pa_manifests_media ON c2pa_manifests(media_id, media_type);
CREATE INDEX idx_c2pa_manifests_status ON c2pa_manifests(status);
CREATE INDEX idx_c2pa_assertions_manifest ON c2pa_assertions(manifest_id);
CREATE INDEX idx_c2pa_ingredients_manifest ON c2pa_ingredients(manifest_id);

-- AI Detection
CREATE INDEX idx_ai_detection_results_media ON ai_detection_results(media_id, media_type);
CREATE INDEX idx_ai_detection_results_provider ON ai_detection_results(provider_id);
CREATE INDEX idx_ai_detection_consensus_media ON ai_detection_consensus(media_id);
CREATE INDEX idx_ai_detection_consensus_verdict ON ai_detection_consensus(verdict);

-- Photos
CREATE INDEX idx_photos_user ON photos(user_id);
CREATE INDEX idx_photos_org ON photos(organization_id);
CREATE INDEX idx_photos_hash ON photos(sha256_hash);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photo_verifications_photo ON photo_verifications(photo_id);
CREATE INDEX idx_photo_verifications_hash ON photo_verifications(sha256_hash);
CREATE INDEX idx_photo_metadata_photo ON photo_metadata(photo_id);
CREATE INDEX idx_photo_hashes_photo ON photo_perceptual_hashes(photo_id);
CREATE INDEX idx_photo_analysis_photo ON photo_analysis(photo_id);

-- Merkle trees
CREATE INDEX idx_merkle_trees_video ON video_merkle_trees(video_id);
CREATE INDEX idx_merkle_nodes_tree ON merkle_tree_nodes(tree_id);
CREATE INDEX idx_merkle_nodes_level ON merkle_tree_nodes(tree_id, level);

-- Legal
CREATE INDEX idx_legal_certs_verification ON legal_certificates(verification_id);
CREATE INDEX idx_legal_certs_photo ON legal_certificates(photo_verification_id);
CREATE INDEX idx_legal_certs_number ON legal_certificates(certificate_number);
CREATE INDEX idx_rfc3161_media ON rfc3161_timestamps(media_id, media_type);
CREATE INDEX idx_expert_engagements_cert ON expert_engagements(certificate_id);
CREATE INDEX idx_expert_engagements_expert ON expert_engagements(expert_id);

-- Badges
CREATE INDEX idx_badges_verification ON verification_badges(verification_id);
CREATE INDEX idx_badges_photo ON verification_badges(photo_verification_id);
CREATE INDEX idx_badge_embeds_badge ON badge_embeds(badge_id);
CREATE INDEX idx_badge_embeds_domain ON badge_embeds(embed_domain);

-- Email
CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_context ON email_logs(context_type, context_id);

-- Watermarks
CREATE INDEX idx_watermarks_media ON applied_watermarks(media_id, media_type);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate legal certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  cert_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(certificate_number FROM 'VC-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM legal_certificates
  WHERE certificate_number LIKE 'VC-' || year_part || '-%';

  cert_number := 'VC-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');

  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Find similar photos by perceptual hash
CREATE OR REPLACE FUNCTION find_similar_photos(
  target_phash TEXT,
  max_distance INTEGER DEFAULT 10,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  photo_id UUID,
  verification_id UUID,
  phash TEXT,
  distance INTEGER,
  similarity DECIMAL(5, 4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pph.photo_id,
    pph.verification_id,
    pph.phash,
    hamming_distance(target_phash, pph.phash) as distance,
    (1.0 - (hamming_distance(target_phash, pph.phash)::DECIMAL / 256.0)) as similarity
  FROM photo_perceptual_hashes pph
  WHERE hamming_distance(target_phash, pph.phash) <= max_distance
  ORDER BY distance ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Aggregate AI detection results
CREATE OR REPLACE FUNCTION aggregate_ai_detection(
  p_media_id UUID,
  p_media_type media_type DEFAULT 'video'
)
RETURNS UUID AS $$
DECLARE
  consensus_id UUID;
  avg_ai_score DECIMAL(5, 2);
  avg_deepfake_score DECIMAL(5, 2);
  avg_manipulation_score DECIMAL(5, 2);
  total_providers INTEGER;
  final_verdict ai_verdict;
  authenticity_score DECIMAL(5, 2);
BEGIN
  -- Calculate average scores
  SELECT
    AVG(ai_generated_score),
    AVG(deepfake_score),
    AVG(manipulation_score),
    COUNT(*)
  INTO avg_ai_score, avg_deepfake_score, avg_manipulation_score, total_providers
  FROM ai_detection_results
  WHERE media_id = p_media_id AND media_type = p_media_type;

  -- Determine verdict
  IF avg_ai_score >= 80 OR avg_deepfake_score >= 80 THEN
    final_verdict := 'synthetic';
    authenticity_score := 100 - GREATEST(avg_ai_score, avg_deepfake_score);
  ELSIF avg_ai_score >= 60 OR avg_deepfake_score >= 60 THEN
    final_verdict := 'likely_synthetic';
    authenticity_score := 100 - GREATEST(avg_ai_score, avg_deepfake_score);
  ELSIF avg_ai_score >= 40 OR avg_deepfake_score >= 40 THEN
    final_verdict := 'uncertain';
    authenticity_score := 50;
  ELSIF avg_ai_score >= 20 THEN
    final_verdict := 'likely_authentic';
    authenticity_score := 100 - avg_ai_score;
  ELSE
    final_verdict := 'authentic';
    authenticity_score := 100 - COALESCE(avg_ai_score, 0);
  END IF;

  -- Upsert consensus
  INSERT INTO ai_detection_consensus (
    media_id,
    media_type,
    overall_authenticity_score,
    ai_generated_probability,
    deepfake_probability,
    manipulation_probability,
    verdict,
    verdict_confidence,
    providers_analyzed,
    last_analyzed_at
  ) VALUES (
    p_media_id,
    p_media_type,
    authenticity_score,
    COALESCE(avg_ai_score, 0) / 100,
    COALESCE(avg_deepfake_score, 0) / 100,
    COALESCE(avg_manipulation_score, 0) / 100,
    final_verdict,
    CASE WHEN total_providers >= 3 THEN 90 ELSE total_providers * 30 END,
    total_providers,
    NOW()
  )
  ON CONFLICT (media_id) DO UPDATE SET
    overall_authenticity_score = EXCLUDED.overall_authenticity_score,
    ai_generated_probability = EXCLUDED.ai_generated_probability,
    deepfake_probability = EXCLUDED.deepfake_probability,
    manipulation_probability = EXCLUDED.manipulation_probability,
    verdict = EXCLUDED.verdict,
    verdict_confidence = EXCLUDED.verdict_confidence,
    providers_analyzed = EXCLUDED.providers_analyzed,
    last_analyzed_at = EXCLUDED.last_analyzed_at,
    updated_at = NOW()
  RETURNING id INTO consensus_id;

  RETURN consensus_id;
END;
$$ LANGUAGE plpgsql;

-- Verify Merkle proof
CREATE OR REPLACE FUNCTION verify_merkle_proof(
  p_tree_id UUID,
  p_frame_number INTEGER,
  p_frame_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  tree_record RECORD;
  current_hash TEXT;
  sibling_hash TEXT;
  current_index INTEGER;
  current_level INTEGER;
  is_left BOOLEAN;
BEGIN
  -- Get tree info
  SELECT * INTO tree_record FROM video_merkle_trees WHERE id = p_tree_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get leaf node
  SELECT hash, node_index INTO current_hash, current_index
  FROM merkle_tree_nodes
  WHERE tree_id = p_tree_id AND level = 0 AND frame_number = p_frame_number;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verify provided hash matches stored hash
  IF current_hash != p_frame_hash THEN
    RETURN FALSE;
  END IF;

  -- Walk up the tree
  FOR current_level IN 1..tree_record.tree_depth LOOP
    is_left := (current_index % 2) = 0;

    -- Get sibling
    IF is_left THEN
      SELECT hash INTO sibling_hash
      FROM merkle_tree_nodes
      WHERE tree_id = p_tree_id AND level = current_level - 1 AND node_index = current_index + 1;
    ELSE
      SELECT hash INTO sibling_hash
      FROM merkle_tree_nodes
      WHERE tree_id = p_tree_id AND level = current_level - 1 AND node_index = current_index - 1;
    END IF;

    -- Compute parent hash
    IF sibling_hash IS NOT NULL THEN
      IF is_left THEN
        current_hash := encode(sha256((current_hash || sibling_hash)::bytea), 'hex');
      ELSE
        current_hash := encode(sha256((sibling_hash || current_hash)::bytea), 'hex');
      END IF;
    END IF;

    current_index := current_index / 2;
  END LOOP;

  -- Compare with root
  RETURN current_hash = tree_record.root_hash;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate certificate number
CREATE OR REPLACE FUNCTION auto_generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER legal_certificate_number_trigger
  BEFORE INSERT ON legal_certificates
  FOR EACH ROW EXECUTE FUNCTION auto_generate_certificate_number();

-- Update timestamps
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_verifications_updated_at
  BEFORE UPDATE ON photo_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_c2pa_manifests_updated_at
  BEFORE UPDATE ON c2pa_manifests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_certificates_updated_at
  BEFORE UPDATE ON legal_certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_badges_updated_at
  BEFORE UPDATE ON verification_badges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_perceptual_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE c2pa_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_detection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_detection_consensus ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_badges ENABLE ROW LEVEL SECURITY;

-- Photos policies
CREATE POLICY photos_select ON photos
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_public = TRUE
    OR organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY photos_insert ON photos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY photos_update ON photos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY photos_delete ON photos
  FOR DELETE USING (user_id = auth.uid());

-- Photo verifications policies
CREATE POLICY photo_verifications_select ON photo_verifications
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM photos WHERE id = photo_verifications.photo_id AND is_public = TRUE)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY photo_verifications_insert ON photo_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- C2PA manifests - publicly viewable
CREATE POLICY c2pa_manifests_select ON c2pa_manifests
  FOR SELECT USING (true);

-- AI detection - publicly viewable
CREATE POLICY ai_detection_results_select ON ai_detection_results
  FOR SELECT USING (true);

CREATE POLICY ai_detection_consensus_select ON ai_detection_consensus
  FOR SELECT USING (true);

-- Legal certificates - owner only
CREATE POLICY legal_certificates_select ON legal_certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verifications v WHERE v.id = legal_certificates.verification_id AND v.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM photo_verifications pv WHERE pv.id = legal_certificates.photo_verification_id AND pv.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Badges - publicly viewable
CREATE POLICY verification_badges_select ON verification_badges
  FOR SELECT USING (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default AI detection providers
INSERT INTO ai_detection_providers (name, api_endpoint, api_key_env_var, priority, supports_deepfake, supports_face_swap, supports_gan_detection, supports_diffusion_detection) VALUES
  ('hive_ai', 'https://api.thehive.ai/api/v2/task/sync', 'HIVE_API_KEY', 100, true, true, true, true),
  ('sensity_ai', 'https://api.sensity.ai/v1/detect', 'SENSITY_API_KEY', 90, true, true, true, false),
  ('reality_defender', 'https://api.realitydefender.com/v1/analyze', 'REALITY_DEFENDER_API_KEY', 80, true, true, false, true)
ON CONFLICT (name) DO NOTHING;

-- Default email templates
INSERT INTO email_templates (name, subject, html_body, variables) VALUES
  ('verification_complete', 'Your media has been verified on VidChain',
   '<h1>Verification Complete</h1><p>Your {{media_type}} "{{title}}" has been successfully verified and recorded on the blockchain.</p><p><a href="{{verification_url}}">View Verification Certificate</a></p>',
   '["media_type", "title", "verification_url"]'),
  ('nft_minted', 'Your VidChain NFT has been minted',
   '<h1>NFT Minted Successfully</h1><p>Token ID: {{token_id}}</p><p>Transaction: {{transaction_hash}}</p><p><a href="{{nft_url}}">View Your NFT</a></p>',
   '["token_id", "transaction_hash", "nft_url"]'),
  ('duplicate_detected', 'Duplicate content detected',
   '<h1>Duplicate Detected</h1><p>The {{media_type}} you uploaded appears to match existing verified content.</p><p>Original verification: <a href="{{original_url}}">{{original_title}}</a></p>',
   '["media_type", "original_url", "original_title"]'),
  ('security_alert', 'Security Alert for Your VidChain Account',
   '<h1>Security Alert</h1><p>{{alert_message}}</p><p>If this was not you, please secure your account immediately.</p>',
   '["alert_message"]')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE c2pa_manifests IS 'Stores C2PA content authenticity manifests from uploaded media';
COMMENT ON TABLE c2pa_assertions IS 'Individual assertions extracted from C2PA manifests';
COMMENT ON TABLE ai_detection_providers IS 'Configuration for AI detection service providers';
COMMENT ON TABLE ai_detection_results IS 'Results from individual AI detection providers';
COMMENT ON TABLE ai_detection_consensus IS 'Aggregated AI detection consensus across providers';
COMMENT ON TABLE photos IS 'Photo uploads for verification (parallel to videos table)';
COMMENT ON TABLE photo_verifications IS 'Verification records for photos';
COMMENT ON TABLE photo_metadata IS 'EXIF and other metadata extracted from photos';
COMMENT ON TABLE photo_perceptual_hashes IS 'Perceptual hashes for photo similarity search';
COMMENT ON TABLE photo_analysis IS 'Photo manipulation detection analysis results';
COMMENT ON TABLE video_merkle_trees IS 'Merkle trees for frame-level video verification';
COMMENT ON TABLE merkle_tree_nodes IS 'Individual nodes in video Merkle trees';
COMMENT ON TABLE legal_certificates IS 'Court-admissible verification certificates';
COMMENT ON TABLE rfc3161_timestamps IS 'RFC 3161 trusted timestamps from TSAs';
COMMENT ON TABLE expert_witnesses IS 'Network of expert witnesses for legal proceedings';
COMMENT ON TABLE verification_badges IS 'Embeddable badge configurations per verification';
COMMENT ON TABLE email_templates IS 'Email notification templates';
COMMENT ON TABLE watermark_configs IS 'Watermark configuration settings';
COMMENT ON TABLE applied_watermarks IS 'Tracking of applied watermarks';
