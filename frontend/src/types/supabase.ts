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
      video_source_metadata: {
        Row: {
          id: string
          video_id: string
          capture_device_make: string | null
          capture_device_model: string | null
          capture_device_serial: string | null
          capture_software: string | null
          capture_software_version: string | null
          original_capture_date: string | null
          file_creation_date: string | null
          file_modification_date: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          gps_altitude: number | null
          location_name: string | null
          embedded_title: string | null
          embedded_artist: string | null
          embedded_copyright: string | null
          embedded_description: string | null
          embedded_comment: string | null
          color_space: string | null
          color_primaries: string | null
          color_transfer: string | null
          bit_depth: number | null
          hdr_format: string | null
          rotation: number
          audio_sample_rate: number | null
          audio_bit_depth: number | null
          audio_language: string | null
          container_format: string | null
          encoder_name: string | null
          encoder_version: string | null
          raw_metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          capture_device_make?: string | null
          capture_device_model?: string | null
          capture_device_serial?: string | null
          capture_software?: string | null
          capture_software_version?: string | null
          original_capture_date?: string | null
          file_creation_date?: string | null
          file_modification_date?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_altitude?: number | null
          location_name?: string | null
          embedded_title?: string | null
          embedded_artist?: string | null
          embedded_copyright?: string | null
          embedded_description?: string | null
          embedded_comment?: string | null
          color_space?: string | null
          color_primaries?: string | null
          color_transfer?: string | null
          bit_depth?: number | null
          hdr_format?: string | null
          rotation?: number
          audio_sample_rate?: number | null
          audio_bit_depth?: number | null
          audio_language?: string | null
          container_format?: string | null
          encoder_name?: string | null
          encoder_version?: string | null
          raw_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          capture_device_make?: string | null
          capture_device_model?: string | null
          capture_device_serial?: string | null
          capture_software?: string | null
          capture_software_version?: string | null
          original_capture_date?: string | null
          file_creation_date?: string | null
          file_modification_date?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_altitude?: number | null
          location_name?: string | null
          embedded_title?: string | null
          embedded_artist?: string | null
          embedded_copyright?: string | null
          embedded_description?: string | null
          embedded_comment?: string | null
          color_space?: string | null
          color_primaries?: string | null
          color_transfer?: string | null
          bit_depth?: number | null
          hdr_format?: string | null
          rotation?: number
          audio_sample_rate?: number | null
          audio_bit_depth?: number | null
          audio_language?: string | null
          container_format?: string | null
          encoder_name?: string | null
          encoder_version?: string | null
          raw_metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      provenance_records: {
        Row: {
          id: string
          verification_id: string
          action: 'created' | 'uploaded' | 'verified' | 'minted' | 'transferred' | 'listed' | 'sold' | 'relisted' | 'delisted' | 'metadata_updated' | 'duplicate_detected'
          actor_id: string | null
          actor_address: string | null
          actor_name: string | null
          transaction_hash: string | null
          block_number: number | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          from_address: string | null
          to_address: string | null
          price_amount: number | null
          price_currency: string | null
          created_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          action: 'created' | 'uploaded' | 'verified' | 'minted' | 'transferred' | 'listed' | 'sold' | 'relisted' | 'delisted' | 'metadata_updated' | 'duplicate_detected'
          actor_id?: string | null
          actor_address?: string | null
          actor_name?: string | null
          transaction_hash?: string | null
          block_number?: number | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          from_address?: string | null
          to_address?: string | null
          price_amount?: number | null
          price_currency?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          action?: 'created' | 'uploaded' | 'verified' | 'minted' | 'transferred' | 'listed' | 'sold' | 'relisted' | 'delisted' | 'metadata_updated' | 'duplicate_detected'
          actor_id?: string | null
          actor_address?: string | null
          actor_name?: string | null
          transaction_hash?: string | null
          block_number?: number | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          from_address?: string | null
          to_address?: string | null
          price_amount?: number | null
          price_currency?: string | null
          created_at?: string
        }
      }
      perceptual_hash_index: {
        Row: {
          id: string
          verification_id: string
          video_id: string
          phash_video: string
          phash_thumbnail: string | null
          dhash_video: string | null
          ahash_video: string | null
          frame_phashes: Json
          duration_seconds: number
          aspect_ratio: number
          created_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          video_id: string
          phash_video: string
          phash_thumbnail?: string | null
          dhash_video?: string | null
          ahash_video?: string | null
          frame_phashes?: Json
          duration_seconds: number
          aspect_ratio: number
          created_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          video_id?: string
          phash_video?: string
          phash_thumbnail?: string | null
          dhash_video?: string | null
          ahash_video?: string | null
          frame_phashes?: Json
          duration_seconds?: number
          aspect_ratio?: number
          created_at?: string
        }
      }
      overlay_settings: {
        Row: {
          id: string
          verification_id: string
          top_left_content: Json
          top_right_content: Json
          bottom_left_content: Json
          bottom_right_content: Json
          font_family: string
          font_size: number
          text_color: string
          background_color: string
          background_opacity: number
          corner_radius: number
          padding: number
          margin: number
          show_on_playback: boolean
          show_on_download: boolean
          burn_into_export: boolean
          fade_in_duration: number
          auto_hide_after: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          top_left_content?: Json
          top_right_content?: Json
          bottom_left_content?: Json
          bottom_right_content?: Json
          font_family?: string
          font_size?: number
          text_color?: string
          background_color?: string
          background_opacity?: number
          corner_radius?: number
          padding?: number
          margin?: number
          show_on_playback?: boolean
          show_on_download?: boolean
          burn_into_export?: boolean
          fade_in_duration?: number
          auto_hide_after?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          top_left_content?: Json
          top_right_content?: Json
          bottom_left_content?: Json
          bottom_right_content?: Json
          font_family?: string
          font_size?: number
          text_color?: string
          background_color?: string
          background_opacity?: number
          corner_radius?: number
          padding?: number
          margin?: number
          show_on_playback?: boolean
          show_on_download?: boolean
          burn_into_export?: boolean
          fade_in_duration?: number
          auto_hide_after?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hamming_distance: {
        Args: { hash1: string; hash2: string }
        Returns: number
      }
      find_similar_videos: {
        Args: { target_phash: string; max_distance?: number; limit_count?: number }
        Returns: {
          verification_id: string
          video_id: string
          phash: string
          distance: number
          similarity: number
        }[]
      }
      record_provenance: {
        Args: {
          p_verification_id: string
          p_action: string
          p_actor_id?: string
          p_actor_address?: string
          p_details?: Json
        }
        Returns: string
      }
    }
    Enums: {
      user_role: 'user' | 'admin' | 'organization_admin'
      subscription_tier: 'starter' | 'professional' | 'enterprise' | 'academic'
      video_status: 'uploading' | 'processing' | 'ready' | 'failed'
      verification_status: 'pending' | 'processing' | 'verified' | 'failed'
      content_category: 'art' | 'music' | 'documentary' | 'sports' | 'gaming' | 'education' | 'entertainment' | 'news' | 'personal' | 'commercial' | 'other'
      content_rating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
      provenance_action: 'created' | 'uploaded' | 'verified' | 'minted' | 'transferred' | 'listed' | 'sold' | 'relisted' | 'delisted' | 'metadata_updated' | 'duplicate_detected'
    }
  }
}
