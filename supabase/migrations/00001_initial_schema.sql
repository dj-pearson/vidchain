-- VidChain Database Schema
-- Initial migration for self-hosted Supabase on Coolify

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('user', 'admin', 'organization_admin');
CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'enterprise', 'academic');
CREATE TYPE video_status AS ENUM ('uploading', 'processing', 'ready', 'failed');
CREATE TYPE verification_status AS ENUM ('pending', 'processing', 'verified', 'failed');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website TEXT,
    tier subscription_tier NOT NULL DEFAULT 'starter',
    verification_limit INTEGER NOT NULL DEFAULT 50,
    api_key VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    wallet_address VARCHAR(42),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    filename VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    duration DECIMAL(10, 2) NOT NULL DEFAULT 0,
    resolution VARCHAR(20) NOT NULL DEFAULT '0x0',
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    thumbnail_url TEXT,
    status video_status NOT NULL DEFAULT 'uploading',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verifications table
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sha256_hash VARCHAR(64) NOT NULL,
    ipfs_cid VARCHAR(100) NOT NULL,
    ipfs_cid_hash VARCHAR(64) NOT NULL,
    perceptual_hash VARCHAR(64),
    token_id INTEGER,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    blockchain_timestamp TIMESTAMPTZ,
    owner_address VARCHAR(42),
    status verification_status NOT NULL DEFAULT 'pending',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique hash per blockchain
    CONSTRAINT unique_sha256_hash UNIQUE (sha256_hash)
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    metadata JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_organization_id ON videos(organization_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);

CREATE INDEX idx_verifications_video_id ON verifications(video_id);
CREATE INDEX idx_verifications_user_id ON verifications(user_id);
CREATE INDEX idx_verifications_sha256_hash ON verifications(sha256_hash);
CREATE INDEX idx_verifications_token_id ON verifications(token_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_created_at ON verifications(created_at DESC);

CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at
    BEFORE UPDATE ON verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view organization members"
    ON users FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Videos policies
CREATE POLICY "Users can view own videos"
    ON videos FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own videos"
    ON videos FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own videos"
    ON videos FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own videos"
    ON videos FOR DELETE
    USING (user_id = auth.uid());

CREATE POLICY "Organization members can view org videos"
    ON videos FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Verifications policies
CREATE POLICY "Users can view own verifications"
    ON verifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own verifications"
    ON verifications FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view verified content by hash"
    ON verifications FOR SELECT
    USING (status = 'verified');

-- Organizations policies
CREATE POLICY "Organization members can view org"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can update org"
    ON organizations FOR UPDATE
    USING (
        id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role = 'organization_admin'
        )
    );

-- API Keys policies
CREATE POLICY "Organization admins can manage API keys"
    ON api_keys FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role = 'organization_admin'
        )
    );

-- Audit logs policies
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own videos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view own videos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own videos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'videos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Anyone can view thumbnails"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload thumbnails"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'thumbnails' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
