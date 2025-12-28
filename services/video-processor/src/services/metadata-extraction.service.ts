/**
 * Enhanced Metadata Extraction Service
 * Extracts comprehensive metadata from video files using ffprobe and exiftool
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import type { VideoSourceMetadata, ExtendedVideoMetadata } from '../types/metadata.js';

const exec = promisify(execCallback);

// Environment configuration
const EXIFTOOL_PATH = process.env.EXIFTOOL_PATH || 'exiftool';
const FFPROBE_PATH = process.env.FFPROBE_PATH || 'ffprobe';

// GPS coordinate parsing regex
const GPS_REGEX = /(\d+)\s*deg\s*(\d+)'\s*([\d.]+)"\s*([NSEW])/i;

/**
 * Parse GPS coordinate string to decimal degrees
 */
function parseGPSCoordinate(coord: string): number | null {
  const match = coord.match(GPS_REGEX);
  if (!match) {
    // Try parsing as decimal
    const decimal = parseFloat(coord);
    return isNaN(decimal) ? null : decimal;
  }

  const degrees = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseFloat(match[3]);
  const direction = match[4].toUpperCase();

  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
}

/**
 * Parse date string from various formats to ISO string
 */
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Common EXIF date formats
  const formats = [
    // EXIF format: "2024:01:15 14:30:00"
    /^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
    // ISO format
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    // FFmpeg format: "2024-01-15T14:30:00.000000Z"
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z?/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      // Convert EXIF format to ISO
      if (format === formats[0]) {
        return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
      }
      return dateStr;
    }
  }

  // Try Date.parse as fallback
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? null : new Date(parsed).toISOString();
}

/**
 * Extract metadata using exiftool (comprehensive EXIF/XMP/container metadata)
 */
export async function extractExifMetadata(
  filePath: string
): Promise<Partial<VideoSourceMetadata>> {
  try {
    // Run exiftool with JSON output
    const { stdout } = await exec(
      `${EXIFTOOL_PATH} -json -all -G1 "${filePath}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large metadata
    );

    const results = JSON.parse(stdout);
    if (!results || results.length === 0) {
      return {};
    }

    const data = results[0];
    const metadata: Partial<VideoSourceMetadata> = {
      raw_metadata: data,
    };

    // Device information
    metadata.capture_device_make =
      data['EXIF:Make'] ||
      data['QuickTime:Make'] ||
      data['XMP:Make'] ||
      data['MakerNotes:Make'];

    metadata.capture_device_model =
      data['EXIF:Model'] ||
      data['QuickTime:Model'] ||
      data['XMP:Model'] ||
      data['MakerNotes:Model'];

    metadata.capture_device_serial =
      data['EXIF:SerialNumber'] ||
      data['MakerNotes:SerialNumber'] ||
      data['XMP:SerialNumber'];

    // Software information
    metadata.capture_software =
      data['EXIF:Software'] ||
      data['QuickTime:Software'] ||
      data['XMP:CreatorTool'] ||
      data['XMP:Software'];

    metadata.capture_software_version =
      data['QuickTime:SoftwareVersion'] ||
      data['XMP:SoftwareVersion'];

    // Timestamps
    const captureDate =
      data['EXIF:DateTimeOriginal'] ||
      data['QuickTime:CreateDate'] ||
      data['QuickTime:MediaCreateDate'] ||
      data['XMP:CreateDate'] ||
      data['File:FileModifyDate'];

    if (captureDate) {
      metadata.original_capture_date = parseDate(captureDate);
    }

    metadata.file_creation_date = parseDate(
      data['File:FileAccessDate'] || data['System:FileCreateDate']
    );
    metadata.file_modification_date = parseDate(
      data['File:FileModifyDate'] || data['System:FileModifyDate']
    );

    // GPS coordinates
    const gpsLat =
      data['EXIF:GPSLatitude'] ||
      data['Composite:GPSLatitude'] ||
      data['QuickTime:GPSLatitude'] ||
      data['XMP:GPSLatitude'];

    const gpsLon =
      data['EXIF:GPSLongitude'] ||
      data['Composite:GPSLongitude'] ||
      data['QuickTime:GPSLongitude'] ||
      data['XMP:GPSLongitude'];

    const gpsAlt =
      data['EXIF:GPSAltitude'] ||
      data['Composite:GPSAltitude'] ||
      data['QuickTime:GPSAltitude'];

    if (gpsLat) {
      metadata.gps_latitude = parseGPSCoordinate(String(gpsLat));
    }
    if (gpsLon) {
      metadata.gps_longitude = parseGPSCoordinate(String(gpsLon));
    }
    if (gpsAlt) {
      const alt = parseFloat(String(gpsAlt).replace(/[^\d.-]/g, ''));
      if (!isNaN(alt)) {
        metadata.gps_altitude = alt;
      }
    }

    // Embedded content metadata
    metadata.embedded_title =
      data['QuickTime:Title'] ||
      data['XMP:Title'] ||
      data['ID3:Title'];

    metadata.embedded_artist =
      data['QuickTime:Artist'] ||
      data['XMP:Artist'] ||
      data['XMP:Creator'] ||
      data['ID3:Artist'];

    metadata.embedded_copyright =
      data['QuickTime:Copyright'] ||
      data['XMP:Copyright'] ||
      data['EXIF:Copyright'];

    metadata.embedded_description =
      data['QuickTime:Description'] ||
      data['XMP:Description'] ||
      data['EXIF:ImageDescription'];

    metadata.embedded_comment =
      data['QuickTime:Comment'] ||
      data['XMP:Comment'] ||
      data['EXIF:UserComment'];

    // Container/encoder information
    metadata.container_format =
      data['File:FileType'] ||
      data['File:MIMEType'];

    metadata.encoder_name =
      data['QuickTime:Encoder'] ||
      data['QuickTime:HandlerDescription'] ||
      data['Matroska:MuxingApp'];

    metadata.encoder_version =
      data['QuickTime:EncoderVersion'] ||
      data['Matroska:WritingApp'];

    // Audio language
    metadata.audio_language =
      data['QuickTime:AudioLanguage'] ||
      data['Matroska:AudioLanguage'];

    return metadata;
  } catch (error) {
    console.warn('ExifTool extraction failed, falling back to ffprobe only:', error);
    return {};
  }
}

/**
 * Extract extended video metadata using ffprobe
 */
export async function extractFFprobeMetadata(
  filePath: string
): Promise<ExtendedVideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        reject(new Error(`FFprobe failed: ${err.message}`));
        return;
      }

      const videoStream = data.streams.find((s) => s.codec_type === 'video');
      const audioStream = data.streams.find((s) => s.codec_type === 'audio');
      const format = data.format;

      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      // Parse frame rate
      let fps = 0;
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
        fps = den ? num / den : num;
      }

      // Calculate aspect ratio
      const width = videoStream.width || 0;
      const height = videoStream.height || 0;
      const aspectRatio = height > 0 ? width / height : 0;

      const metadata: ExtendedVideoMetadata = {
        // Basic info
        duration: format.duration || 0,
        width,
        height,
        fps: Math.round(fps * 100) / 100,
        codec: videoStream.codec_name || 'unknown',
        bitrate: format.bit_rate ? parseInt(format.bit_rate) : 0,
        size: format.size ? parseInt(format.size) : 0,
        format: format.format_name || 'unknown',
        aspectRatio,

        // Extended video info
        colorSpace: videoStream.color_space,
        colorPrimaries: videoStream.color_primaries,
        colorTransfer: videoStream.color_transfer,
        bitDepth: videoStream.bits_per_raw_sample
          ? parseInt(videoStream.bits_per_raw_sample)
          : undefined,
        pixelFormat: videoStream.pix_fmt,
        profile: videoStream.profile,
        level: videoStream.level,

        // Rotation (from side_data or tags)
        rotation: extractRotation(videoStream),

        // Audio info
        audioCodec: audioStream?.codec_name,
        audioChannels: audioStream?.channels,
        audioBitrate: audioStream?.bit_rate
          ? parseInt(audioStream.bit_rate)
          : undefined,
        audioSampleRate: audioStream?.sample_rate
          ? parseInt(audioStream.sample_rate)
          : undefined,
        audioBitDepth: audioStream?.bits_per_sample,

        // Container tags (may contain creation_time, etc.)
        containerTags: format.tags || {},
      };

      // Extract creation time from format tags
      if (format.tags?.creation_time) {
        metadata.creationTime = parseDate(format.tags.creation_time);
      }

      resolve(metadata);
    });
  });
}

/**
 * Extract rotation from video stream metadata
 */
function extractRotation(videoStream: any): number {
  // Check side_data for rotation
  if (videoStream.side_data_list) {
    const displayMatrix = videoStream.side_data_list.find(
      (sd: any) => sd.side_data_type === 'Display Matrix'
    );
    if (displayMatrix?.rotation !== undefined) {
      return Math.abs(displayMatrix.rotation);
    }
  }

  // Check tags
  if (videoStream.tags?.rotate) {
    return parseInt(videoStream.tags.rotate, 10);
  }

  return 0;
}

/**
 * Combine all metadata sources into comprehensive VideoSourceMetadata
 */
export async function extractComprehensiveMetadata(
  filePath: string,
  videoId: string
): Promise<{ sourceMetadata: VideoSourceMetadata; extendedMetadata: ExtendedVideoMetadata }> {
  // Run both extractions in parallel
  const [exifData, ffprobeData] = await Promise.all([
    extractExifMetadata(filePath),
    extractFFprobeMetadata(filePath),
  ]);

  // Merge EXIF data with ffprobe-derived data
  const sourceMetadata: VideoSourceMetadata = {
    id: '', // Will be set by database
    video_id: videoId,

    // Device info (from EXIF)
    capture_device_make: exifData.capture_device_make,
    capture_device_model: exifData.capture_device_model,
    capture_device_serial: exifData.capture_device_serial,
    capture_software: exifData.capture_software,
    capture_software_version: exifData.capture_software_version,

    // Timestamps - prefer EXIF, fallback to ffprobe
    original_capture_date:
      exifData.original_capture_date || ffprobeData.creationTime,
    file_creation_date: exifData.file_creation_date,
    file_modification_date: exifData.file_modification_date,

    // GPS (from EXIF)
    gps_latitude: exifData.gps_latitude,
    gps_longitude: exifData.gps_longitude,
    gps_altitude: exifData.gps_altitude,
    location_name: exifData.location_name,

    // Embedded metadata (from EXIF)
    embedded_title: exifData.embedded_title,
    embedded_artist: exifData.embedded_artist,
    embedded_copyright: exifData.embedded_copyright,
    embedded_description: exifData.embedded_description,
    embedded_comment: exifData.embedded_comment,

    // Technical - from ffprobe
    color_space: ffprobeData.colorSpace,
    color_primaries: ffprobeData.colorPrimaries,
    color_transfer: ffprobeData.colorTransfer,
    bit_depth: ffprobeData.bitDepth,
    hdr_format: detectHDRFormat(ffprobeData),
    rotation: ffprobeData.rotation,

    // Audio - from ffprobe
    audio_sample_rate: ffprobeData.audioSampleRate,
    audio_bit_depth: ffprobeData.audioBitDepth,
    audio_language: exifData.audio_language,

    // Container
    container_format: exifData.container_format || ffprobeData.format,
    encoder_name: exifData.encoder_name,
    encoder_version: exifData.encoder_version,

    // Raw metadata
    raw_metadata: {
      exif: exifData.raw_metadata,
      ffprobe_tags: ffprobeData.containerTags,
    },

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { sourceMetadata, extendedMetadata: ffprobeData };
}

/**
 * Detect HDR format from video metadata
 */
function detectHDRFormat(metadata: ExtendedVideoMetadata): string | undefined {
  const { colorTransfer, colorPrimaries, bitDepth } = metadata;

  if (bitDepth && bitDepth >= 10) {
    if (colorTransfer === 'smpte2084') {
      return 'HDR10';
    }
    if (colorTransfer === 'arib-std-b67') {
      return 'HLG';
    }
    if (colorPrimaries === 'bt2020') {
      return 'HDR (BT.2020)';
    }
  }

  return undefined;
}

/**
 * Reverse geocode GPS coordinates to location name
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  // Use a free geocoding service (Nominatim)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
      {
        headers: {
          'User-Agent': 'VidChain/1.0',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Build a concise location name
    const parts: string[] = [];

    if (data.address) {
      const addr = data.address;

      // City/town
      const city = addr.city || addr.town || addr.village || addr.municipality;
      if (city) parts.push(city);

      // State/region
      const state = addr.state || addr.region || addr.county;
      if (state && state !== city) parts.push(state);

      // Country (use code for brevity)
      if (addr.country_code) {
        parts.push(addr.country_code.toUpperCase());
      }
    }

    return parts.length > 0 ? parts.join(', ') : null;
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return null;
  }
}

/**
 * Extract frame at specific timestamp for hashing
 */
export async function extractFrameAtTimestamp(
  filePath: string,
  timestamp: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .seekInput(timestamp)
      .frames(1)
      .size('320x?') // Small size for hashing
      .outputOptions(['-q:v 2'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`Frame extraction failed: ${err.message}`)))
      .run();
  });
}

/**
 * Extract multiple frames distributed through video for perceptual hashing
 */
export async function extractKeyFrames(
  filePath: string,
  outputDir: string,
  count: number = 5
): Promise<{ timestamp: number; path: string }[]> {
  const ffprobeData = await extractFFprobeMetadata(filePath);
  const duration = ffprobeData.duration;

  if (duration <= 0) {
    throw new Error('Cannot extract frames from video with zero duration');
  }

  const { mkdir } = await import('fs/promises');
  await mkdir(outputDir, { recursive: true });

  const frames: { timestamp: number; path: string }[] = [];

  for (let i = 0; i < count; i++) {
    // Distribute frames from 10% to 90% of video
    const position = 0.1 + (0.8 * i) / Math.max(1, count - 1);
    const timestamp = Math.floor(duration * position);
    const outputPath = `${outputDir}/frame_${i}_${timestamp}s.jpg`;

    await extractFrameAtTimestamp(filePath, timestamp, outputPath);
    frames.push({ timestamp, path: outputPath });
  }

  return frames;
}
