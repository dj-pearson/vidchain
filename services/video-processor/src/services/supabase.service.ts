import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import { basename } from 'path';
import type { ProcessingResult, ProcessingStatus } from '../types/index.js';

let supabase: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabase;
}

/**
 * Update video processing status in database
 */
export async function updateVideoStatus(
  videoId: string,
  status: ProcessingStatus,
  progress: number,
  error?: string
): Promise<void> {
  const client = getSupabaseClient();

  const updateData: Record<string, unknown> = {
    processing_status: status,
    processing_progress: progress,
    updated_at: new Date().toISOString(),
  };

  if (error) {
    updateData.processing_error = error;
  }

  const { error: updateError } = await client
    .from('videos')
    .update(updateData)
    .eq('id', videoId);

  if (updateError) {
    console.error('Failed to update video status:', updateError);
    throw new Error(`Failed to update video status: ${updateError.message}`);
  }
}

/**
 * Save processing result to database
 */
export async function saveProcessingResult(
  videoId: string,
  result: ProcessingResult
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('videos')
    .update({
      sha256_hash: result.sha256Hash,
      duration: result.metadata.duration,
      width: result.metadata.width,
      height: result.metadata.height,
      fps: result.metadata.fps,
      codec: result.metadata.codec,
      bitrate: result.metadata.bitrate,
      file_size: result.metadata.size,
      processing_status: 'completed',
      processing_progress: 100,
      processed_at: result.processedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId);

  if (error) {
    throw new Error(`Failed to save processing result: ${error.message}`);
  }
}

/**
 * Upload thumbnail to Supabase storage
 */
export async function uploadThumbnail(
  videoId: string,
  thumbnailPath: string,
  index: number
): Promise<string> {
  const client = getSupabaseClient();
  const fileName = `${videoId}/thumbnail_${index}.jpg`;
  const bucket = 'thumbnails';

  // Read file as buffer
  const { readFile } = await import('fs/promises');
  const fileBuffer = await readFile(thumbnailPath);

  const { error } = await client.storage
    .from(bucket)
    .upload(fileName, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = client.storage.from(bucket).getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Save thumbnail URLs to database
 */
export async function saveThumbnailUrls(
  videoId: string,
  thumbnailUrls: string[]
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('videos')
    .update({
      thumbnail_urls: thumbnailUrls,
      primary_thumbnail_url: thumbnailUrls[0] || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId);

  if (error) {
    throw new Error(`Failed to save thumbnail URLs: ${error.message}`);
  }
}

/**
 * Get video record from database
 */
export async function getVideo(videoId: string): Promise<{
  id: string;
  storage_url: string;
  organization_id: string;
  user_id: string;
} | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('videos')
    .select('id, storage_url, organization_id, user_id')
    .eq('id', videoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get video: ${error.message}`);
  }

  return data;
}

/**
 * Create a verification record after processing
 */
export async function createVerificationRecord(
  videoId: string,
  sha256Hash: string,
  organizationId: string,
  userId: string
): Promise<string> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('verifications')
    .insert({
      video_id: videoId,
      sha256_hash: sha256Hash,
      organization_id: organizationId,
      user_id: userId,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create verification record: ${error.message}`);
  }

  return data.id;
}

/**
 * Get pending videos for processing
 */
export async function getPendingVideos(limit: number = 10): Promise<
  Array<{
    id: string;
    storage_url: string;
    organization_id: string;
    user_id: string;
  }>
> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('videos')
    .select('id, storage_url, organization_id, user_id')
    .eq('processing_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get pending videos: ${error.message}`);
  }

  return data || [];
}
