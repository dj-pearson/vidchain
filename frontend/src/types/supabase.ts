// Supabase Database Types
// These types are generated based on the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          wallet_address: string | null
          organization_id: string | null
          role: 'user' | 'admin' | 'organization_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          wallet_address?: string | null
          organization_id?: string | null
          role?: 'user' | 'admin' | 'organization_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          wallet_address?: string | null
          organization_id?: string | null
          role?: 'user' | 'admin' | 'organization_admin'
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          website: string | null
          tier: 'starter' | 'professional' | 'enterprise' | 'academic'
          verification_limit: number
          api_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          website?: string | null
          tier?: 'starter' | 'professional' | 'enterprise' | 'academic'
          verification_limit?: number
          api_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          website?: string | null
          tier?: 'starter' | 'professional' | 'enterprise' | 'academic'
          verification_limit?: number
          api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          title: string
          description: string | null
          filename: string
          file_size: number
          duration: number
          resolution: string
          mime_type: string
          storage_path: string
          thumbnail_url: string | null
          status: 'uploading' | 'processing' | 'ready' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          title: string
          description?: string | null
          filename: string
          file_size: number
          duration?: number
          resolution?: string
          mime_type: string
          storage_path: string
          thumbnail_url?: string | null
          status?: 'uploading' | 'processing' | 'ready' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          title?: string
          description?: string | null
          filename?: string
          file_size?: number
          duration?: number
          resolution?: string
          mime_type?: string
          storage_path?: string
          thumbnail_url?: string | null
          status?: 'uploading' | 'processing' | 'ready' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      verifications: {
        Row: {
          id: string
          video_id: string
          user_id: string
          sha256_hash: string
          ipfs_cid: string
          ipfs_cid_hash: string
          perceptual_hash: string | null
          token_id: number | null
          transaction_hash: string | null
          block_number: number | null
          blockchain_timestamp: string | null
          owner_address: string | null
          status: 'pending' | 'processing' | 'verified' | 'failed'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          sha256_hash: string
          ipfs_cid: string
          ipfs_cid_hash: string
          perceptual_hash?: string | null
          token_id?: number | null
          transaction_hash?: string | null
          block_number?: number | null
          blockchain_timestamp?: string | null
          owner_address?: string | null
          status?: 'pending' | 'processing' | 'verified' | 'failed'
          metadata: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          sha256_hash?: string
          ipfs_cid?: string
          ipfs_cid_hash?: string
          perceptual_hash?: string | null
          token_id?: number | null
          transaction_hash?: string | null
          block_number?: number | null
          blockchain_timestamp?: string | null
          owner_address?: string | null
          status?: 'pending' | 'processing' | 'verified' | 'failed'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          organization_id: string
          name: string
          key_hash: string
          last_used_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          key_hash: string
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          key_hash?: string
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          organization_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'admin' | 'organization_admin'
      subscription_tier: 'starter' | 'professional' | 'enterprise' | 'academic'
      video_status: 'uploading' | 'processing' | 'ready' | 'failed'
      verification_status: 'pending' | 'processing' | 'verified' | 'failed'
    }
  }
}
