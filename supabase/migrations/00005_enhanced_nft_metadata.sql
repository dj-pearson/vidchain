-- Migration: Enhanced NFT Metadata for Video Authenticity
-- Adds comprehensive metadata tracking, provenance, and integrity verification

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Content categories for NFT classification
CREATE TYPE content_category AS ENUM (
  'art',
  'music',
  'documentary',
  'sports',
  'gaming',
  'education',
  'entertainment',
  'news',
  'personal',
  'commercial',
  'other'
);

-- Content rating system
CREATE TYPE content_rating AS ENUM (
  'G',        -- General audiences
  'PG',       -- Parental guidance suggested
  'PG-13',    -- Parents strongly cautioned
  'R',        -- Restricted
  'NC-17'     -- Adults only
);

-- Provenance action types
CREATE TYPE provenance_action AS ENUM (
  'created',
  'uploaded',
  'verified',
  'minted',
  'transferred',
  'listed',
  'sold',
  'relisted',
  'delisted',
  'metadata_updated',
  'duplicate_detected'
);

-- ============================================================================
-- ENHANCED VIDEO METADATA TABLE
-- ============================================================================

-- Store extracted video source metadata (from file EXIF/container)
CREATE TABLE video_source_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

  -- Device & Capture Information
  capture_device_make VARCHAR(255),          -- e.g., "Apple", "Canon", "Sony"
  capture_device_model VARCHAR(255),         -- e.g., "iPhone 15 Pro", "EOS R5"
  capture_device_serial VARCHAR(255),        -- Device serial number if available
  capture_software VARCHAR(255),             -- Recording/editing software
  capture_software_version VARCHAR(100),     -- Software version

  -- Timestamps from file metadata
  original_capture_date TIMESTAMPTZ,         -- When video was actually recorded
  file_creation_date TIMESTAMPTZ,            -- File system creation date
  file_modification_date TIMESTAMPTZ,        -- Last modification date

  -- GPS/Location Data
  gps_latitude DECIMAL(10, 8),               -- Latitude coordinate
  gps_longitude DECIMAL(11, 8),              -- Longitude coordinate
  gps_altitude DECIMAL(10, 2),               -- Altitude in meters
  location_name VARCHAR(500),                -- Reverse geocoded location name

  -- Embedded Metadata
  embedded_title VARCHAR(500),               -- Title from file metadata
  embedded_artist VARCHAR(255),              -- Artist/creator name in metadata
  embedded_copyright VARCHAR(1000),          -- Copyright notice
  embedded_description TEXT,                 -- Description from metadata
  embedded_comment TEXT,                     -- Comment field

  -- Technical Metadata (extended)
  color_space VARCHAR(50),                   -- e.g., "bt709", "sRGB"
  color_primaries VARCHAR(50),               -- Color primaries
  color_transfer VARCHAR(50),                -- Transfer characteristics
  bit_depth INTEGER,                         -- Video bit depth (8, 10, 12)
  hdr_format VARCHAR(50),                    -- HDR format if applicable
  rotation INTEGER DEFAULT 0,                -- Video rotation in degrees

  -- Audio Details
  audio_sample_rate INTEGER,                 -- Audio sample rate in Hz
  audio_bit_depth INTEGER,                   -- Audio bit depth
  audio_language VARCHAR(10),                -- Audio language code

  -- Container Metadata
  container_format VARCHAR(50),              -- Container format (mp4, mkv, etc.)
  encoder_name VARCHAR(255),                 -- Encoder used
  encoder_version VARCHAR(100),              -- Encoder version

  -- Raw metadata JSON for additional fields
  raw_metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(video_id)
);

-- ============================================================================
-- ENHANCED NFT METADATA
-- ============================================================================

-- Add new columns to verifications table
ALTER TABLE verifications
  ADD COLUMN IF NOT EXISTS category content_category DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
  ADD COLUMN IF NOT EXISTS content_rating content_rating DEFAULT 'G',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',

  -- Creator/Owner tracking (beyond blockchain)
  ADD COLUMN IF NOT EXISTS original_creator_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS original_creator_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS uploader_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS current_owner_name VARCHAR(255),

  -- Integrity hashes
  ADD COLUMN IF NOT EXISTS audio_fingerprint VARCHAR(500),           -- Audio fingerprint for matching
  ADD COLUMN IF NOT EXISTS color_histogram JSONB,                    -- Visual color distribution
  ADD COLUMN IF NOT EXISTS frame_hashes JSONB,                       -- Hashes of key frames

  -- Duplicate detection
  ADD COLUMN IF NOT EXISTS original_verification_id UUID REFERENCES verifications(id),
  ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS duplicate_confidence DECIMAL(5, 4),       -- 0.0000 to 1.0000
  ADD COLUMN IF NOT EXISTS original_source_hash VARCHAR(64),         -- Hash of original if re-upload

  -- Display preferences
  ADD COLUMN IF NOT EXISTS overlay_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS overlay_position VARCHAR(50) DEFAULT 'corners',
  ADD COLUMN IF NOT EXISTS overlay_opacity DECIMAL(3, 2) DEFAULT 0.85,

  -- Timestamps
  ADD COLUMN IF NOT EXISTS mint_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_transfer_date TIMESTAMPTZ;

-- ============================================================================
-- CHAIN OF CUSTODY / PROVENANCE TRACKING
-- ============================================================================

CREATE TABLE provenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,

  action provenance_action NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_address VARCHAR(42),                 -- Ethereum address if applicable
  actor_name VARCHAR(255),                   -- Display name at time of action

  -- Transaction details (if blockchain related)
  transaction_hash VARCHAR(66),
  block_number BIGINT,

  -- Additional context
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,

  -- For transfers
  from_address VARCHAR(42),
  to_address VARCHAR(42),
  price_amount DECIMAL(36, 18),              -- Price if sold
  price_currency VARCHAR(10),                -- ETH, VCT, VIDC, USD

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexing for efficient queries
  CONSTRAINT valid_price CHECK (price_amount IS NULL OR price_amount >= 0)
);

-- ============================================================================
-- PERCEPTUAL HASH LOOKUP TABLE
-- ============================================================================

-- Optimized table for fast perceptual hash similarity search
CREATE TABLE perceptual_hash_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

  -- Different perceptual hash types for robust matching
  phash_video VARCHAR(64) NOT NULL,          -- Primary video pHash
  phash_thumbnail VARCHAR(64),               -- Thumbnail pHash
  dhash_video VARCHAR(64),                   -- Difference hash
  ahash_video VARCHAR(64),                   -- Average hash

  -- Frame-level hashes for more granular matching
  frame_phashes JSONB DEFAULT '[]',          -- Array of {timestamp, hash}

  -- Computed similarity metrics
  duration_seconds DECIMAL(10, 3),
  aspect_ratio DECIMAL(6, 4),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(verification_id)
);

-- ============================================================================
-- OVERLAY SETTINGS TABLE
-- ============================================================================

CREATE TABLE overlay_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,

  -- Corner content configuration
  top_left_content JSONB DEFAULT '{"type": "verification_status", "show_token_id": true}',
  top_right_content JSONB DEFAULT '{"type": "category_year"}',
  bottom_left_content JSONB DEFAULT '{"type": "location_ipfs"}',
  bottom_right_content JSONB DEFAULT '{"type": "creator_owner"}',

  -- Styling
  font_family VARCHAR(100) DEFAULT 'Inter',
  font_size INTEGER DEFAULT 14,
  text_color VARCHAR(9) DEFAULT '#FFFFFF',
  background_color VARCHAR(9) DEFAULT '#000000',
  background_opacity DECIMAL(3, 2) DEFAULT 0.75,
  corner_radius INTEGER DEFAULT 8,
  padding INTEGER DEFAULT 12,
  margin INTEGER DEFAULT 16,

  -- Visibility
  show_on_playback BOOLEAN DEFAULT TRUE,
  show_on_download BOOLEAN DEFAULT TRUE,
  burn_into_export BOOLEAN DEFAULT TRUE,

  -- Animation
  fade_in_duration INTEGER DEFAULT 500,      -- milliseconds
  auto_hide_after INTEGER DEFAULT 0,         -- 0 = never hide, else ms

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(verification_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Video source metadata
CREATE INDEX idx_video_source_metadata_video_id ON video_source_metadata(video_id);
CREATE INDEX idx_video_source_metadata_capture_date ON video_source_metadata(original_capture_date);
CREATE INDEX idx_video_source_metadata_device ON video_source_metadata(capture_device_make, capture_device_model);
CREATE INDEX idx_video_source_metadata_location ON video_source_metadata(gps_latitude, gps_longitude)
  WHERE gps_latitude IS NOT NULL AND gps_longitude IS NOT NULL;

-- Verifications enhanced
CREATE INDEX idx_verifications_category ON verifications(category);
CREATE INDEX idx_verifications_tags ON verifications USING GIN(tags);
CREATE INDEX idx_verifications_original_creator ON verifications(original_creator_id);
CREATE INDEX idx_verifications_is_duplicate ON verifications(is_duplicate) WHERE is_duplicate = TRUE;
CREATE INDEX idx_verifications_perceptual_hash ON verifications(perceptual_hash) WHERE perceptual_hash IS NOT NULL;

-- Provenance records
CREATE INDEX idx_provenance_verification ON provenance_records(verification_id);
CREATE INDEX idx_provenance_actor ON provenance_records(actor_id);
CREATE INDEX idx_provenance_action ON provenance_records(action);
CREATE INDEX idx_provenance_created ON provenance_records(created_at DESC);
CREATE INDEX idx_provenance_transaction ON provenance_records(transaction_hash) WHERE transaction_hash IS NOT NULL;

-- Perceptual hash index - optimized for similarity search
CREATE INDEX idx_phash_video ON perceptual_hash_index(phash_video);
CREATE INDEX idx_phash_verification ON perceptual_hash_index(verification_id);
CREATE INDEX idx_phash_duration ON perceptual_hash_index(duration_seconds);

-- Overlay settings
CREATE INDEX idx_overlay_verification ON overlay_settings(verification_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate Hamming distance between two hex hashes
CREATE OR REPLACE FUNCTION hamming_distance(hash1 VARCHAR(64), hash2 VARCHAR(64))
RETURNS INTEGER AS $$
DECLARE
  distance INTEGER := 0;
  i INTEGER;
  byte1 INTEGER;
  byte2 INTEGER;
  xor_result INTEGER;
BEGIN
  IF length(hash1) != length(hash2) THEN
    RETURN -1;
  END IF;

  FOR i IN 0..((length(hash1)/2) - 1) LOOP
    byte1 := ('x' || substring(hash1 from (i*2 + 1) for 2))::bit(8)::integer;
    byte2 := ('x' || substring(hash2 from (i*2 + 1) for 2))::bit(8)::integer;
    xor_result := byte1 # byte2;

    -- Count bits in XOR result
    WHILE xor_result > 0 LOOP
      distance := distance + (xor_result & 1);
      xor_result := xor_result >> 1;
    END LOOP;
  END LOOP;

  RETURN distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find similar videos by perceptual hash
CREATE OR REPLACE FUNCTION find_similar_videos(
  target_phash VARCHAR(64),
  max_distance INTEGER DEFAULT 10,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  verification_id UUID,
  video_id UUID,
  phash VARCHAR(64),
  distance INTEGER,
  similarity DECIMAL(5, 4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    phi.verification_id,
    phi.video_id,
    phi.phash_video,
    hamming_distance(target_phash, phi.phash_video) as distance,
    (1.0 - (hamming_distance(target_phash, phi.phash_video)::DECIMAL / 256.0)) as similarity
  FROM perceptual_hash_index phi
  WHERE hamming_distance(target_phash, phi.phash_video) <= max_distance
  ORDER BY distance ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to record provenance event
CREATE OR REPLACE FUNCTION record_provenance(
  p_verification_id UUID,
  p_action provenance_action,
  p_actor_id UUID DEFAULT NULL,
  p_actor_address VARCHAR(42) DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  actor_display_name VARCHAR(255);
BEGIN
  -- Get actor name if user ID provided
  IF p_actor_id IS NOT NULL THEN
    SELECT full_name INTO actor_display_name FROM users WHERE id = p_actor_id;
  END IF;

  INSERT INTO provenance_records (
    verification_id,
    action,
    actor_id,
    actor_address,
    actor_name,
    details
  ) VALUES (
    p_verification_id,
    p_action,
    p_actor_id,
    p_actor_address,
    actor_display_name,
    p_details
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_source_metadata_updated_at
  BEFORE UPDATE ON video_source_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overlay_settings_updated_at
  BEFORE UPDATE ON overlay_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-record provenance when verification status changes
CREATE OR REPLACE FUNCTION auto_record_verification_provenance()
RETURNS TRIGGER AS $$
BEGIN
  -- Record minting
  IF OLD.token_id IS NULL AND NEW.token_id IS NOT NULL THEN
    PERFORM record_provenance(
      NEW.id,
      'minted',
      NEW.user_id,
      NEW.owner_address,
      jsonb_build_object('token_id', NEW.token_id, 'transaction_hash', NEW.transaction_hash)
    );
    NEW.mint_date := NOW();
  END IF;

  -- Record owner transfer
  IF OLD.owner_address IS DISTINCT FROM NEW.owner_address AND NEW.owner_address IS NOT NULL THEN
    PERFORM record_provenance(
      NEW.id,
      'transferred',
      NULL,
      NEW.owner_address,
      jsonb_build_object(
        'from_address', OLD.owner_address,
        'to_address', NEW.owner_address
      )
    );
    NEW.last_transfer_date := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verification_provenance_trigger
  BEFORE UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION auto_record_verification_provenance();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE video_source_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE provenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE perceptual_hash_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlay_settings ENABLE ROW LEVEL SECURITY;

-- Video source metadata: viewable by video owner/org, admins
CREATE POLICY video_source_metadata_select ON video_source_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM videos v
      WHERE v.id = video_source_metadata.video_id
      AND (v.user_id = auth.uid() OR v.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      ))
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY video_source_metadata_insert ON video_source_metadata
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM videos v
      WHERE v.id = video_source_metadata.video_id
      AND (v.user_id = auth.uid() OR v.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      ))
    )
  );

-- Provenance records: publicly viewable (transparency), insert by system
CREATE POLICY provenance_records_select ON provenance_records
  FOR SELECT USING (true);

CREATE POLICY provenance_records_insert ON provenance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM verifications ver
      WHERE ver.id = provenance_records.verification_id
      AND (ver.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- Perceptual hash index: viewable by all (for similarity search)
CREATE POLICY perceptual_hash_index_select ON perceptual_hash_index
  FOR SELECT USING (true);

CREATE POLICY perceptual_hash_index_insert ON perceptual_hash_index
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM verifications ver
      WHERE ver.id = perceptual_hash_index.verification_id
      AND ver.user_id = auth.uid()
    )
  );

-- Overlay settings: viewable by video owner, editable by owner
CREATE POLICY overlay_settings_select ON overlay_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM verifications ver
      WHERE ver.id = overlay_settings.verification_id
      AND (ver.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

CREATE POLICY overlay_settings_all ON overlay_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM verifications ver
      WHERE ver.id = overlay_settings.verification_id
      AND ver.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SEED DEFAULT OVERLAY SETTINGS
-- ============================================================================

-- Create default overlay settings for existing verifications
INSERT INTO overlay_settings (verification_id)
SELECT id FROM verifications
WHERE NOT EXISTS (
  SELECT 1 FROM overlay_settings WHERE verification_id = verifications.id
)
ON CONFLICT (verification_id) DO NOTHING;

COMMENT ON TABLE video_source_metadata IS 'Stores extracted metadata from video file EXIF/container data';
COMMENT ON TABLE provenance_records IS 'Immutable chain of custody records for NFT provenance tracking';
COMMENT ON TABLE perceptual_hash_index IS 'Optimized lookup table for perceptual hash similarity search';
COMMENT ON TABLE overlay_settings IS 'User-configurable overlay display settings per NFT';
