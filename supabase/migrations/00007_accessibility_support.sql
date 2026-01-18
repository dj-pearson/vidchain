-- Migration: Add accessibility support columns
-- Purpose: Support ADA/WCAG 2.1 compliance with alt text, captions, and transcripts

-- Add accessibility columns to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS alt_text TEXT,
ADD COLUMN IF NOT EXISTS captions_url TEXT,
ADD COLUMN IF NOT EXISTS captions_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS audio_description_url TEXT,
ADD COLUMN IF NOT EXISTS accessibility_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS accessibility_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accessibility_reviewed_by UUID REFERENCES auth.users(id);

-- Add comment documentation for accessibility columns
COMMENT ON COLUMN videos.alt_text IS 'Alternative text description of the video for screen readers';
COMMENT ON COLUMN videos.captions_url IS 'URL to VTT/SRT captions file for the video';
COMMENT ON COLUMN videos.captions_language IS 'Language code for captions (e.g., en, es, fr)';
COMMENT ON COLUMN videos.transcript IS 'Full text transcript of the video audio';
COMMENT ON COLUMN videos.audio_description_url IS 'URL to audio description track for visually impaired users';
COMMENT ON COLUMN videos.accessibility_reviewed IS 'Whether the video has been reviewed for accessibility compliance';
COMMENT ON COLUMN videos.accessibility_reviewed_at IS 'Timestamp of accessibility review';
COMMENT ON COLUMN videos.accessibility_reviewed_by IS 'User who performed the accessibility review';

-- Create accessibility audit log table
CREATE TABLE IF NOT EXISTS accessibility_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    auditor_id UUID REFERENCES auth.users(id),
    audit_type VARCHAR(50) NOT NULL, -- 'manual', 'automated', 'user_report'
    wcag_level VARCHAR(10), -- 'A', 'AA', 'AAA'
    issues_found JSONB DEFAULT '[]'::jsonb,
    issues_resolved JSONB DEFAULT '[]'::jsonb,
    compliance_score INTEGER, -- 0-100
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster accessibility audit lookups
CREATE INDEX IF NOT EXISTS idx_accessibility_audits_video_id ON accessibility_audits(video_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_audits_auditor_id ON accessibility_audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_audits_audit_type ON accessibility_audits(audit_type);

-- Create user accessibility preferences table
CREATE TABLE IF NOT EXISTS user_accessibility_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    high_contrast_mode BOOLEAN DEFAULT FALSE,
    reduced_motion BOOLEAN DEFAULT FALSE,
    large_text BOOLEAN DEFAULT FALSE,
    screen_reader_optimized BOOLEAN DEFAULT FALSE,
    captions_enabled BOOLEAN DEFAULT TRUE,
    captions_font_size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'x-large'
    captions_background_opacity DECIMAL(3,2) DEFAULT 0.75,
    keyboard_navigation_hints BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment documentation for preferences table
COMMENT ON TABLE user_accessibility_preferences IS 'User-specific accessibility settings for personalized experience';

-- Create index for faster preference lookups
CREATE INDEX IF NOT EXISTS idx_user_accessibility_preferences_user_id ON user_accessibility_preferences(user_id);

-- Enable RLS on new tables
ALTER TABLE accessibility_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accessibility_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for accessibility_audits
CREATE POLICY "Users can view audits for their own videos"
    ON accessibility_audits FOR SELECT
    USING (
        video_id IN (SELECT id FROM videos WHERE user_id = auth.uid())
        OR auditor_id = auth.uid()
    );

CREATE POLICY "Admins can manage all audits"
    ON accessibility_audits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS policies for user_accessibility_preferences
CREATE POLICY "Users can manage their own preferences"
    ON user_accessibility_preferences FOR ALL
    USING (user_id = auth.uid());

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accessibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_accessibility_audits_updated_at ON accessibility_audits;
CREATE TRIGGER update_accessibility_audits_updated_at
    BEFORE UPDATE ON accessibility_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_accessibility_updated_at();

DROP TRIGGER IF EXISTS update_user_accessibility_preferences_updated_at ON user_accessibility_preferences;
CREATE TRIGGER update_user_accessibility_preferences_updated_at
    BEFORE UPDATE ON user_accessibility_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_accessibility_updated_at();

-- Insert default accessibility preferences for existing users
INSERT INTO user_accessibility_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_accessibility_preferences)
ON CONFLICT (user_id) DO NOTHING;
